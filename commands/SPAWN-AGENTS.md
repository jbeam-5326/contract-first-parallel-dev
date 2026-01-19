# Agent Spawn Prompts

Copy-paste these prompts to spawn agents for contract generation and implementation.

---

## Phase 1: Contract Generation (Parallel)

### Prompt Template

Replace `{DOMAIN_NAME}` with your domain name (e.g., User, Order, Product).

```
Generate a complete domain contract for {DOMAIN_NAME}.

## Context
This is part of a multi-domain system. Use ONLY the types defined in the shared primitives file. Do NOT invent new shared types.

## Input Files
Read these files for context:
- shared-primitives.md OR src/shared/shared.types.ts (the shared vocabulary)

## Required Contract Sections

### 1. Types
- Core entity (the main thing this domain owns)
- Supporting types (internal to this domain)
- Input types (Create{Entity}Input, Update{Entity}Input)
- Query types ({Entity}Filters)

### 2. Service Interface
- Complete I{Domain}Service interface
- All methods with full TypeScript signatures
- JSDoc comments describing each method
- Document which errors each method can throw

### 3. API Routes
Table format:
| Method | Path | Request | Response | Auth | Description |

### 4. Cross-Domain Dependencies
- IMPORTS: What types this domain needs from shared primitives
- EXPORTS: What this domain provides to others ({Entity}Ref, events)
- Events this domain publishes
- Events this domain consumes

### 5. Database Schema
Prisma model with:
- All fields with types
- Relations
- Indexes for common queries
- Column mappings (snake_case)

### 6. Validation Rules
Table format:
| Field | Rule | Error Code |

Include:
- Format validations (email, phone, etc.)
- Range validations (min/max values)
- Business rules (e.g., ship date must be 4+ weeks away)

### 7. Error Codes
TypeScript const object with all domain-specific error codes:
```typescript
export const {Domain}ErrorCodes = {
  {DOMAIN}_001: 'Description',
  {DOMAIN}_002: 'Description',
  // ... all error codes
} as const;
```

## Requirements
- Be EXHAUSTIVE - include EVERY method, type, and field
- Use EXACT type names from shared primitives
- NO TODOs, TBDs, or placeholders
- A build agent should be able to implement this WITHOUT ASKING QUESTIONS
- Include realistic validation rules with specific ranges/formats
- Document all error scenarios

## Output
Write the complete contract to: contracts/{DOMAIN_NAME}-CONTRACT.md
```

---

## Phase 2: Implementation (Parallel)

### Prompt Template

Replace `{DOMAIN_NAME}` and `{domain}` (lowercase) with your domain.

```
Implement the {DOMAIN_NAME} domain from contracts/{DOMAIN_NAME}-CONTRACT.md.

## Input Files
Read these files:
- contracts/{DOMAIN_NAME}-CONTRACT.md (the complete contract)
- src/shared/shared.types.ts (compiled shared primitives)

## Files to Create

### 1. src/{domain}/{domain}.types.ts
Include:
- All types from Contract Section 1
- Service interface from Contract Section 2
- Repository interface (I{Entity}Repository)
- Error codes from Contract Section 7

### 2. src/{domain}/{domain}.service.ts
Include:
- Class implementing I{Domain}Service
- ALL methods from the contract
- Proper error handling using error codes
- Input validation per Contract Section 6
- Constructor that accepts repository dependency

### 3. src/{domain}/{domain}.repository.ts
Include:
- Interface I{Entity}Repository
- InMemory{Entity}Repository implementation
- All CRUD operations needed by the service
- Simple Map-based storage

## Requirements

### DO:
- Implement EVERY method in the service interface
- Use EXACT types from the contract (no changes)
- Handle ALL error codes from the contract
- Follow ALL validation rules from Contract Section 6
- Import shared types from '../shared/shared.types'
- Use successResponse() and errorResponse() helpers

### DO NOT:
- Add methods not in the contract
- Change parameter or return types
- Invent new types not in the contract
- Change field names or types
- Skip any methods
- Add extra validation not in the contract

## Compilation Verification
After creating all files, verify compilation:
```bash
npx tsc --noEmit
```
Expected: 0 errors

If there are errors, fix them before completing.

## Output
Create all three files in src/{domain}/:
- {domain}.types.ts
- {domain}.service.ts
- {domain}.repository.ts
```

---

## Example: Spawning 5 Domains

### Contract Generation (All in Parallel)

```
# Open 5 terminals or use Task tool 5 times

Terminal 1: Generate contract for User domain...
Terminal 2: Generate contract for Order domain...
Terminal 3: Generate contract for Product domain...
Terminal 4: Generate contract for Payment domain...
Terminal 5: Generate contract for Notification domain...
```

### Verification (Sequential - DO NOT SKIP)

```bash
# Check all contracts exist
ls contracts/
# Expected: USER-CONTRACT.md, ORDER-CONTRACT.md, etc.

# Check for incomplete markers
grep -r "TODO\|TBD\|PLACEHOLDER" contracts/
# Expected: no matches

# Manual verification
# - All imports in each contract exist in shared.types.ts
# - No circular dependencies
# - Type shapes match across contracts
```

### Implementation (All in Parallel)

```
# Only after verification passes

Terminal 1: Implement User domain from contracts/USER-CONTRACT.md...
Terminal 2: Implement Order domain from contracts/ORDER-CONTRACT.md...
Terminal 3: Implement Product domain from contracts/PRODUCT-CONTRACT.md...
Terminal 4: Implement Payment domain from contracts/PAYMENT-CONTRACT.md...
Terminal 5: Implement Notification domain from contracts/NOTIFICATION-CONTRACT.md...
```

### Final Verification

```bash
# TypeScript compilation
npx tsc --noEmit
# Expected: no output (0 errors)

# File count
find src -name "*.ts" | wc -l
# Expected: 1 (shared) + 5 domains * 3 files = 16 files
```

---

## Troubleshooting

### Contract agents produce conflicting types

**Symptom:** Type A in Contract 1 doesn't match Type A in Contract 2

**Cause:** Shared vocabulary incomplete

**Fix:**
1. Add missing type to shared-primitives.md
2. Regenerate affected contracts

### Implementation agents ask questions

**Symptom:** Agent asks "Should I use X or Y?"

**Cause:** Contract is incomplete or ambiguous

**Fix:**
1. Update contract with explicit answer
2. Regenerate implementation

### TypeScript compilation errors

**Symptom:** `tsc --noEmit` shows errors

**Diagnosis:**
- Error in shared types → vocabulary issue
- Error in domain types → contract issue
- Import error → wrong path

**Fix:** Trace error to source, fix there, recompile

### Circular dependency detected

**Symptom:** Domain A imports from B, B imports from A

**Cause:** Domain boundaries incorrect

**Fix:**
1. Identify which domain should own the shared type
2. Move type to shared primitives
3. Update both contracts
4. Regenerate implementations

# Contract-First Parallel Development Methodology

## Overview

This document provides complete, precise instructions for implementing contract-first parallel development. An agent reading this document should be able to execute the methodology without asking questions.

---

## Prerequisites

Before starting:
- [ ] PRD or requirements document exists
- [ ] TypeScript project structure initialized
- [ ] `tsconfig.json` with `strict: true`
- [ ] Ability to spawn multiple Claude agents (Task tool or multiple terminals)

---

## Step 1: Analyze PRD and Identify Domains

**Mode:** Sequential
**Duration:** ~10 minutes
**Output:** Domain list with responsibilities

### Process

1. Read the entire PRD
2. Identify nouns that represent distinct data ownership
3. Group related functionality into bounded contexts
4. Document each domain's single responsibility

### Domain Identification Questions

Ask yourself:
- What data does this domain OWN (not reference)?
- What operations are internal to this domain?
- What would break if this domain changed?

### Output Format

```markdown
| Domain | Responsibility | Key Entities |
|--------|----------------|--------------|
| User | User accounts, authentication | User, Session |
| Order | Order lifecycle, payments | Order, Payment |
| Product | Catalog, inventory | Product, Category |
```

### Quality Check

- Each domain has ONE clear responsibility
- No entity appears in multiple domains as owner
- Cross-domain references are documented

---

## Step 2: Extract Shared Vocabulary

**Mode:** Sequential (CRITICAL - DO NOT PARALLELIZE)
**Duration:** ~30 minutes
**Output:** `shared-primitives.md` and `src/shared/shared.types.ts`

### Why This Step is Critical

**Incomplete vocabulary = total failure**

If you skip types, parallel agents will:
- Invent incompatible definitions
- Create type conflicts
- Generate code that doesn't compile
- Waste all parallel work

### What to Extract

#### 2.1 Identity Types (Branded IDs)

For EVERY entity that crosses domain boundaries:

```typescript
// Pattern: string & { readonly __brand: 'TypeName' }
export type UserId = string & { readonly __brand: 'UserId' };
export type OrderId = string & { readonly __brand: 'OrderId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
```

**Why branded types?**
- Prevents `userId` being passed where `orderId` expected
- Compile-time safety, zero runtime cost
- Forces explicit conversion

#### 2.2 Shared Enums

Any enum used by 2+ domains:

```typescript
export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled'
}

export enum UserRole {
  customer = 'customer',
  admin = 'admin',
  support = 'support'
}
```

#### 2.3 Cross-Domain References (Ref Types)

Minimal interfaces for cross-domain data access:

```typescript
// UserRef - used by Order domain to reference users
export interface UserRef {
  id: UserId;
  email: string;
  name: string;
}

// ProductRef - used by Order domain to reference products
export interface ProductRef {
  id: ProductId;
  name: string;
  price: number;
}
```

**Rules for Ref types:**
- Include ONLY fields other domains need
- Never include internal implementation details
- Prefer 3-5 fields maximum

#### 2.4 Standard Patterns

```typescript
// Timestamps
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
export type ISODate = string & { readonly __brand: 'ISODate' };

export interface Timestamps {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

#### 2.5 Utility Functions

```typescript
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

export function now(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}
```

### Completeness Checklist

Before proceeding to Step 3, verify:

- [ ] Every cross-domain entity has a branded ID type
- [ ] Every shared enum is defined
- [ ] Every cross-domain reference has a Ref interface
- [ ] API response wrapper is defined
- [ ] Pagination types are defined
- [ ] Timestamp types are defined
- [ ] File compiles with `tsc --noEmit`

**If any item is unchecked, DO NOT proceed. Complete it first.**

---

## Step 3: Generate Domain Contracts (Parallel)

**Mode:** Parallel (spawn N agents)
**Duration:** ~2 minutes per domain
**Output:** `contracts/{DOMAIN}-CONTRACT.md` for each domain

### Agent Spawn Prompt

```
Generate a complete domain contract for {DOMAIN_NAME}.

## Context
This is part of a multi-domain system. Use ONLY the types defined in shared-primitives.md. Do NOT invent new shared types.

## Attached Files
- shared-primitives.md (the shared vocabulary - use these types exactly)

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

### 3. API Routes
Table with: Method | Path | Request | Response | Description

### 4. Cross-Domain Dependencies
- IMPORTS: What types this domain needs from shared primitives
- EXPORTS: What this domain provides to others ({Entity}Ref, events)

### 5. Database Schema
Prisma model with all fields, relations, and indexes

### 6. Validation Rules
Table with: Field | Rule | Error Code

### 7. Error Codes
TypeScript const object with all domain-specific error codes

## Requirements
- Be exhaustive - include EVERY method, type, and field
- Use exact type names from shared primitives
- No TODOs, TBDs, or placeholders
- A build agent should be able to implement this without asking questions

## Output
Write to: contracts/{DOMAIN_NAME}-CONTRACT.md
```

### Parallel Execution

Spawn one agent per domain simultaneously:

```
Task 1: "Generate contract for User domain..."
Task 2: "Generate contract for Order domain..."
Task 3: "Generate contract for Product domain..."
Task 4: "Generate contract for Payment domain..."
```

All agents work independently with no communication.

---

## Step 4: Verify Contracts (Sequential)

**Mode:** Sequential (QUALITY GATE)
**Duration:** ~5-10 minutes
**Output:** Verified contracts ready for implementation

### Verification Checks

#### 4.1 Reference Resolution

For each contract, verify:
- All imported types exist in shared-primitives.md
- All Ref types match the source domain's definition
- No undefined types referenced

#### 4.2 Type Compatibility

Check that:
- Same types have same shapes across contracts
- Enum values match
- ID types are used consistently

#### 4.3 No Circular Dependencies

Verify dependency graph has no cycles:
```
User → (no dependencies)
Order → User, Product
Product → (no dependencies)
Payment → Order, User
```

#### 4.4 Completeness

Each contract must have:
- [ ] All 7 sections present
- [ ] No TODO/TBD/PLACEHOLDER markers
- [ ] All methods have return types
- [ ] All error codes defined

### Conflict Resolution Process

If conflicts found:

1. Identify the authoritative domain (who owns the data?)
2. Update the dependent domain's contract
3. Re-verify

**Do not proceed to Step 5 until verification passes.**

---

## Step 5: Build Implementation (Parallel)

**Mode:** Parallel (spawn N agents)
**Duration:** ~2-5 minutes per domain
**Output:** TypeScript files for each domain

### Agent Spawn Prompt

```
Implement the {DOMAIN_NAME} domain from contracts/{DOMAIN_NAME}-CONTRACT.md.

## Attached Files
- contracts/{DOMAIN_NAME}-CONTRACT.md (the complete contract)
- src/shared/shared.types.ts (compiled shared primitives)

## Files to Create

1. **src/{domain}/{domain}.types.ts**
   - All types from Section 1 of the contract
   - Service interface from Section 2
   - Repository interface
   - Error codes from Section 7

2. **src/{domain}/{domain}.service.ts**
   - Class implementing I{Domain}Service
   - All methods from the contract
   - Proper error handling using error codes
   - Input validation per Section 6

3. **src/{domain}/{domain}.repository.ts**
   - Interface I{Entity}Repository
   - InMemory{Entity}Repository implementation
   - All CRUD operations

## Requirements

### DO:
- Implement EVERY method in the service interface
- Use EXACT types from the contract (no changes)
- Handle ALL error codes from the contract
- Follow validation rules from Section 6
- Import shared types from '../shared/shared.types'

### DO NOT:
- Add methods not in the contract
- Change parameter or return types
- Invent new types not in the contract
- Skip any methods

## Compilation
The code must compile with: npx tsc --noEmit
Expected: 0 errors
```

### Final Verification

After all agents complete:

```bash
npx tsc --noEmit
```

Expected output: No errors.

If errors occur:
1. Identify the domain with errors
2. Check contract compliance
3. Fix type mismatches
4. Re-compile

---

## Timing Summary

| Step | Mode | Duration | Output |
|------|------|----------|--------|
| 1. Analyze PRD | Sequential | ~10 min | Domain list |
| 2. Extract Vocabulary | Sequential | ~30 min | shared-primitives.md |
| 3. Generate Contracts | Parallel | ~2 min each | N contract files |
| 4. Verify Contracts | Sequential | ~5-10 min | Verified contracts |
| 5. Build Implementation | Parallel | ~2-5 min each | N domain implementations |

**Total for 7 domains:** ~60 minutes (not 7x sequential time)

---

## File Structure

```
project/
├── package.json
├── tsconfig.json
├── shared-primitives.md           # Step 2 output (documentation)
├── contracts/
│   ├── USER-CONTRACT.md           # Step 3 output
│   ├── ORDER-CONTRACT.md
│   ├── PRODUCT-CONTRACT.md
│   └── ...
└── src/
    ├── shared/
    │   └── shared.types.ts        # Step 2 output (code)
    ├── user/
    │   ├── user.types.ts          # Step 5 output
    │   ├── user.service.ts
    │   └── user.repository.ts
    ├── order/
    │   ├── order.types.ts
    │   ├── order.service.ts
    │   └── order.repository.ts
    └── ...
```

---

## Success Criteria

The methodology succeeds when:

1. `npx tsc --noEmit` produces 0 errors
2. All contracts have all 7 sections
3. All service methods are implemented
4. No cross-domain type conflicts exist
5. Parallel agents required zero coordination

If any criterion fails, trace back to the responsible step and fix there.

# Quick Start Guide

Get from PRD to compiled TypeScript in 5 steps. Time estimate: 45-60 minutes for 5-10 domains.

---

## Prerequisites

```bash
# Initialize TypeScript project
npm init -y
npm install -D typescript @types/node tsx

# Create tsconfig.json with strict mode
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
EOF

# Create directory structure
mkdir -p src/shared contracts
```

---

## Step 1: Identify Domains (10 min)

Read your PRD. List every distinct data ownership area.

```markdown
| Domain | Responsibility | Key Entities |
|--------|----------------|--------------|
| User | Account management | User |
| Order | Order lifecycle | Order, OrderItem |
| Product | Catalog | Product, Category |
| Payment | Transactions | Payment, Refund |
```

---

## Step 2: Extract Shared Vocabulary (30 min)

Create `src/shared/shared.types.ts`:

```typescript
// ============================================
// BRANDED ID TYPES
// ============================================

export type UserId = string & { readonly __brand: 'UserId' };
export type OrderId = string & { readonly __brand: 'OrderId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
export type PaymentId = string & { readonly __brand: 'PaymentId' };

// ============================================
// SHARED ENUMS
// ============================================

export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled'
}

export enum PaymentStatus {
  pending = 'pending',
  completed = 'completed',
  failed = 'failed',
  refunded = 'refunded'
}

// ============================================
// CROSS-DOMAIN REFERENCES
// ============================================

export interface UserRef {
  id: UserId;
  email: string;
  name: string;
}

export interface ProductRef {
  id: ProductId;
  name: string;
  price: number;
}

export interface OrderRef {
  id: OrderId;
  userId: UserId;
  status: OrderStatus;
  total: number;
}

// ============================================
// STANDARD PATTERNS
// ============================================

export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };

export interface Timestamps {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// UTILITIES
// ============================================

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

**Verify it compiles:**
```bash
npx tsc --noEmit
# Expected: no output (0 errors)
```

---

## Step 3: Generate Contracts (Parallel)

Spawn one agent per domain. Use this prompt template:

```
Generate a complete domain contract for {DOMAIN_NAME}.

Use ONLY types from the shared vocabulary I'm providing.

Include these sections:
1. Types (entity, inputs, filters)
2. Service Interface (I{Domain}Service with all methods)
3. API Routes (table format)
4. Cross-Domain Dependencies
5. Database Schema (Prisma)
6. Validation Rules
7. Error Codes

No TODOs or placeholders. Be exhaustive.

Output to: contracts/{DOMAIN_NAME}-CONTRACT.md

[Paste shared.types.ts content here]
```

**Spawn all simultaneously:**
```
Agent 1: Generate contract for User domain...
Agent 2: Generate contract for Order domain...
Agent 3: Generate contract for Product domain...
Agent 4: Generate contract for Payment domain...
```

---

## Step 4: Verify Contracts (5 min)

Check each contract:

```bash
# All contracts exist?
ls contracts/

# No placeholders?
grep -r "TODO\|TBD\|PLACEHOLDER" contracts/

# All imports reference shared types?
# (Manual check: open each contract, verify imports exist in shared.types.ts)
```

Fix any issues before proceeding.

---

## Step 5: Build Implementation (Parallel)

Spawn one agent per domain:

```
Implement {DOMAIN_NAME} from contracts/{DOMAIN_NAME}-CONTRACT.md.

Create these files:
- src/{domain}/{domain}.types.ts
- src/{domain}/{domain}.service.ts
- src/{domain}/{domain}.repository.ts

Import shared types from '../shared/shared.types'.
Implement ALL methods in the service interface.
Use in-memory repository.

Must compile with: npx tsc --noEmit
```

---

## Final Verification

```bash
# All files created?
find src -name "*.ts" | wc -l

# Compiles?
npx tsc --noEmit
# Expected: no output (0 errors)
```

---

## Done!

You now have:
- Shared type definitions
- Complete contracts for each domain
- Type-safe service implementations
- In-memory repositories for testing

Next steps:
- Add API layer (Express, Hono, Fastify)
- Replace in-memory repos with database
- Add integration tests

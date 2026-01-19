# Lessons Learned & Knowledge Gained

Hard-won wisdom from building 2 production systems (LEO Automation: 7 domains, NSW v3: 11 domains) using contract-first parallel development.

---

## The Core Insight

> **"The shared vocabulary is the product. Everything else is mechanical."**

We spent 80% of thinking time on Step 2 (vocabulary extraction). The parallel work that followed was almost trivial because every possible integration point was already defined.

---

## What Worked Perfectly

### 1. Branded ID Types Prevent Cross-Domain Bugs

```typescript
// This pattern saved us countless integration issues
export type UserId = string & { readonly __brand: 'UserId' };
export type CandidateId = string & { readonly __brand: 'CandidateId' };
```

**Why it works:**
- Compile-time error if you pass `userId` where `candidateId` expected
- Zero runtime overhead (just strings at runtime)
- Forces explicit thinking about data ownership

**Real example from NSW v3:**
- 19 branded ID types
- 11 domains
- Zero ID-mixing bugs

### 2. Minimal Ref Interfaces Enable Loose Coupling

```typescript
// Wrong: Full entity in cross-domain reference
interface CandidateRef {
  id: CandidateId;
  userId: UserId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  constraints: CandidateConstraints;
  pstHistory: PstScore[];
  // ... 20 more fields
}

// Right: Minimal reference for cross-domain use
interface CandidateRef {
  id: CandidateId;
  userId: UserId;
  firstName: string;
  lastName: string;
  nswPath: NswPath;
  shipDate: ISODate;
  riskLevel: RiskLevel;
  divisionId: DivisionId;
}
```

**Why it works:**
- Other domains only see what they need
- Internal changes don't break consumers
- Smaller interface = fewer integration points

### 3. TypeScript Compilation IS the Verification

No unit tests, no integration tests, no manual review needed to verify parallel work integrated correctly.

```bash
npx tsc --noEmit
# 0 errors = integration works
```

**Why it works:**
- Contracts define types
- Implementations must match types
- Compiler enforces the match
- Mismatch = compile error

### 4. In-Memory Repositories Enable Independent Testing

Every domain uses the same pattern:

```typescript
interface IEntityRepository {
  create(data: CreateEntityData): Promise<Entity>;
  findById(id: EntityId): Promise<Entity | null>;
  update(id: EntityId, data: UpdateEntityData): Promise<Entity>;
  delete(id: EntityId): Promise<void>;
  list(filters: EntityFilters, pagination: PaginationParams): Promise<PaginatedResponse<Entity>>;
}

class InMemoryEntityRepository implements IEntityRepository {
  private store = new Map<EntityId, Entity>();
  // ... implementation
}
```

**Why it works:**
- No database setup needed for development
- Each domain is independently testable
- Swap to real database by changing repository implementation
- Repository interface is the contract

### 5. Error Codes in Contracts Prevent Ambiguity

```typescript
export const CandidateErrorCodes = {
  CANDIDATE_001: 'Email already registered',
  CANDIDATE_002: 'Invalid email format',
  CANDIDATE_003: 'Invalid phone format',
  CANDIDATE_004: 'Candidate not found',
  // ... 20 total
} as const;
```

**Why it works:**
- Every error condition is pre-defined
- Implementations can't invent new errors
- API consumers know all possible errors upfront
- Consistent error handling across domains

---

## What We Learned the Hard Way

### 1. Incomplete Vocabulary = Total Failure

**The mistake:** In early experiments, we started parallel work with "most" types defined.

**What happened:**
- Agent A defined `OrderStatus` with 4 values
- Agent B referenced `OrderStatus` assuming 5 values
- Compile failed
- Had to regenerate both contracts

**The lesson:** Vocabulary must be 100% complete before parallel work. 95% complete is 0% useful.

### 2. Contracts Must Be Exhaustive

**The mistake:** First contracts had sections like "Additional methods TBD."

**What happened:**
- Implementation agents asked questions
- Blocked waiting for answers
- Lost all parallelization benefits

**The lesson:** If an implementation agent has to ask a question, the contract failed. Contracts must be complete enough for zero-question implementation.

### 3. Cross-Domain Events Need Schemas

**The mistake:** We defined events as strings: `"candidate.created"`, `"pst.recorded"`

**What happened:**
- No type safety on event payloads
- Consumers assumed different payload shapes
- Runtime errors instead of compile errors

**The fix:** Define event types in shared vocabulary:

```typescript
export type CandidateEvent =
  | { type: 'CANDIDATE_CREATED'; payload: CandidateRef }
  | { type: 'PST_SCORE_RECORDED'; payload: PstScoreRef }
  | { type: 'RISK_LEVEL_CHANGED'; payload: { candidateId: CandidateId; oldLevel: RiskLevel; newLevel: RiskLevel } };
```

### 4. Verification Step Cannot Be Skipped

**The mistake:** We went directly from contract generation to implementation.

**What happened:**
- Contract A imported `UserRef` from Contract B
- Contract B exported `UserReference` (different name)
- Found during implementation, required regenerating Contract A

**The lesson:** Step 4 (verification) exists to catch these issues. It takes 5 minutes and saves hours.

### 5. API Response Wrapper Must Be Standardized

**The mistake:** Let domains define their own response formats.

**What happened:**
- Domain A: `{ data: T, error?: Error }`
- Domain B: `{ success: boolean, result: T }`
- Domain C: `{ payload: T, status: string }`
- Frontend integration nightmare

**The fix:** Single `ApiResponse<T>` in shared vocabulary, used by ALL domains.

---

## Anti-Patterns to Avoid

### 1. "We'll Define It Later"

**Pattern:** Leaving placeholder types with intent to finalize later.

**Why it fails:** Parallel agents can't wait. They'll make assumptions that conflict.

**Fix:** Define everything upfront, even if it changes later. Changing a complete definition is easier than reconciling conflicting assumptions.

### 2. Putting Business Logic in Shared Types

**Pattern:** Adding utility methods or validation to shared type files.

**Why it fails:** Shared types become a dependency magnet. Changes ripple to all domains.

**Fix:** Shared types are pure data definitions only. Business logic stays in domain services.

### 3. Over-Engineering Ref Types

**Pattern:** Including every field "just in case" other domains need it.

**Why it fails:** Tight coupling. Internal changes break external consumers.

**Fix:** Minimum viable Ref. Add fields only when a consumer explicitly needs them.

### 4. Skipping the Repository Layer

**Pattern:** Putting data access directly in services.

**Why it fails:** Can't swap implementations (in-memory → database). Testing requires mocking services.

**Fix:** Always use repository interface. Service depends on interface, not implementation.

### 5. Domain-Specific Enums in Shared Types

**Pattern:** Adding enums to shared types that only one domain uses.

**Why it fails:** Bloats shared vocabulary. Creates false dependencies.

**Fix:** If only one domain uses an enum, define it in that domain's types file.

---

## Metrics That Matter

### Track These

| Metric | Target | Meaning |
|--------|--------|---------|
| Compilation Errors | 0 | Integration works |
| Contracts with TODOs | 0 | Contracts are complete |
| Cross-Domain Type Conflicts | 0 | Vocabulary is complete |
| Blocked Agents | 0 | No coordination needed |

### Ignore These

- Lines of code (more isn't better)
- Time per agent (varies by domain complexity)
- Number of methods (quality over quantity)

---

## Scaling Observations

### 7 Domains (LEO Automation)

- 20,898 lines of contracts
- 26,042 lines of TypeScript
- Vocabulary extraction: ~20 minutes
- Total time: ~45 minutes

### 11 Domains (NSW v3)

- 11,992 lines of contracts
- 17,089 lines of TypeScript
- Vocabulary extraction: ~30 minutes
- Total time: ~60 minutes

### Scaling Pattern

- Vocabulary time scales linearly with domain count
- Parallel work time stays constant (all agents work simultaneously)
- Verification time scales with number of cross-domain references

### Estimated Limits

Based on our experiments:
- 20 domains: Feasible with current methodology
- 50+ domains: May need domain grouping (sub-vocabularies)
- 100+ domains: Likely needs hierarchical approach

---

## Questions We Answered

### Q: Can parallel agents really work without coordination?

**A:** Yes, if and only if the shared vocabulary is complete. The vocabulary IS the coordination mechanism.

### Q: What if requirements change mid-project?

**A:** Update shared vocabulary first, then update affected contracts, then regenerate affected implementations. The dependency graph is clear.

### Q: How do we handle circular dependencies?

**A:** Identify them in Step 4 (verification). Break cycles by introducing event-based communication or splitting domains.

### Q: What if one agent produces a bad contract?

**A:** Regenerate that one contract. Other contracts are unaffected if they only depend on shared vocabulary.

### Q: How do we integrate the domains at runtime?

**A:** Each domain exposes its service interface. Integration layer imports services and wires them together. The types guarantee compatibility.

---

## Summary: The 3 Rules

1. **Complete vocabulary before parallel work** - No exceptions. Ever.

2. **Contracts are complete specifications** - If an agent has to ask, the contract failed.

3. **TypeScript compilation is verification** - 0 errors = it works.

Follow these three rules and parallel development becomes reliable, scalable, and predictable.

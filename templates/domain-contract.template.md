# {PROJECT_NAME} - {DOMAIN_NAME} Domain Contract

## Domain Overview

| Attribute | Value |
|-----------|-------|
| **Domain** | {DOMAIN_NAME} |
| **Responsibility** | {Brief description of what this domain owns and does} |
| **Owner** | {Domain}Service |
| **Dependencies** | {List of domains this one depends on} |
| **Consumers** | {List of domains that consume this one} |

---

## 1. Types

### {Entity} Entity

The primary entity this domain owns.

```typescript
import {
  {Entity}Id,
  {RelatedEntity}Id,
  ISOTimestamp,
  Timestamps
} from '../shared/shared.types';

export interface {Entity} extends Timestamps {
  id: {Entity}Id;
  {field1}: {type1};
  {field2}: {type2};
  // All fields with types
}
```

### Supporting Types

```typescript
export interface {SupportingType1} {
  {field1}: {type1};
}

export enum {DomainEnum} {
  {value1} = '{value1}',
  {value2} = '{value2}'
}
```

### Input Types

```typescript
export interface Create{Entity}Input {
  {field1}: {type1};  // required
  {field2}?: {type2}; // optional
}

export interface Update{Entity}Input {
  {field1}?: {type1};
  {field2}?: {type2};
}
```

### Query Types

```typescript
export interface {Entity}Filters {
  {filterField1}?: {type1};
  {filterField2}?: {type2};
}
```

---

## 2. Service Interface

```typescript
export interface I{Domain}Service {
  /**
   * Creates a new {entity}
   * @throws {DOMAIN}_001 if {condition}
   * @throws {DOMAIN}_002 if {condition}
   */
  create{Entity}(input: Create{Entity}Input): Promise<ApiResponse<{Entity}>>;

  /**
   * Retrieves {entity} by ID
   * @throws {DOMAIN}_003 if {entity} not found
   */
  get{Entity}ById(id: {Entity}Id): Promise<ApiResponse<{Entity}>>;

  /**
   * Updates an existing {entity}
   * @throws {DOMAIN}_003 if {entity} not found
   */
  update{Entity}(id: {Entity}Id, input: Update{Entity}Input): Promise<ApiResponse<{Entity}>>;

  /**
   * Deletes/deactivates {entity}
   * @throws {DOMAIN}_003 if {entity} not found
   */
  delete{Entity}(id: {Entity}Id): Promise<ApiResponse<void>>;

  /**
   * Lists {entities} with filtering and pagination
   */
  list{Entities}(
    filters?: {Entity}Filters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<{Entity}>>>;

  // Add domain-specific methods
}
```

---

## 3. API Routes

| Method | Path | Request Body | Response | Auth | Description |
|--------|------|--------------|----------|------|-------------|
| POST | /api/v1/{entities} | Create{Entity}Input | {Entity} | {roles} | Create new {entity} |
| GET | /api/v1/{entities}/:id | - | {Entity} | {roles} | Get by ID |
| PATCH | /api/v1/{entities}/:id | Update{Entity}Input | {Entity} | {roles} | Update {entity} |
| DELETE | /api/v1/{entities}/:id | - | void | {roles} | Delete {entity} |
| GET | /api/v1/{entities} | query params | PaginatedResponse | {roles} | List with filters |

---

## 4. Cross-Domain Dependencies

### Imports (from shared primitives)

```typescript
import {
  {Entity}Id,
  {RelatedEntity}Id,
  {SharedEnum},
  {RelatedEntity}Ref,
  ISOTimestamp,
  Timestamps,
  ApiResponse,
  PaginationParams,
  PaginatedResponse
} from '../shared/shared.types';
```

### Exports

This domain provides:

```typescript
// Defined in shared-primitives
export interface {Entity}Ref {
  id: {Entity}Id;
  {field1}: {type1};
  {field2}: {type2};
}
```

### Events Published

```typescript
export type {Domain}Event =
  | { type: '{ENTITY}_CREATED'; payload: {Entity}Ref }
  | { type: '{ENTITY}_UPDATED'; payload: { id: {Entity}Id; changes: string[] } }
  | { type: '{ENTITY}_DELETED'; payload: { id: {Entity}Id } };
```

### Events Consumed

| Event | Source Domain | Handler |
|-------|---------------|---------|
| {EVENT_NAME} | {SourceDomain} | {Description of what happens} |

---

## 5. Database Schema

```prisma
model {Entity} {
  id          String   @id @default(cuid())
  {field1}    {Type}   @map("{field1_snake}")
  {field2}    {Type}   @map("{field2_snake}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  {relation}  {RelatedModel} @relation(fields: [{fk}], references: [id])

  // Indexes
  @@index([{indexField1}])
  @@index([{indexField2}])
  @@map("{entities}")
}
```

---

## 6. Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| {field1} | {validation rule description} | {DOMAIN}_001 |
| {field2} | {min}-{max} range | {DOMAIN}_002 |
| {field3} | Valid email format | {DOMAIN}_003 |
| {field4} | Must be future date | {DOMAIN}_004 |

---

## 7. Error Codes

```typescript
export const {Domain}ErrorCodes = {
  {DOMAIN}_001: '{Description of error condition}',
  {DOMAIN}_002: '{Description of error condition}',
  {DOMAIN}_003: '{Entity} not found',
  {DOMAIN}_004: '{Description of error condition}',
  {DOMAIN}_005: '{Description of error condition}',
  // Add all error codes
} as const;
```

---

## 8. Implementation Notes

### Business Rules

- {Rule 1 description}
- {Rule 2 description}

### Performance Considerations

- {Index these fields for common queries}
- {Cache this data}

### Security

- {Who can access what}
- {Validation requirements}

---

## Completeness Checklist

- [ ] All types defined with all fields
- [ ] Service interface has all required methods
- [ ] All methods document their error codes
- [ ] API routes cover all operations
- [ ] Cross-domain imports listed
- [ ] Database schema complete with indexes
- [ ] All validation rules documented
- [ ] All error codes defined
- [ ] No TODOs or placeholders

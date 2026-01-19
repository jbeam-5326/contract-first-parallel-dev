# {PROJECT_NAME} - Shared Primitives

## Overview

This document defines all shared types, enums, interfaces, and constants used across the {PROJECT_NAME} platform. These primitives ensure consistency across domain boundaries and enable parallel development.

**Domains:** {N} domains identified
**Estimated Build:** {X} hours

---

## Domains Identified

| Domain | Responsibility |
|--------|----------------|
| **{Domain1}** | {Brief responsibility description} |
| **{Domain2}** | {Brief responsibility description} |
| **{Domain3}** | {Brief responsibility description} |
| ... | ... |

---

## Identity Types

Branded ID types for type safety. Each entity that crosses domain boundaries needs a branded ID.

```typescript
// Pattern: string & { readonly __brand: 'TypeName' }
export type {Entity1}Id = string & { readonly __brand: '{Entity1}Id' };
export type {Entity2}Id = string & { readonly __brand: '{Entity2}Id' };
export type {Entity3}Id = string & { readonly __brand: '{Entity3}Id' };
// Add one for each cross-domain entity
```

---

## Enums

### {EnumName1}
{Description of what this enum represents}

```typescript
export enum {EnumName1} {
  {value1} = '{value1}',
  {value2} = '{value2}',
  {value3} = '{value3}'
}
```

### {EnumName2}
{Description}

```typescript
export enum {EnumName2} {
  {value1} = '{value1}',
  {value2} = '{value2}'
}
```

---

## Cross-Domain References

Minimal interfaces for cross-domain data access. Include ONLY fields that other domains need.

### {Entity1}Ref
Used by: {Domain2}, {Domain3}

```typescript
export interface {Entity1}Ref {
  id: {Entity1}Id;
  {field1}: {type1};
  {field2}: {type2};
  // Only essential fields
}
```

### {Entity2}Ref
Used by: {Domain1}, {Domain3}

```typescript
export interface {Entity2}Ref {
  id: {Entity2}Id;
  {field1}: {type1};
  // Only essential fields
}
```

---

## Standard Patterns

### Timestamps

```typescript
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
export type ISODate = string & { readonly __brand: 'ISODate' };

export interface Timestamps {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
```

### API Response Wrapper

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Pagination

```typescript
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

---

## Constants

```typescript
// Add domain-specific constants
export const {CONSTANT_NAME} = {value};
```

---

## Utility Functions

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

export function today(): ISODate {
  return new Date().toISOString().split('T')[0] as ISODate;
}

// ID factory functions
export function create{Entity1}Id(id: string): {Entity1}Id {
  return `{prefix}_${id}` as {Entity1}Id;
}
```

---

## Completeness Checklist

Before proceeding to contract generation, verify:

- [ ] All domains identified
- [ ] All cross-domain entity IDs defined (branded types)
- [ ] All shared enums defined
- [ ] All cross-domain references defined (Ref types)
- [ ] API response wrapper defined
- [ ] Pagination patterns defined
- [ ] Timestamp types defined
- [ ] All TypeScript code blocks have `export` keywords
- [ ] File compiles with `tsc --noEmit`

**DO NOT PROCEED until all items are checked.**

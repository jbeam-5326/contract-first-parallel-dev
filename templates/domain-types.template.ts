// {domain}.types.ts
// Generated from {DOMAIN}-CONTRACT.md

// ============================================
// IMPORTS FROM SHARED PRIMITIVES
// ============================================

import {
  {Entity}Id,
  {RelatedEntity}Id,
  ISOTimestamp,
  ISODate,
  Timestamps,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  {RelatedEntity}Ref
} from '../shared/shared.types';

// ============================================
// DOMAIN-SPECIFIC ENUMS
// ============================================

export enum {DomainEnum} {
  {value1} = '{value1}',
  {value2} = '{value2}',
  {value3} = '{value3}'
}

// ============================================
// SUPPORTING TYPES
// ============================================

export interface {SupportingType} {
  {field1}: {type1};
  {field2}: {type2};
}

// ============================================
// CORE ENTITY
// ============================================

export interface {Entity} extends Timestamps {
  id: {Entity}Id;
  {field1}: {type1};
  {field2}: {type2};
  {field3}: {type3};
  isActive: boolean;
}

// ============================================
// INPUT TYPES
// ============================================

export interface Create{Entity}Input {
  {field1}: {type1};
  {field2}: {type2};
  {field3}?: {type3}; // optional
}

export interface Update{Entity}Input {
  {field1}?: {type1};
  {field2}?: {type2};
}

// ============================================
// QUERY TYPES
// ============================================

export interface {Entity}Filters {
  {filterField1}?: {type1};
  {filterField2}?: {type2};
  isActive?: boolean;
}

// ============================================
// SERVICE INTERFACE
// ============================================

export interface I{Domain}Service {
  create{Entity}(input: Create{Entity}Input): Promise<ApiResponse<{Entity}>>;
  get{Entity}ById(id: {Entity}Id): Promise<ApiResponse<{Entity}>>;
  update{Entity}(id: {Entity}Id, input: Update{Entity}Input): Promise<ApiResponse<{Entity}>>;
  delete{Entity}(id: {Entity}Id): Promise<ApiResponse<void>>;
  list{Entities}(filters?: {Entity}Filters, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<{Entity}>>>;
  // Add domain-specific methods from contract
}

// ============================================
// REPOSITORY INTERFACE
// ============================================

export interface I{Entity}Repository {
  create(data: Create{Entity}Data): Promise<{Entity}>;
  findById(id: {Entity}Id): Promise<{Entity} | null>;
  update(id: {Entity}Id, data: Update{Entity}Data): Promise<{Entity}>;
  delete(id: {Entity}Id): Promise<void>;
  list(filters: {Entity}Filters, pagination: PaginationParams): Promise<PaginatedResult<{Entity}>>;
  count(filters: {Entity}Filters): Promise<number>;
}

export interface Create{Entity}Data extends Create{Entity}Input {
  id: {Entity}Id;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  isActive: boolean;
}

export interface Update{Entity}Data extends Update{Entity}Input {
  updatedAt: ISOTimestamp;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

// ============================================
// ERROR CODES
// ============================================

export const {Domain}ErrorCodes = {
  {DOMAIN}_001: '{Error description 1}',
  {DOMAIN}_002: '{Error description 2}',
  {DOMAIN}_003: '{Entity} not found',
  {DOMAIN}_004: '{Error description 4}',
  {DOMAIN}_005: '{Error description 5}'
} as const;

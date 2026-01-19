// {domain}.repository.ts
// In-memory implementation of I{Entity}Repository

import {
  {Entity}Id,
  ISOTimestamp
} from '../shared/shared.types';

import {
  {Entity},
  {Entity}Filters,
  Create{Entity}Data,
  Update{Entity}Data,
  I{Entity}Repository,
  PaginatedResult
} from './{domain}.types';

export class InMemory{Entity}Repository implements I{Entity}Repository {
  private store = new Map<{Entity}Id, {Entity}>();

  async create(data: Create{Entity}Data): Promise<{Entity}> {
    const entity: {Entity} = {
      id: data.id,
      {field1}: data.{field1},
      {field2}: data.{field2},
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };

    this.store.set(entity.id, entity);
    return entity;
  }

  async findById(id: {Entity}Id): Promise<{Entity} | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: {Entity}Id, data: Update{Entity}Data): Promise<{Entity}> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`{Entity} not found: ${id}`);
    }

    const updated: {Entity} = {
      ...existing,
      ...data,
      updatedAt: data.updatedAt
    };

    this.store.set(id, updated);
    return updated;
  }

  async delete(id: {Entity}Id): Promise<void> {
    this.store.delete(id);
  }

  async list(
    filters: {Entity}Filters,
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResult<{Entity}>> {
    let items = Array.from(this.store.values());

    // Apply filters
    items = this.applyFilters(items, filters);

    // Sort
    if (pagination.sortBy) {
      items = this.sortItems(items, pagination.sortBy, pagination.sortOrder ?? 'asc');
    }

    // Get total before pagination
    const total = items.length;

    // Paginate
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    items = items.slice(start, end);

    return { items, total };
  }

  async count(filters: {Entity}Filters): Promise<number> {
    let items = Array.from(this.store.values());
    items = this.applyFilters(items, filters);
    return items.length;
  }

  // ============================================
  // FILTER HELPERS
  // ============================================

  private applyFilters(items: {Entity}[], filters: {Entity}Filters): {Entity}[] {
    return items.filter(item => {
      // Filter by isActive
      if (filters.isActive !== undefined && item.isActive !== filters.isActive) {
        return false;
      }

      // Add filter conditions from contract
      // if (filters.{filterField1} && item.{field1} !== filters.{filterField1}) {
      //   return false;
      // }

      return true;
    });
  }

  private sortItems(
    items: {Entity}[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): {Entity}[] {
    return items.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ============================================
  // UTILITY METHODS (for testing)
  // ============================================

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  getAll(): {Entity}[] {
    return Array.from(this.store.values());
  }
}

// Singleton instance for simple usage
export const {entity}Repository = new InMemory{Entity}Repository();

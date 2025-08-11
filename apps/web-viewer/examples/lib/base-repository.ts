// lib/repositories/base-repository.ts
// Abstract base repository class for common CRUD operations with Supabase

import { createClient } from './Supabase/server'

export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error)
      return null
    }

    return data as T
  }

  /**
   * Find all records with optional limit
   */
  async findAll(limit?: number): Promise<T[]> {
    const supabase = createClient()
    let query = supabase.from(this.tableName).select('*')
    
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching all ${this.tableName}:`, error)
      return []
    }

    return (data as T[]) || []
  }

  /**
   * Create a new record
   */
  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  /**
   * Update record by ID
   */
  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    const supabase = createClient()
    
    // Add updated_at timestamp if the table has this field
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }

    return true
  }

  /**
   * Check if record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .single()

    return !error && !!data
  }

  /**
   * Count total records in table
   */
  async count(): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error(`Error counting ${this.tableName}:`, error)
      return 0
    }

    return count || 0
  }
}
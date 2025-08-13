import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export abstract class BaseRepository<T> {
  protected supabase = createClient()
  protected abstract tableName: keyof Database['public']['Tables']

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
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

  async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')

    if (error) {
      console.error(`Error fetching all ${this.tableName}:`, error)
      return []
    }

    return data as T[]
  }

  async create(item: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
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

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }

    return true
  }
}
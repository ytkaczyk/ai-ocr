import { BaseRepository } from './base-repository'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export class UserRepository extends BaseRepository<Profile> {
  protected tableName = 'profiles' as const

  async getByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile by user ID:', error)
      return null
    }

    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  }

  async createInitialProfile(userId: string, email: string, fullName?: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        id: userId,
        user_id: userId,
        email,
        full_name: fullName,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating initial profile:', error)
      return null
    }

    return data
  }

  async getByRole(role: 'user' | 'admin' | 'super_admin'): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles by role:', error)
      return []
    }

    return data
  }

  async getByTenant(tenantId: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles by tenant:', error)
      return []
    }

    return data
  }
}
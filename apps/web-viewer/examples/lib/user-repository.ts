// lib/repositories/user-repository.ts
// Repository pattern for user data access with Supabase

import { createClient } from './Supabase/server'
import { BaseRepository } from './base-repository'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export class UserRepository extends BaseRepository<UserProfile> {
  constructor() {
    super('profiles')
  }

  /**
   * Get user profile by user ID
   */
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  /**
   * Update user profile with validation
   */
  async updateProfile(
    userId: string, 
    updates: Partial<Pick<UserProfile, 'full_name' | 'bio' | 'avatar_url'>>
  ): Promise<UserProfile | null> {
    const supabase = createClient()
    
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  }

  /**
   * Create initial profile for new user
   */
  async createInitialProfile(userId: string, email: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const profileData = {
      user_id: userId,
      email,
      full_name: null,
      avatar_url: null,
      bio: null,
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return null
    }

    return data
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit = 10): Promise<UserProfile[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('Error searching users:', error)
      return []
    }

    return data || []
  }
}
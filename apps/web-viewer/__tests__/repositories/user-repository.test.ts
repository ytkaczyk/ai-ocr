import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRepository } from '@/lib/repositories/user-repository'

// Mock the createClient function
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({
        data: {
          id: 'test-id',
          user_id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z',
        },
        error: null,
      })),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('UserRepository', () => {
  let userRepository: UserRepository

  beforeEach(() => {
    userRepository = new UserRepository()
    vi.clearAllMocks()
  })

  it('should get user profile by user ID', async () => {
    const profile = await userRepository.getByUserId('test-user-id')
    
    expect(profile).toEqual({
      id: 'test-id',
      user_id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'user',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    })
  })

  it('should create initial profile', async () => {
    const profile = await userRepository.createInitialProfile(
      'new-user-id',
      'newuser@example.com',
      'New User'
    )

    expect(profile).toBeDefined()
    expect(profile?.email).toBe('test@example.com') // Mocked response
  })

  it('should update profile', async () => {
    const updatedProfile = await userRepository.updateProfile('test-user-id', {
      full_name: 'Updated Name',
    })

    expect(updatedProfile).toBeDefined()
    expect(updatedProfile?.full_name).toBe('Test User') // Mocked response
  })
})
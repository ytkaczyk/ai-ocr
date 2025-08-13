import { BaseRepository } from './base-repository'
import { Database } from '@/lib/supabase/types'

type File = Database['public']['Tables']['files']['Row']

export class FileRepository extends BaseRepository<File> {
  protected tableName = 'files' as const

  async getFilesByUser(userId: string): Promise<File[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files by user:', error)
      return []
    }

    return data
  }

  async getFilesByTenant(tenantId: string): Promise<File[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files by tenant:', error)
      return []
    }

    return data
  }

  async searchFiles(userId: string, query: string): Promise<File[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching files:', error)
      return []
    }

    return data
  }

  async getFilesByType(userId: string, type: 'pdf' | 'markdown'): Promise<File[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files by type:', error)
      return []
    }

    return data
  }

  async getTotalSizeByUser(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('size')
      .eq('user_id', userId)

    if (error) {
      console.error('Error calculating total file size:', error)
      return 0
    }

    return data.reduce((total, file) => total + file.size, 0)
  }

  async getRecentFiles(userId: string, limit: number = 10): Promise<File[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent files:', error)
      return []
    }

    return data
  }
}
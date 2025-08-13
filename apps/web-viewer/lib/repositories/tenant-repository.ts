import { BaseRepository } from './base-repository'
import { Database } from '@/lib/supabase/types'

type Tenant = Database['public']['Tables']['tenants']['Row']

export class TenantRepository extends BaseRepository<Tenant> {
  protected tableName = 'tenants' as const

  async getByDomain(domain: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('domain', domain)
      .single()

    if (error) {
      console.error('Error fetching tenant by domain:', error)
      return null
    }

    return data
  }

  async createTenant(name: string, domain?: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        name,
        domain,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tenant:', error)
      return null
    }

    return data
  }

  async updateTenant(id: string, updates: { name?: string; domain?: string }): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tenant:', error)
      return null
    }

    return data
  }

  async getTenantStats(tenantId: string): Promise<{
    userCount: number
    fileCount: number
    totalFileSize: number
  }> {
    const [userCountResult, fileCountResult] = await Promise.all([
      this.supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId),
      this.supabase
        .from('files')
        .select('size')
        .eq('tenant_id', tenantId),
    ])

    const userCount = userCountResult.count || 0
    const files = fileCountResult.data || []
    const fileCount = files.length
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0)

    return {
      userCount,
      fileCount,
      totalFileSize,
    }
  }
}
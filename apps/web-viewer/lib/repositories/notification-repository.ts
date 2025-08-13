import { BaseRepository } from './base-repository'
import { Database } from '@/lib/supabase/types'

type Notification = Database['public']['Tables']['notifications']['Row']

export class NotificationRepository extends BaseRepository<Notification> {
  protected tableName = 'notifications' as const

  async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications by user:', error)
      return []
    }

    return data
  }

  async getUnreadByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unread notifications:', error)
      return []
    }

    return data
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        user_id: userId,
        title,
        message,
        type,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  }

  async getNotificationsByType(
    userId: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications by type:', error)
      return []
    }

    return data
  }

  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<boolean> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error deleting old notifications:', error)
      return false
    }

    return true
  }
}
'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
} from '@mui/material'
import {
  InfoIcon,
  CheckCircleIcon,
  WarningIcon,
  ErrorIcon,
  MarkEmailReadIcon,
  ClearAllIcon,
} from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { NotificationRepository } from '@/lib/repositories/notification-repository'
import Link from 'next/link'

type Notification = Database['public']['Tables']['notifications']['Row']

interface NotificationCenterProps {
  userId: string
  initialNotifications: Notification[]
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ color: 'success.main' }} />
    case 'warning':
      return <WarningIcon sx={{ color: 'warning.main' }} />
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />
    default:
      return <InfoIcon sx={{ color: 'info.main' }} />
  }
}

export function NotificationCenter({ userId, initialNotifications }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const notificationRepo = new NotificationRepository()

  useEffect(() => {
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev =>
              prev.filter(n => n.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  const markAsRead = async (notificationId: string) => {
    setLoading(true)
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    }
    
    setLoading(false)
  }

  const markAllAsRead = async () => {
    setLoading(true)
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    }
    
    setLoading(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            <Badge badgeContent={unreadCount} color="primary">
              Notifications
            </Badge>
          </Typography>
          <Box>
            {unreadCount > 0 && (
              <IconButton 
                size="small" 
                onClick={markAllAsRead}
                disabled={loading}
                title="Mark all as read"
              >
                <ClearAllIcon />
              </IconButton>
            )}
            <Button component={Link} href="/dashboard/notifications" variant="text" size="small">
              View All
            </Button>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No notifications yet.
          </Typography>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.slice(0, 5).map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                }}
                secondaryAction={
                  !notification.read && (
                    <IconButton
                      size="small"
                      onClick={() => markAsRead(notification.id)}
                      disabled={loading}
                      title="Mark as read"
                    >
                      <MarkEmailReadIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                        <Chip
                          label={notification.type}
                          size="small"
                          color={
                            notification.type === 'error' ? 'error' :
                            notification.type === 'warning' ? 'warning' :
                            notification.type === 'success' ? 'success' : 'info'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}
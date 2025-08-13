import { createClient } from '@/lib/supabase/server'
import { UserRepository } from '@/lib/repositories/user-repository'
import { FileRepository } from '@/lib/repositories/file-repository'
import { NotificationRepository } from '@/lib/repositories/notification-repository'
import { redirect } from 'next/navigation'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentFiles } from '@/components/dashboard/RecentFiles'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'
import { Box, Typography, Grid } from '@mui/material'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch dashboard data in parallel
  const [profile, files, notifications] = await Promise.all([
    new UserRepository().getByUserId(user.id),
    new FileRepository().getFilesByUser(user.id),
    new NotificationRepository().getUnreadByUser(user.id),
  ])

  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    unreadNotifications: notifications.length,
    recentActivity: files.filter(f => 
      new Date(f.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length,
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {profile?.full_name || user.email}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DashboardStats stats={stats} />
        </Grid>

        <Grid item xs={12} md={8}>
          <RecentFiles files={files.slice(0, 10)} />
        </Grid>

        <Grid item xs={12} md={4}>
          <NotificationCenter 
            userId={user.id} 
            initialNotifications={notifications} 
          />
        </Grid>
      </Grid>
    </Box>
  )
}
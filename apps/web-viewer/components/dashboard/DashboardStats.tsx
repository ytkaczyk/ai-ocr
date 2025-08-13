import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import {
  DescriptionIcon,
  StorageIcon,
  NotificationsIcon,
  TrendingUpIcon,
} from '@mui/icons-material'

interface DashboardStatsProps {
  stats: {
    totalFiles: number
    totalSize: number
    unreadNotifications: number
    recentActivity: number
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Files',
      value: stats.totalFiles.toString(),
      icon: <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats.totalSize),
      icon: <StorageIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main',
    },
    {
      title: 'Notifications',
      value: stats.unreadNotifications.toString(),
      icon: <NotificationsIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity.toString(),
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.main',
    },
  ]

  return (
    <Grid container spacing={3}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Box>{stat.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
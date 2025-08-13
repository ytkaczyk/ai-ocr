import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme()

const mockStats = {
  totalFiles: 10,
  totalSize: 1024 * 1024, // 1MB
  unreadNotifications: 5,
  recentActivity: 3,
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('DashboardStats', () => {
  it('renders all stat cards', () => {
    renderWithTheme(<DashboardStats stats={mockStats} />)
    
    expect(screen.getByText('Total Files')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    
    expect(screen.getByText('Storage Used')).toBeInTheDocument()
    expect(screen.getByText('1.00 MB')).toBeInTheDocument()
    
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('formats bytes correctly', () => {
    const stats = {
      totalFiles: 0,
      totalSize: 1536, // 1.5 KB
      unreadNotifications: 0,
      recentActivity: 0,
    }
    
    renderWithTheme(<DashboardStats stats={stats} />)
    expect(screen.getByText('1.50 KB')).toBeInTheDocument()
  })

  it('handles zero values', () => {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      unreadNotifications: 0,
      recentActivity: 0,
    }
    
    renderWithTheme(<DashboardStats stats={stats} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0 Bytes')).toBeInTheDocument()
  })
})
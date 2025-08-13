'use client'

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppProvider } from '@toolpad/core/nextjs'
import { 
  DashboardIcon, 
  PeopleIcon, 
  SettingsIcon, 
  DescriptionIcon, 
  NotificationsIcon,
  AdminPanelSettingsIcon
} from '@mui/icons-material'

const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'files',
    title: 'Files',
    icon: <DescriptionIcon />,
  },
  {
    segment: 'notifications',
    title: 'Notifications', 
    icon: <NotificationsIcon />,
  },
  {
    segment: 'profile',
    title: 'Profile',
    icon: <PeopleIcon />,
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: 'admin',
    title: 'Admin',
    icon: <AdminPanelSettingsIcon />,
  },
]

const BRANDING = {
  title: 'AI OCR Dashboard',
  homeUrl: '/dashboard',
}

// CSS Variables theme (recommended for 2024-2025)
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    // Custom component overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider
        navigation={NAVIGATION}
        branding={BRANDING}
        theme={theme}
      >
        {children}
      </AppProvider>
    </MuiThemeProvider>
  )
}
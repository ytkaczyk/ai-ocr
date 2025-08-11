// app/(dashboard)/layout.tsx
// Dashboard layout using MUI Toolpad Core with Supabase authentication

import { Suspense } from 'react'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { PageContainer } from '@toolpad/core/PageContainer'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <Suspense fallback={<LoadingSkeleton />}>
          {children}
        </Suspense>
      </PageContainer>
    </DashboardLayout>
  )
}

// Note: DashboardNav is now handled by Toolpad Core's DashboardLayout component.
// Navigation is configured in the AppProvider at the root layout level.
// This file is kept for reference but the custom navigation is replaced by Toolpad Core.

// The navigation structure is now defined in app/layout.tsx:
// const NAVIGATION = [
//   {
//     segment: 'dashboard',
//     title: 'Dashboard', 
//     icon: <DashboardIcon />,
//   },
//   {
//     segment: 'profile',
//     title: 'Profile',
//     icon: <PersonIcon />,
//   },
//   {
//     segment: 'files',
//     title: 'Files',
//     icon: <FolderIcon />,
//   },
//   {
//     segment: 'analytics',
//     title: 'Analytics',
//     icon: <AnalyticsIcon />,
//   },
//   {
//     segment: 'settings',
//     title: 'Settings',
//     icon: <SettingsIcon />,
//   },
// ]

// Note: UserMenu is now handled by Toolpad Core's built-in authentication UI.
// User authentication and profile display is managed through the AuthProvider
// configuration in app/layout.tsx.

// The authentication provider is configured as:
// export const supabaseAuthProvider: AuthProvider = {
//   async signIn() { /* OAuth with Supabase */ },
//   async signOut() { /* Sign out with Supabase */ },
//   async getUser() { /* Get current user from Supabase */ },
// }

// This file is kept for reference but custom user menu functionality
// is now integrated into Toolpad Core's AppProvider authentication prop.
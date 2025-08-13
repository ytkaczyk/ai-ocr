import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { PageContainer } from '@toolpad/core/PageContainer'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserRepository } from '@/lib/repositories/user-repository'

export default async function DashboardLayoutPage({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Server-side authentication check
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user profile for role-based features
  const userRepository = new UserRepository()
  let profile = await userRepository.getByUserId(user.id)

  // Create initial profile if it doesn't exist
  if (!profile) {
    profile = await userRepository.createInitialProfile(
      user.id,
      user.email || '',
      user.user_metadata?.full_name
    )
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {children}
      </PageContainer>
    </DashboardLayout>
  )
}
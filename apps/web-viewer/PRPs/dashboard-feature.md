# Next.js + Supabase Dashboard Feature - Project Requirements and Patterns (PRP)

## 🎯 FEATURE OVERVIEW

**Feature Purpose:** A comprehensive user dashboard with profile management, real-time notifications, file upload capabilities, file management, document visualization (PDF/MD), and data visualization with multi-tenant support. 

**Technology Stack:** Next.js 15+ App Router, Supabase (PostgreSQL, Auth, Storage, Realtime), Material-UI v7+, MUI Toolpad Core, TypeScript, comprehensive testing with Vitest, Playwright, and Storybook.

**Complexity Level:** Intermediate - Production-ready patterns with common features, maintainable and extensible foundation.

---

## 🏗️ NEXT.JS APP ROUTER IMPLEMENTATION

### Project Structure (2024-2025 Best Practices)

Based on current Next.js App Router patterns and research findings:

```
app/
├── (auth)/                    # Route group for auth pages
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
├── (dashboard)/               # Route group for dashboard pages
│   ├── layout.tsx            # Dashboard-specific layout with Toolpad Core
│   ├── page.tsx              # Dashboard home
│   ├── profile/
│   │   └── page.tsx
│   ├── files/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── notifications/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── admin/                 # Super-admin tenant management
│       ├── layout.tsx
│       ├── tenants/
│       │   └── page.tsx
│       └── users/
│           └── page.tsx
├── api/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # OAuth callback handler
│   ├── files/
│   │   ├── upload/
│   │   │   └── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   └── notifications/
│       └── route.ts
├── globals.css
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Public home page
├── loading.tsx                # Global loading UI
├── error.tsx                  # Global error boundary
├── not-found.tsx              # 404 page
└── middleware.ts              # Auth & route protection

components/
├── ui/                        # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── DataTable.tsx
│   ├── FileUpload.tsx
│   └── Chart.tsx
├── forms/                     # Form components
│   ├── ProfileForm.tsx
│   ├── LoginForm.tsx
│   └── FileManagementForm.tsx
├── providers/                 # Context providers
│   ├── ThemeProvider.tsx
│   ├── AuthProvider.tsx
│   └── NotificationProvider.tsx
├── dashboard/                 # Dashboard-specific components
│   ├── DashboardSidebar.tsx
│   ├── UserMenu.tsx
│   ├── NotificationCenter.tsx
│   └── FileViewer.tsx
└── admin/                     # Admin-specific components
    ├── TenantManager.tsx
    └── UserManager.tsx

lib/
├── supabase/
│   ├── client.ts             # Browser client
│   ├── server.ts             # Server client
│   ├── middleware.ts         # Middleware client
│   └── types.ts              # Generated database types
├── repositories/             # Data access layer
│   ├── base-repository.ts
│   ├── user-repository.ts
│   ├── tenant-repository.ts
│   ├── file-repository.ts
│   └── notification-repository.ts
├── services/                 # Business logic layer
│   ├── auth-service.ts
│   ├── file-service.ts
│   ├── notification-service.ts
│   └── tenant-service.ts
├── hooks/                    # Custom React hooks
│   ├── use-auth.ts
│   ├── use-notifications.ts
│   └── use-files.ts
├── utils/
│   ├── file-utils.ts
│   ├── validation.ts
│   └── format.ts
├── constants/
│   └── navigation.ts
└── theme.ts                  # Material-UI theme config
```

### Server vs Client Component Strategy

Following 2024-2025 Next.js patterns:

**Server Components (Default):**
- Page layouts and static content
- Data fetching from Supabase
- SEO-critical components
- Dashboard shell and navigation

**Client Components ('use client'):**
- Interactive forms and inputs
- Real-time subscription components
- File upload with drag-and-drop
- Chart and data visualization
- Theme switching components
- Notification system

### Route Protection and Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value
        },
        set(key: string, value: string, options: any) {
          request.cookies.set({
            name: key,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name: key,
            value,
            ...options,
          })
        },
        remove(key: string, options: any) {
          request.cookies.set({
            name: key,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name: key,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Admin-only routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user?.id)
      .single()

    if (!user || userProfile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 🗄️ SUPABASE INTEGRATION PATTERNS

### Database Schema Design

Based on 2024-2025 Supabase best practices with proper RLS implementation:

```sql
-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  email text not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  tenant_id uuid references public.tenants on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tenants table for multi-tenancy
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files table
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tenant_id uuid references public.tenants on delete cascade,
  name text not null,
  type text not null check (type in ('pdf', 'markdown', 'md')),
  size bigint not null,
  storage_path text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tenants
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.files
  for each row execute procedure public.handle_updated_at();
```

### Row Level Security (RLS) Policies

Critical security implementation based on 2024-2025 patterns:

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.files enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Super admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  );

-- Tenants policies
create policy "Users can view their tenant"
  on public.tenants for select
  to authenticated
  using (
    id in (
      select tenant_id from public.profiles
      where user_id = (select auth.uid())
    )
  );

create policy "Super admins can manage all tenants"
  on public.tenants for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'super_admin'
    )
  );

-- Files policies
create policy "Users can view their own files"
  on public.files for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can upload files"
  on public.files for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own files"
  on public.files for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own files"
  on public.files for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Tenant-based file access for admins
create policy "Tenant admins can view tenant files"
  on public.files for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.profiles
      where user_id = (select auth.uid()) and role in ('admin', 'super_admin')
    )
  );

-- Notifications policies
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Performance indexes for RLS
create index profiles_user_id_idx on public.profiles(user_id);
create index profiles_tenant_id_idx on public.profiles(tenant_id);
create index files_user_id_idx on public.files(user_id);
create index files_tenant_id_idx on public.files(tenant_id);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_user_id_read_idx on public.notifications(user_id, read);
```

### Supabase Client Configuration

Based on latest @supabase/ssr patterns:

```typescript
// lib/supabase/client.ts - Browser client
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts - Server client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export const createClient = (cookieStore = cookies()) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value
        },
      },
    }
  )
}

// lib/supabase/middleware.ts - Middleware client
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { Database } from './types'

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value
        },
        set(key: string, value: string, options: any) {
          response.cookies.set({
            name: key,
            value,
            ...options,
          })
        },
        remove(key: string, options: any) {
          response.cookies.set({
            name: key,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
```

### Repository Pattern Implementation

```typescript
// lib/repositories/base-repository.ts
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export abstract class BaseRepository<T> {
  protected supabase = createClient()
  protected abstract tableName: keyof Database['public']['Tables']

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error)
      return null
    }

    return data as T
  }

  async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')

    if (error) {
      console.error(`Error fetching all ${this.tableName}:`, error)
      return []
    }

    return data as T[]
  }

  async create(item: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }

    return true
  }
}

// lib/repositories/user-repository.ts
import { BaseRepository } from './base-repository'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export class UserRepository extends BaseRepository<Profile> {
  protected tableName = 'profiles' as const

  async getByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile by user ID:', error)
      return null
    }

    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  }

  async createInitialProfile(userId: string, email: string, fullName?: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating initial profile:', error)
      return null
    }

    return data
  }
}

// lib/repositories/file-repository.ts
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
}
```

### Real-time Subscriptions

```typescript
// lib/hooks/use-notifications.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
      }
      setLoading(false)
    }

    fetchNotifications()

    // Set up real-time subscription
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
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return { notifications, loading, markAsRead }
}
```

---

## 🎨 MATERIAL-UI V7 INTEGRATION

### Theme Provider Setup with App Router

Based on 2024-2025 Material-UI patterns:

```typescript
// app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard App',
  description: 'Modern dashboard with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

// components/providers/ThemeProvider.tsx
'use client'

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppProvider } from '@toolpad/core/nextjs'
import { DashboardIcon, PeopleIcon, SettingsIcon, DescriptionIcon, NotificationsIcon } from '@mui/icons-material'

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
]

const BRANDING = {
  logo: <img src="/logo.svg" alt="Dashboard" />,
  title: 'Dashboard App',
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
```

### Toolpad Core Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
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

  // Get user profile for role-based navigation
  const userRepository = new UserRepository()
  const profile = await userRepository.getByUserId(user.id)

  return (
    <DashboardLayout>
      <PageContainer>
        {children}
      </PageContainer>
    </DashboardLayout>
  )
}
```

### Form Components with Validation

```typescript
// components/forms/ProfileForm.tsx
'use client'

import { useState } from 'react'
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Avatar, 
  Typography,
  Alert,
  CircularProgress 
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserRepository } from '@/lib/repositories/user-repository'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: {
    id: string
    fullName?: string
    email: string
    avatarUrl?: string
  }
  onSuccess?: () => void
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName || '',
      email: initialData.email,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const userRepository = new UserRepository()
      await userRepository.updateProfile(initialData.id, {
        full_name: data.fullName,
        email: data.email,
      })

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            src={initialData.avatarUrl} 
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Typography variant="h5" component="h1">
              Profile Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your account information
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            {...register('fullName')}
            label="Full Name"
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            disabled={loading}
            fullWidth
          />

          <TextField
            {...register('email')}
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
```

### File Upload Component

```typescript
// components/ui/FileUpload.tsx
'use client'

import { useState, useCallback } from 'react'
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  LinearProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material'
import { UploadFile, CloudUpload, Delete } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  onUploadComplete?: (files: Array<{ id: string; name: string; url: string }>) => void
  acceptedTypes?: string[]
  maxSize?: number
  maxFiles?: number
}

export function FileUpload({ 
  onUploadComplete, 
  acceptedTypes = ['application/pdf', 'text/markdown'],
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
    },
    maxSize,
    maxFiles,
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const uploadedResults = []
      const totalFiles = uploadedFiles.length

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(filePath, file)

        if (storageError) throw storageError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(filePath)

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            name: file.name,
            type: fileExt === 'pdf' ? 'pdf' : 'markdown',
            size: file.size,
            storage_path: filePath,
            metadata: {
              originalName: file.name,
              mimeType: file.type,
            }
          })
          .select()
          .single()

        if (dbError) throw dbError

        uploadedResults.push({
          id: fileRecord.id,
          name: file.name,
          url: urlData.publicUrl,
        })

        setUploadProgress(((i + 1) / totalFiles) * 100)
      }

      setUploadedFiles([])
      onUploadComplete?.(uploadedResults)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Box>
      <Card
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports PDF and Markdown files up to {maxSize / 1024 / 1024}MB
          </Typography>
        </Box>
      </Card>

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {uploadedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeFile(index)}
                deleteIcon={<Delete />}
                variant="outlined"
              />
            ))}
          </Box>
          <Button
            variant="contained"
            onClick={uploadFiles}
            disabled={uploading}
            startIcon={<UploadFile />}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : `Upload ${uploadedFiles.length} file(s)`}
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {Math.round(uploadProgress)}% uploaded
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
```

---

## 🧪 COMPREHENSIVE TESTING STRATEGY

### Testing Environment Setup

Based on 2024-2025 testing patterns with Vitest, React Testing Library, Playwright, and Storybook:

```json
// package.json - Testing dependencies
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.40.0",
    "@storybook/addon-essentials": "^7.6.0",
    "@storybook/addon-interactions": "^7.6.0",
    "@storybook/addon-a11y": "^7.6.0",
    "@storybook/blocks": "^7.6.0",
    "@storybook/nextjs": "^7.6.0",
    "@storybook/react": "^7.6.0",
    "@storybook/testing-library": "^0.2.0",
    "msw": "^2.0.0",
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^23.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test:storybook": "test-storybook"
  }
}
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

// vitest.setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Start MSW server
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Mock Service Worker Setup for Supabase

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    })
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
    })
  }),

  // Database endpoints
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      {
        id: 'profile-1',
        user_id: 'mock-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/files`, () => {
    return HttpResponse.json([
      {
        id: 'file-1',
        user_id: 'mock-user-id',
        name: 'test-document.pdf',
        type: 'pdf',
        size: 1024,
        storage_path: 'mock-user-id/test-document.pdf',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ])
  }),

  // Storage endpoints
  http.post(`${SUPABASE_URL}/storage/v1/object/files/*`, () => {
    return HttpResponse.json({
      Key: 'mock-user-id/test-file.pdf',
      Id: 'mock-file-id',
    })
  }),
]

// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Unit Testing Examples

```typescript
// __tests__/repositories/user-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { UserRepository } from '@/lib/repositories/user-repository'

describe('UserRepository', () => {
  let userRepository: UserRepository

  beforeEach(() => {
    userRepository = new UserRepository()
  })

  it('should get user profile by user ID', async () => {
    const profile = await userRepository.getByUserId('mock-user-id')
    
    expect(profile).toEqual({
      id: 'profile-1',
      user_id: 'mock-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: '2024-01-01T00:00:00.000Z',
    })
  })

  it('should update user profile', async () => {
    const updatedProfile = await userRepository.updateProfile('mock-user-id', {
      full_name: 'Updated Name',
    })

    expect(updatedProfile?.full_name).toBe('Updated Name')
  })
})

// __tests__/components/ProfileForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '@/components/forms/ProfileForm'

const mockInitialData = {
  id: 'user-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  avatarUrl: '/avatar.jpg',
}

describe('ProfileForm', () => {
  it('renders with initial data', () => {
    render(<ProfileForm initialData={mockInitialData} />)
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
  })

  it('validates form inputs', async () => {
    const user = userEvent.setup()
    render(<ProfileForm initialData={mockInitialData} />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'A')
    
    fireEvent.blur(nameInput)
    
    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('calls onSuccess when form is submitted successfully', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    
    render(<ProfileForm initialData={mockInitialData} onSuccess={onSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: /update profile/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
```

### Playwright E2E Testing

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})

// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="sign-in-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})

// e2e/file-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('File Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="sign-in-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('user can upload and view files', async ({ page }) => {
    await page.goto('/dashboard/files')
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-files/sample.pdf')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()
    
    // Verify file appears in list
    await expect(page.locator('[data-testid="file-list"]')).toContainText('sample.pdf')
  })

  test('user can search files', async ({ page }) => {
    await page.goto('/dashboard/files')
    
    await page.fill('[data-testid="search-input"]', 'sample')
    await page.keyboard.press('Enter')
    
    await expect(page.locator('[data-testid="file-list"]')).toContainText('sample.pdf')
  })
})
```

### Storybook Configuration and Stories

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
}

export default config

// .storybook/preview.ts
import type { Preview } from '@storybook/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '../lib/theme'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview

// components/forms/ProfileForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ProfileForm } from './ProfileForm'

const meta: Meta<typeof ProfileForm> = {
  title: 'Forms/ProfileForm',
  component: ProfileForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    initialData: {
      id: 'user-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: '/avatar.jpg',
    },
  },
}

export const WithoutAvatar: Story = {
  args: {
    initialData: {
      id: 'user-2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
}

export const NewUser: Story = {
  args: {
    initialData: {
      id: 'user-3',
      email: 'newuser@example.com',
    },
  },
}
```

---

## 🚀 PRODUCTION DEPLOYMENT & MONITORING

### Vercel Deployment with Supabase Integration

Based on 2024-2025 production patterns:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Run E2E tests
        run: |
          npx playwright install --with-deps
          npm run test:e2e
          
      - name: Build Storybook
        run: npm run build-storybook
        
      - name: Run Storybook tests
        run: npm run test:storybook

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sentry monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Production environment variables (Vercel)
NODE_ENV=production
```

### Sentry Integration for Error Monitoring

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    new Sentry.Integrations.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.type === 'ChunkLoadError') {
        return null // Don't report chunk load errors
      }
    }
    return event
  },
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  integrations: [
    // Supabase integration for database monitoring
    new Sentry.Integrations.Postgres({
      name: 'supabase',
    }),
  ],
})

// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})
```

### Performance Monitoring Setup

```typescript
// lib/monitoring/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'

function sendToAnalytics(metric: any) {
  // Send to Sentry
  Sentry.addBreadcrumb({
    message: `Web Vital: ${metric.name}`,
    category: 'performance',
    data: {
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
    },
  })

  // Send to Vercel Analytics (if using)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      custom_map: { metric_value: 'value' },
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    })
  }
}

export function setupPerformanceMonitoring() {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

// app/layout.tsx - Add performance monitoring
import { setupPerformanceMonitoring } from '@/lib/monitoring/performance'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Setup performance monitoring on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupPerformanceMonitoring()
    }
  }, [])

  return (
    <html lang="en">
      <body>
        {/* ... rest of layout */}
      </body>
    </html>
  )
}
```

### Database Performance Optimization

```sql
-- Add performance indexes for common queries
create index concurrently profiles_user_id_tenant_id_idx on public.profiles(user_id, tenant_id);
create index concurrently files_user_id_created_at_idx on public.files(user_id, created_at desc);
create index concurrently files_tenant_id_type_idx on public.files(tenant_id, type);
create index concurrently notifications_user_id_read_created_at_idx on public.notifications(user_id, read, created_at desc);

-- Full-text search index for files
create index files_name_search_idx on public.files using gin(to_tsvector('english', name));

-- Analyze tables for better query planning
analyze public.profiles;
analyze public.tenants;
analyze public.files;
analyze public.notifications;
```

---

## 🔒 SECURITY IMPLEMENTATION

### Input Validation and Sanitization

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, apostrophes, and hyphens'),
  email: z.string().email('Invalid email format'),
})

export const fileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters')
    .regex(/^[^<>:"/\\|?*]+\.(pdf|md)$/i, 'Invalid file name or extension'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.enum(['pdf', 'markdown'], { required_error: 'Invalid file type' }),
})

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Search query contains invalid characters'),
})

// lib/utils/sanitize.ts
import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side sanitization (you might want to use a different library)
    return html.replace(/<[^>]*>?/gm, '')
  }
  return DOMPurify.sanitize(html)
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 255)
}
```

### API Route Protection

```typescript
// lib/auth/api-protection.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<Response>
) {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return await handler(request, user)
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, req: NextRequest, user: any) => Promise<Response>
) {
  return async (req: NextRequest, user: any) => {
    try {
      const body = await req.json()
      const validatedData = schema.parse(body)
      return await handler(validatedData, req, user)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ 
          error: 'Validation error',
          details: error.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw error
    }
  }
}

// app/api/files/upload/route.ts - Example protected API route
import { withAuth, withValidation } from '@/lib/auth/api-protection'
import { fileUploadSchema } from '@/lib/validation/schemas'
import { FileRepository } from '@/lib/repositories/file-repository'

export async function POST(request: NextRequest) {
  return withAuth(request, 
    withValidation(fileUploadSchema, async (data, req, user) => {
      const fileRepository = new FileRepository()
      
      // Additional security checks
      const existingFilesCount = await fileRepository.getFilesByUser(user.id)
      if (existingFilesCount.length >= 100) {
        return new Response(JSON.stringify({ 
          error: 'File limit exceeded' 
        }), { status: 429 })
      }

      // Process file upload
      const result = await fileRepository.create({
        ...data,
        user_id: user.id,
      })

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      })
    })
  )
}
```

### Content Security Policy

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.com https://*.vercel.app",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://*.supabase.co https://vercel.com",
              "connect-src 'self' https://*.supabase.co https://vercel.com wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 📋 IMPLEMENTATION VALIDATION

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Validation Scripts

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "validate": "npm run type-check && npm run lint && npm run test:coverage",
    "validate:full": "npm run validate && npm run test:e2e && npm run build",
    "supabase:start": "npx supabase start",
    "supabase:stop": "npx supabase stop",
    "supabase:reset": "npx supabase db reset",
    "supabase:gen-types": "npx supabase gen types typescript --local > lib/supabase/types.ts"
  }
}
```

### Pre-commit Hooks

```json
// package.json - Husky and lint-staged
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}

// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

---

## 🎯 IMPLEMENTATION EXAMPLES

### Complete Dashboard Page

```typescript
// app/(dashboard)/page.tsx - Main dashboard with data visualization
import { createClient } from '@/lib/supabase/server'
import { UserRepository } from '@/lib/repositories/user-repository'
import { FileRepository } from '@/lib/repositories/file-repository'
import { NotificationRepository } from '@/lib/repositories/notification-repository'
import { Card, CardContent, Typography, Grid, Box } from '@mui/material'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentFiles } from '@/components/dashboard/RecentFiles'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'

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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Overview
              </Typography>
              <ActivityChart userId={user.id} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <NotificationCenter 
            userId={user.id} 
            initialNotifications={notifications} 
          />
        </Grid>

        <Grid item xs={12}>
          <RecentFiles files={files.slice(0, 10)} />
        </Grid>
      </Grid>
    </Box>
  )
}
```

### File Management with Real-time Updates

```typescript
// app/(dashboard)/files/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Fab,
  Dialog
} from '@mui/material'
import { 
  Search,
  Download,
  Delete,
  Visibility,
  Add,
  InsertDriveFile,
  PictureAsPdf
} from '@mui/icons-material'
import { FileUpload } from '@/components/ui/FileUpload'
import { useFiles } from '@/lib/hooks/use-files'
import { formatBytes } from '@/lib/utils/format'

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { files, loading, searchFiles, deleteFile } = useFiles()
  const [filteredFiles, setFilteredFiles] = useState(files)

  useEffect(() => {
    if (searchQuery) {
      const filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFiles(filtered)
    } else {
      setFilteredFiles(files)
    }
  }, [files, searchQuery])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId)
    }
  }

  const getFileIcon = (type: string) => {
    return type === 'pdf' ? <PictureAsPdf /> : <InsertDriveFile />
  }

  if (loading) {
    return <Box>Loading...</Box>
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearch}
          data-testid="search-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <TableContainer component={Paper} data-testid="file-list">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFileIcon(file.type)}
                    {file.name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={file.type.toUpperCase()}
                    size="small"
                    color={file.type === 'pdf' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  {new Date(file.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" title="View">
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" title="Download">
                    <Download />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    title="Delete"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab
        color="primary"
        aria-label="upload"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Add />
      </Fab>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <FileUpload
            onUploadComplete={() => {
              setUploadDialogOpen(false)
              // Files will auto-refresh via real-time subscription
            }}
          />
        </Box>
      </Dialog>
    </Box>
  )
}
```

---

## 🚨 COMMON GOTCHAS & SOLUTIONS

### Next.js App Router Specific Issues

1. **Hydration Mismatches**
```typescript
// ❌ Wrong: Server and client render different content
function MyComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null // This causes hydration issues
  
  return <div>{new Date().toLocaleTimeString()}</div>
}

// ✅ Correct: Use dynamic imports for client-only content
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false, loading: () => <div>Loading...</div> }
)
```

2. **Auth State Synchronization**
```typescript
// ❌ Wrong: Using getSession() on server
const { data: session } = await supabase.auth.getSession() // Don't use this

// ✅ Correct: Always use getUser() on server
const { data: { user } } = await supabase.auth.getUser() // Use this instead
```

### Supabase RLS Policy Issues

1. **RLS Policy Performance**
```sql
-- ❌ Wrong: Inefficient policy without proper indexing
CREATE POLICY "users_own_files" ON files
FOR SELECT USING (user_id = auth.uid());

-- Without index, this is slow for large tables

-- ✅ Correct: Add proper index
CREATE INDEX files_user_id_idx ON files(user_id);
```

2. **Policy Testing**
```sql
-- Use EXPLAIN to test policy performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM files WHERE user_id = 'some-uuid';

-- Check if RLS is working correctly
SET role TO authenticated;
SET request.jwt.claim.sub TO 'user-id';
SELECT * FROM files; -- Should only return user's files
```

### Material-UI Integration Issues

1. **Theme Provider Order**
```typescript
// ❌ Wrong: Theme provider after cache provider
<ThemeProvider theme={theme}>
  <AppRouterCacheProvider>
    {children}
  </AppRouterCacheProvider>
</ThemeProvider>

// ✅ Correct: Cache provider wraps everything
<AppRouterCacheProvider>
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
</AppRouterCacheProvider>
```

2. **Server-Side Rendering Issues**
```typescript
// ✅ Always include options for AppRouterCacheProvider
<AppRouterCacheProvider options={{ enableCssLayer: true }}>
```

### Real-time Subscription Memory Leaks

```typescript
// ❌ Wrong: Not cleaning up subscriptions
useEffect(() => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes', { ... }, handler)
    .subscribe()
  
  // Missing cleanup
}, [])

// ✅ Correct: Always cleanup subscriptions
useEffect(() => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes', { ... }, handler)
    .subscribe()
  
  return () => {
    channel.unsubscribe() // Essential for cleanup
  }
}, [])
```

---

## 📊 PERFORMANCE BENCHMARKS

### Expected Performance Targets

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size**: < 250KB gzipped for initial load

### Optimization Techniques

1. **Database Query Optimization**
2. **Next.js Bundle Optimization**
3. **Image Optimization**
4. **Caching Strategies**

---

This comprehensive PRP provides production-ready patterns for building a modern Next.js dashboard application with Supabase backend integration, following 2024-2025 best practices and including extensive testing, monitoring, and security implementations.

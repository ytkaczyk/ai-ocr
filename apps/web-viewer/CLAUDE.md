# Next.js + Supabase Context Engineering Template

This template specializes the base context engineering framework for full-stack Next.js applications with Supabase backend integration. For WHAT to build, see the PRP (Product Requirement Prompt) documents.

## Core Principles

**IMPORTANT: You MUST follow these principles in all code changes and PRP generations:**

### KISS (Keep It Simple, Stupid)

- Simplicity should be a key goal in design
- Choose straightforward solutions over complex ones whenever possible
- Simple solutions are easier to understand, maintain, and debug

### YAGNI (You Aren't Gonna Need It)

- Avoid building functionality on speculation
- Implement features only when they are needed, not when you anticipate they might be useful in the future

### Open/Closed Principle

- Software entities should be open for extension but closed for modification
- Design systems so that new functionality can be added with minimal changes to existing code

## 🔄 Project Awareness & Context

- **Use consistent Next.js App Router patterns** as researched and documented
- **Follow Supabase integration best practices** for auth, database, storage, and realtime
- **Use TypeScript throughout** - Next.js, Supabase client libraries, and all components
- **Leverage ToolPad Core components over building UI with simple MUI components** in order to promote reusability and maintenance

## 🚀 Next.js + Supabase Technology Stack

### Core Framework
- **Next.js 15+ with App Router** - Modern React framework with server components
- **TypeScript** - Strict typing throughout the application
- **Supabase** - Backend-as-a-Service with PostgreSQL, Auth, Storage, and Realtime

### UI and Styling
- **Material-UI (MUI) v7+** - React component library with theming
- **MUI Toolpad Core** - Dashboard and admin panel components  
- **TailwindCSS** - Utility-first CSS framework for custom styling
- **Emotion** - CSS-in-JS library for MUI integration

### Development Tools
- **npm/yarn** - Package management (prefer npm for consistency)
- **Supabase CLI** - Local development and database management
- **Next.js CLI** - Project scaffolding and development server

## 🧱 Next.js App Router Architecture

### Project Structure Patterns
```
app/
│   ├── auth
│   │   └── signin
│   │       └── page.tsx
│   ├── api
│   │   └── auth
│   │       └── [...nextauth]
│   │           └── route.ts
├── (dashboard)/          # Route groups for organization
│   ├── layout.tsx       # Dashboard-specific layout
│   └── page.tsx         # Dashboard page
├── api/                 # API routes
│   └── route.ts         # Route handlers
├── globals.css          # Global styles
├── layout.tsx           # Root layout with providers
└── page.tsx             # Home page

components/
├── ui/                  # Reusable UI components
├── forms/               # Form components
└── providers/           # Context providers

lib/
├── supabase/
│   ├── client.ts        # Browser-side Supabase client
│   ├── server.ts        # Server-side Supabase client
│   └── middleware.ts    # Auth middleware
├── services/            # Business logic layer
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

### File Conventions
- **`page.tsx`** - Page components (App Router)
- **`layout.tsx`** - Shared layouts for route segments
- **`loading.tsx`** - Loading UI components
- **`error.tsx`** - Error handling components
- **`route.ts`** - API route handlers
- **`middleware.ts`** - Request middleware

## 🗄️ Supabase Integration Patterns

### Authentication Setup
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts  
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
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
```

### Data Access Layer (DAL) Pattern
```typescript
// lib/services/users.ts
import { createClient } from '@/lib/supabase/server'
import { UserRepository } from '@/lib/user-repository'

export async function getAuthenticatedUser() {
  const supabase = createClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getUserProfile(userId: string) {
  const userRepository = new UserRepository()
  const profile = await userRepository.getByUserId(userId)
  
  if (!profile) {
    throw new Error('Failed to fetch profile: Profile not found')
  }
  
  return profile
}
```

### Repository Pattern Implementation
The repository pattern is implemented using a base repository class defined in `lib/base-repository.ts`. Individual repositories extend this base class to provide specialized data access methods. For example, the `UserRepository` extends `BaseRepository<UserProfile>` and includes methods like `getByUserId`, `updateProfile`, and `createInitialProfile`.

## 🔐 Row Level Security (RLS) Patterns

### User-Based Access Control
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can update their own profile  
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

### Multi-tenant Patterns
```sql
-- Team-based access control
CREATE POLICY "Team members can view team data"
ON team_documents
FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = (SELECT auth.uid())
  )
);
```

### Performance Optimizations
```sql
-- Optimize RLS policies with indexing
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
```

## 🎨 Material-UI Integration

### Theme Setup with App Router
```typescript
// components/providers/ThemeProvider.tsx
'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { theme } from '@/lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  )
}

// app/layout.tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### MUI Toolpad Core Integration

Toolpad Core provides a complete dashboard framework with authentication, navigation, and theming. Use it as the foundation for dashboard layouts rather than custom implementations.

```bash
# Install Toolpad Core
npm install @toolpad/core
```

```typescript
// app/layout.tsx - Root layout with Toolpad providers
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { AppProvider } from '@toolpad/core/nextjs'
import { DashboardIcon, PeopleIcon, SettingsIcon } from '@mui/icons-material'
import { theme } from '@/lib/theme'

const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'users',
    title: 'Users',
    icon: <PeopleIcon />,
  },
  {
    segment: 'settings',
    title: 'Settings', 
    icon: <SettingsIcon />,
  },
]

const BRANDING = {
  logo: <img src="/logo.svg" alt="Logo" />,
  title: 'My Dashboard App',
  homeUrl: '/dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <AppProvider
            navigation={NAVIGATION}
            branding={BRANDING}
            theme={theme}
          >
            {children}
          </AppProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

// app/(dashboard)/layout.tsx - Dashboard-specific layout
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { PageContainer } from '@toolpad/core/PageContainer'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  // Server-side authentication check
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <PageContainer>
        {children}
      </PageContainer>
    </DashboardLayout>
  )
}
```

#### Authentication Integration
```typescript
// lib/auth/toolpad-auth.ts
import { createClient } from '@/lib/supabase/client'
import type { AuthProvider } from '@toolpad/core'

export const supabaseAuthProvider: AuthProvider = {
  async signIn() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    return { success: !error }
  },

  async signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    return { success: true }
  },

  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      image: user.user_metadata?.avatar_url,
    }
  },
}

// Update AppProvider to include auth
<AppProvider
  navigation={NAVIGATION}
  branding={BRANDING}
  theme={theme}
  authentication={supabaseAuthProvider}
>
  {children}
</AppProvider>
```

## 🧪 Testing Strategies

### Unit Testing with Vitest
```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

// vitest.setup.ts
import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

beforeAll(() => {
  // Mock next/headers
  vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
      get: vi.fn(),
    })),
  }))
})
```

### Integration Testing with Supabase
```typescript
// tests/lib/supabase.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

describe('Supabase Integration', () => {
  let supabase: ReturnType<typeof createClient>

  beforeEach(() => {
    supabase = createClient()
  })

  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('profiles').select('count')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

### End-to-End Testing with Playwright
```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="sign-in"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
})
```

### Storybook Component Testing
```bash
# Install Storybook
npx storybook@latest init
```

```typescript
// stories/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'contained',
    children: 'Button',
  },
}
```

## 📊 Monitoring with Sentry

### Sentry Setup
```bash
# Install and configure Sentry
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### Error Boundary Integration
```typescript
// app/global-error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

## 🚀 Development Workflow

### Local Development Setup
```bash
# Install dependencies
npm install

# Start Supabase locally
npx supabase start

# Start Next.js development server
npm run dev

# Run type checking
npm run type-check

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "storybook": "storybook dev -p 6006",
    "supabase:start": "npx supabase start",
    "supabase:stop": "npx supabase stop",
    "supabase:reset": "npx supabase db reset"
  }
}
```

## 🔒 Security Best Practices

### Authentication Security
- **Use RLS policies** for all database tables in the public schema
- **Validate sessions server-side** in all data access functions
- **Implement CSRF protection** for form submissions
- **Use secure cookie settings** for session management

### Data Protection
- **Sanitize user inputs** before database operations
- **Use parameterized queries** (Supabase handles this)
- **Implement rate limiting** on API routes
- **Validate file uploads** with type and size restrictions

### Environment Security
- **Never expose service keys** in client-side code
- **Use environment variables** for all secrets
- **Implement proper CORS** configuration
- **Enable HTTPS** in production

## 🚫 Common Gotchas

### Next.js App Router
- **Server Components vs Client Components** - Use 'use client' directive carefully
- **Hydration mismatches** - Ensure server and client render the same content  
- **Dynamic imports** - Use next/dynamic for client-side only components
- **Route groups** - Remember parentheses don't affect URL structure

### Supabase Integration
- **RLS policy debugging** - Use Supabase dashboard policy editor and logs
- **Auth state synchronization** - Handle auth state changes properly in components
- **Real-time subscriptions** - Clean up subscriptions to prevent memory leaks
- **Type generation** - Regularly update generated types from database schema

### Material-UI with Next.js
- **Emotion server-side rendering** - Use AppRouterCacheProvider correctly
- **Theme provider placement** - Wrap at layout level, not page level
- **Custom component theming** - Use theme.components for consistent styling
- **Bundle size optimization** - Use tree shaking and imports correctly

### Performance Considerations
- **RLS query performance** - Add indexes on columns used in policies
- **Real-time subscription limits** - Monitor concurrent connections
- **Image optimization** - Use Next.js Image component with Supabase Storage
- **Bundle size** - Monitor and optimize JavaScript bundle sizes

## 📋 Development Checklist

### Before Starting Development
- [ ] Set up Supabase project and get API keys
- [ ] Configure environment variables
- [ ] Set up database schema with proper RLS policies
- [ ] Configure authentication providers
- [ ] Set up local development environment

### During Development
- [ ] Use TypeScript throughout the application
- [ ] Implement proper error boundaries
- [ ] Add comprehensive test coverage
- [ ] Follow security best practices
- [ ] Optimize performance and bundle size

### Before Deployment
- [ ] Run all tests (unit, integration, e2e)
- [ ] Perform security audit
- [ ] Optimize build for production
- [ ] Set up monitoring and error tracking
- [ ] Configure proper environment variables

This template provides a solid foundation for building production-ready Next.js applications with Supabase integration, following modern best practices and patterns.
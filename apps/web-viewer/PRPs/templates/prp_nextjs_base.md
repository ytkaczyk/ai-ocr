---
name: "Next.js + Supabase Feature PRP"
description: "Specialized template for generating Next.js + Supabase full-stack application features with App Router, Material-UI, and comprehensive testing"
---

## Purpose

Develop a [FEATURE_NAME] feature for a Next.js + Supabase application using modern App Router patterns, Material-UI components, TypeScript integration, and comprehensive testing strategies.

## Core Principles

1. **App Router First**: Leverage Next.js App Router for optimal performance and developer experience
2. **Type-Safe Development**: Use TypeScript throughout with proper Supabase type generation
3. **Security by Design**: Implement RLS policies and secure authentication patterns
4. **Component-Driven UI**: Build with Material-UI and document in Storybook
5. **Test-Driven Quality**: Comprehensive testing with Vitest, Playwright, and integration tests

---

## Goal

Build a production-ready [FEATURE_NAME] feature that integrates seamlessly with Next.js App Router architecture and Supabase backend services, including:

- Responsive UI components with Material-UI
- Secure data access with RLS policies
- Real-time capabilities where appropriate
- Comprehensive test coverage
- Performance optimization
- Error handling and monitoring

## Why

- **Modern Stack**: Leverage the latest Next.js and Supabase capabilities for optimal performance
- **Developer Experience**: TypeScript and modern tooling for maintainable code
- **User Experience**: Fast, responsive, accessible interface with real-time features
- **Production Ready**: Security, testing, and monitoring built-in from the start
- **Scalable Architecture**: Patterns that support growth and team collaboration

## What

### Next.js App Router Implementation

**Project Structure:**
```
app/
├── (dashboard)/[FEATURE_ROUTE]/
│   ├── page.tsx              # Main feature page
│   ├── loading.tsx           # Loading UI
│   ├── error.tsx            # Error handling
│   └── layout.tsx           # Feature-specific layout
├── api/[FEATURE_API]/
│   └── route.ts             # API endpoints
└── globals.css              # Global styles

components/
├── [FEATURE_NAME]/
│   ├── [FeatureComponent].tsx
│   ├── [FeatureForm].tsx
│   └── index.ts             # Export barrel
└── ui/
    ├── Button.tsx           # Reusable UI components
    └── Form.tsx

lib/
├── supabase/
│   ├── client.ts            # Browser client
│   ├── server.ts            # Server client
│   └── middleware.ts        # Auth middleware
├── services/
│   └── [feature-service].ts # Business logic
└── types/
    └── [feature-types].ts   # TypeScript definitions
```

**Key Implementation Areas:**
- Server Components for data fetching and SEO optimization
- Client Components for interactive functionality
- Route handlers for API endpoints
- Server Actions for form submissions
- Middleware for authentication and authorization

### Supabase Integration

**Database Design:**
```sql
-- Example table structure for the feature
CREATE TABLE [FEATURE_TABLE] (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  [FEATURE_FIELDS],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security policies
ALTER TABLE [FEATURE_TABLE] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own [FEATURE_NAME]" ON [FEATURE_TABLE]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own [FEATURE_NAME]" ON [FEATURE_TABLE]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own [FEATURE_NAME]" ON [FEATURE_TABLE]
  FOR UPDATE USING (auth.uid() = user_id);
```

**Data Access Patterns:**
- Repository pattern for database operations
- Service layer for business logic
- Type-safe database operations with generated types
- Real-time subscriptions where appropriate
- Optimistic updates for better UX

### Material-UI Component System

**Theme Integration:**
```typescript
// components/providers/ThemeProvider.tsx
'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
})

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
```

**Component Architecture:**
- Consistent design system with MUI components
- Custom component variants following design tokens
- Responsive design with MUI breakpoints
- Accessibility compliance (WCAG 2.1)
- Dark mode support where appropriate

### Success Criteria

- [ ] **Next.js App Router Implementation**
  - [ ] Feature pages using App Router file conventions
  - [ ] Server Components for data fetching
  - [ ] Client Components for interactivity
  - [ ] API routes for backend functionality
  - [ ] Proper loading and error states

- [ ] **Supabase Integration**
  - [ ] Database schema with proper relationships
  - [ ] RLS policies for security
  - [ ] Type-safe database operations
  - [ ] Real-time subscriptions (if applicable)
  - [ ] Authentication and authorization

- [ ] **Material-UI Implementation**
  - [ ] Consistent theming and styling
  - [ ] Responsive design across devices
  - [ ] Accessibility compliance
  - [ ] Component reusability
  - [ ] Performance optimization

- [ ] **TypeScript Quality**
  - [ ] Strict TypeScript configuration
  - [ ] Generated types from Supabase
  - [ ] Proper type definitions for components
  - [ ] Type-safe API routes and handlers

- [ ] **Testing Coverage**
  - [ ] Unit tests for utility functions
  - [ ] Component tests with React Testing Library
  - [ ] Integration tests with Supabase
  - [ ] End-to-end tests with Playwright
  - [ ] Storybook documentation

## All Needed Context

### Documentation & References (MUST READ)

```yaml
# NEXT.JS DOCUMENTATION - Core framework understanding
- url: https://nextjs.org/docs/app
  why: Official App Router documentation for latest patterns and best practices

- url: https://nextjs.org/docs/app/building-your-application/routing
  why: Understanding App Router file conventions and routing patterns

- url: https://nextjs.org/docs/app/building-your-application/data-fetching
  why: Server Components, data fetching, and caching strategies

- url: https://nextjs.org/docs/app/guides/testing
  why: Testing strategies specific to Next.js applications

# SUPABASE DOCUMENTATION - Backend integration patterns  
- url: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
  why: Official Next.js integration guide with best practices

- url: https://supabase.com/docs/guides/auth/server-side/nextjs
  why: Server-side authentication patterns for App Router

- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  why: RLS policy design and implementation patterns

- url: https://supabase.com/docs/guides/realtime
  why: Real-time subscriptions and WebSocket management

# MATERIAL-UI DOCUMENTATION - UI component system
- url: https://mui.com/material-ui/integrations/nextjs/
  why: Official Next.js integration with App Router support

- url: https://mui.com/material-ui/customization/theming/
  why: Theme customization and design system implementation

- url: https://mui.com/toolpad/core/introduction/
  why: MUI Toolpad Core for dashboard and admin interfaces

# TESTING DOCUMENTATION - Quality assurance
- url: https://vitest.dev/guide/
  why: Modern testing framework setup and configuration

- url: https://playwright.dev/docs/intro
  why: End-to-end testing with multiple browsers

- url: https://storybook.js.org/docs/get-started/frameworks/nextjs
  why: Component documentation and testing with Next.js
```

### Current Technology Stack

```typescript
// Dependencies for Next.js + Supabase applications
interface NextjsSupabaseStack {
  // Core Framework
  framework: "Next.js 15+ App Router";
  language: "TypeScript";
  styling: "Material-UI v7+ + TailwindCSS";
  
  // Backend Services
  backend: "Supabase";
  database: "PostgreSQL with RLS";
  authentication: "Supabase Auth";
  storage: "Supabase Storage";
  realtime: "Supabase Realtime";
  
  // Development Tools
  packageManager: "npm" | "yarn";
  testing: {
    unit: "Vitest + React Testing Library";
    integration: "Supabase Test Database";
    e2e: "Playwright";
    documentation: "Storybook";
  };
  
  // Monitoring and Analytics
  errorTracking: "Sentry";
  analytics: "Vercel Analytics" | "Google Analytics";
  performance: "Web Vitals + Lighthouse";
}
```

### Repository Pattern Implementation

```typescript
// lib/repositories/base-repository.ts
export abstract class BaseRepository<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  async findById(id: string): Promise<T | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error)
      return null
    }

    return data as T
  }

  async findMany(filters?: Record<string, any>): Promise<T[]> {
    const supabase = createClient()
    let query = supabase.from(this.tableName).select('*')

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error)
      return []
    }

    return data as T[]
  }

  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    const supabase = createClient()
    const { data, error } = await supabase
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
    const supabase = createClient()
    const { data, error } = await supabase
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
    const supabase = createClient()
    const { error } = await supabase
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
```

### Known Development Patterns

```typescript
// CRITICAL: Next.js + Supabase patterns to follow

// 1. Data Access Layer Pattern
const dataAccessPatterns = {
  serverComponents: "Fetch data directly in Server Components",
  clientComponents: "Use hooks and context for client-side data",
  apiRoutes: "Create API routes for complex operations",
  serverActions: "Use Server Actions for form submissions",
  middleware: "Handle auth state in middleware"
};

// 2. Authentication Patterns
const authPatterns = {
  sessionManagement: "Use Supabase SSR for session handling",
  routeProtection: "Implement middleware for protected routes",
  rlsPolicies: "Use RLS for database-level security",
  typeGeneration: "Generate types from Supabase schema"
};

// 3. Component Development Patterns
const componentPatterns = {
  serverFirst: "Default to Server Components, opt into Client Components",
  muiIntegration: "Use AppRouterCacheProvider for proper SSR",
  responsive: "Implement mobile-first responsive design",
  accessibility: "Follow WCAG 2.1 guidelines for accessibility"
};

// 4. Testing Patterns
const testingPatterns = {
  unitTesting: "Test utility functions and custom hooks",
  componentTesting: "Test components with React Testing Library",
  integrationTesting: "Test with real Supabase test database",
  e2eTesting: "Test complete user journeys with Playwright"
};

// 5. Common pitfalls to avoid
const antiPatterns = {
  clientOnlyData: "Don't fetch data only on client-side",
  missingRLS: "Don't skip RLS policies on database tables",
  improperSSR: "Don't break server-side rendering with client code",
  untypedOperations: "Don't skip TypeScript types for database operations"
};
```

## Implementation Blueprint

### Phase 1: Project Setup and Configuration

```yaml
Setup Task 1 - Initialize Development Environment:
  PREPARE Next.js + Supabase development environment:
    - Create Next.js project with TypeScript and App Router
    - Install and configure Supabase client libraries
    - Set up Material-UI with proper SSR configuration
    - Configure TypeScript with strict mode and path mapping
    - Set up ESLint, Prettier, and Git hooks for code quality

Setup Task 2 - Configure Supabase Integration:
  ESTABLISH secure backend connection:
    - Create Supabase project and obtain API keys
    - Configure environment variables for development and production
    - Set up database schema with proper relationships
    - Implement RLS policies for data security
    - Configure authentication providers and settings
    - Set up local development with Supabase CLI
```

### Phase 2: Core Feature Implementation

```yaml
Implementation Task 1 - Database Layer:
  BUILD secure data foundation:
    - Design database schema with proper normalization
    - Create migration files for database changes
    - Implement RLS policies for user-based access control
    - Add database indexes for query performance
    - Set up database triggers for audit trails
    - Generate TypeScript types from schema

Implementation Task 2 - Data Access and Business Logic:
  CREATE service and repository layers:
    - Implement repository pattern for database operations
    - Create service layer for business logic and validation
    - Add error handling and logging throughout data layer
    - Implement caching strategies for performance
    - Create data transfer objects (DTOs) for API responses
    - Add comprehensive input validation and sanitization

Implementation Task 3 - API Layer Development:
  DEVELOP server-side functionality:
    - Create API routes following RESTful conventions
    - Implement Server Actions for form handling
    - Add authentication middleware for protected routes
    - Implement rate limiting and security measures
    - Create comprehensive error handling and response formatting
    - Add API documentation and validation schemas
```

### Phase 3: User Interface Development

```yaml
UI Task 1 - Component Architecture:
  BUILD reusable component system:
    - Create base UI components with Material-UI
    - Implement feature-specific components with proper state management
    - Add form components with validation and error handling
    - Create navigation and layout components
    - Implement loading states and skeleton screens
    - Add error boundaries and fallback UI

UI Task 2 - Responsive Design Implementation:
  ENSURE optimal user experience:
    - Implement mobile-first responsive design
    - Configure Material-UI breakpoints and spacing
    - Add proper touch targets and mobile interactions
    - Test across different screen sizes and devices
    - Implement progressive enhancement patterns
    - Add offline functionality where appropriate

UI Task 3 - Accessibility and Performance:
  OPTIMIZE for all users:
    - Implement WCAG 2.1 accessibility guidelines
    - Add proper ARIA labels and semantic HTML
    - Test with screen readers and keyboard navigation
    - Optimize bundle size and loading performance
    - Implement code splitting and lazy loading
    - Add performance monitoring and optimization
```

### Phase 4: Real-time and Advanced Features

```yaml
Advanced Task 1 - Real-time Integration:
  IMPLEMENT live updates and notifications:
    - Set up Supabase real-time subscriptions
    - Create WebSocket connection management
    - Implement optimistic updates for better UX
    - Add connection status monitoring and recovery
    - Create real-time UI components and feedback
    - Handle subscription cleanup and memory management

Advanced Task 2 - File Upload and Storage:
  ADD file handling capabilities:
    - Implement secure file upload with validation
    - Create image optimization and processing
    - Add file preview and management UI
    - Implement storage policies and access control
    - Create file download and sharing functionality
    - Add progress indicators and error handling

Advanced Task 3 - Search and Data Visualization:
  ENHANCE data discovery and presentation:
    - Implement full-text search with PostgreSQL
    - Add filtering and sorting capabilities
    - Create data visualization components
    - Implement pagination and infinite scrolling
    - Add export and reporting functionality
    - Create advanced data manipulation features
```

## Validation Loop

### Level 1: Code Quality and Type Safety

```bash
# TypeScript validation
npm run type-check
# Expected: No TypeScript errors, all types properly defined

# Code quality validation
npm run lint
npm run format
# Expected: Clean code following established patterns

# Build validation
npm run build
npm run analyze
# Expected: Successful build with optimized bundle size
```

### Level 2: Next.js App Router Validation

```bash
# App Router structure validation
find app/ -name "*.tsx" -o -name "*.ts" | grep -E "(page|layout|loading|error)\.tsx?$"
# Expected: Proper file naming following App Router conventions

# Server Component validation
grep -r "use client" app/ --include="*.tsx"
# Expected: Client directive used only when necessary

# API routes validation
curl -X GET http://localhost:3000/api/health
# Expected: API endpoints responding correctly
```

### Level 3: Supabase Integration Validation

```bash
# Database connection validation
npx supabase status
# Expected: Local Supabase instance running

# Schema validation
npx supabase db reset
npx supabase gen types typescript --local > types/supabase.ts
# Expected: Database schema applied, types generated

# RLS policy validation
npx supabase test db
# Expected: All RLS policies working correctly

# Authentication validation
npm run test -- --grep "auth"
# Expected: Authentication flows working properly
```

### Level 4: UI and Component Validation

```bash
# Storybook validation
npm run storybook
# Expected: All component stories rendering correctly

# Component testing
npm run test -- components/
# Expected: All component tests passing

# Accessibility validation
npm run test:a11y
# Expected: WCAG 2.1 compliance met

# Visual regression testing
npm run test:visual
# Expected: No unexpected visual changes
```

### Level 5: Integration and Performance Testing

```bash
# Integration testing
npm run test:integration
# Expected: Database operations and API integration working

# End-to-end testing
npm run test:e2e
# Expected: Complete user journeys working correctly

# Performance testing
npm run lighthouse
# Expected: Performance scores meeting targets

# Bundle size validation
npm run analyze
# Expected: Bundle size within acceptable limits
```

### Level 6: Security and Production Validation

```bash
# Security audit
npm audit
npx better-npm-audit audit
# Expected: No high-risk vulnerabilities

# Environment validation
npm run validate:env
# Expected: All required environment variables set

# Production build testing
npm run build && npm run start
# Expected: Production build working correctly

# Monitoring setup validation
npm run test:monitoring
# Expected: Error tracking and analytics configured
```

## Final Validation Checklist

### Technical Implementation
- [ ] Next.js App Router properly implemented with file conventions
- [ ] TypeScript strict mode enabled with comprehensive type coverage
- [ ] Supabase integration working with authentication and RLS policies
- [ ] Material-UI components with consistent theming and accessibility
- [ ] Repository pattern implemented for data access
- [ ] Server Actions and API routes properly secured

### Quality Assurance
- [ ] Unit tests covering all critical business logic
- [ ] Component tests for all UI components
- [ ] Integration tests with Supabase database
- [ ] End-to-end tests covering user journeys
- [ ] Storybook documentation for component library
- [ ] Performance benchmarks met (Lighthouse scores)

### Security and Production Readiness
- [ ] RLS policies protecting all database tables
- [ ] Authentication and authorization properly implemented
- [ ] Input validation and sanitization in place
- [ ] Error handling and monitoring configured
- [ ] Environment variables properly configured
- [ ] Security audit passed with no critical vulnerabilities

### User Experience
- [ ] Responsive design working across all devices
- [ ] Accessibility compliance (WCAG 2.1) validated
- [ ] Loading states and error handling implemented
- [ ] Real-time features working smoothly
- [ ] Performance optimized for fast load times
- [ ] Progressive enhancement for offline functionality

---

## Anti-Patterns to Avoid

### Next.js App Router
- ❌ Don't use `use client` unnecessarily - default to Server Components
- ❌ Don't fetch data in Client Components when Server Components would work
- ❌ Don't break SSR with client-only code in Server Components
- ❌ Don't ignore file naming conventions for App Router

### Supabase Integration
- ❌ Don't skip RLS policies on any table in the public schema
- ❌ Don't expose service keys in client-side code
- ❌ Don't forget to handle authentication state changes
- ❌ Don't ignore connection cleanup for real-time subscriptions

### Material-UI Integration
- ❌ Don't skip AppRouterCacheProvider for SSR
- ❌ Don't create inconsistent theming across components
- ❌ Don't ignore responsive design principles
- ❌ Don't skip accessibility best practices

### Development Practices
- ❌ Don't skip TypeScript types for better developer experience
- ❌ Don't ignore error boundaries and proper error handling
- ❌ Don't skip comprehensive testing coverage
- ❌ Don't ignore bundle size and performance optimization

This specialized PRP template ensures comprehensive implementation of Next.js + Supabase features following modern best practices and production-ready standards.
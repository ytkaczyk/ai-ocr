---
name: execute-nextjs-prp
description: Execute a Next.js + Supabase PRP with specialized validation loops
---

## Purpose

Execute Project Requirements and Patterns (PRPs) for Next.js + Supabase applications with comprehensive validation loops tailored to full-stack React development, including App Router patterns, Supabase integration, Material-UI theming, and production-ready testing.

## Usage

```bash
/execute-nextjs-prp <PRP_FILE.md>
```

Where `<PRP_FILE.md>` is a generated PRP file containing Next.js + Supabase implementation requirements.

## Execution Workflow

### Phase 1: Next.js Project Setup and Configuration

```yaml
Setup Task 1 - Initialize Next.js Project Structure:
  CREATE modern Next.js application with App Router:
    - Initialize project with TypeScript: `npx create-next-app@latest --typescript --app`
    - Configure project structure following App Router conventions
    - Set up proper directory organization (app/, components/, lib/, types/)
    - Configure TypeScript with strict mode and Next.js optimizations
    - Install and configure essential dependencies (MUI, Supabase, testing)
    
Setup Task 2 - Configure Development Environment:
  ESTABLISH comprehensive development workflow:
    - Configure package.json scripts for development, build, and testing
    - Set up environment variables (.env.local, .env.example)
    - Configure Next.js config (next.config.js) with optimization settings
    - Set up TypeScript configuration (tsconfig.json) with path mapping
    - Configure ESLint and Prettier for code quality
    - Set up Git hooks with Husky for pre-commit validation
```

### Phase 2: Supabase Integration Implementation

```yaml
Integration Task 1 - Supabase Client Configuration:
  IMPLEMENT secure Supabase integration:
    - Create browser-side client (lib/supabase/client.ts)
    - Create server-side client (lib/supabase/server.ts)
    - Configure middleware for session management (middleware.ts)
    - Set up authentication helpers and utilities
    - Configure environment variables for Supabase URLs and keys
    - Implement error handling and retry logic for database operations
    
Integration Task 2 - Database Schema and Security:
  ESTABLISH database structure and security policies:
    - Design database schema with proper relationships and constraints
    - Create migration files for database structure
    - Implement Row Level Security (RLS) policies for all tables
    - Set up authentication policies for different user roles
    - Configure storage policies for file uploads
    - Create database indexes for query performance optimization
    
Integration Task 3 - Authentication Flow Implementation:
  BUILD secure authentication system:
    - Create login/logout components and pages
    - Implement signup flow with email verification
    - Add OAuth provider integration (Google, GitHub, etc.)
    - Create protected route middleware and components
    - Implement session management and refresh logic
    - Add password reset and account management features
```

### Phase 3: Material-UI and Component Development

```yaml
UI Task 1 - Material-UI Setup and Configuration:
  CONFIGURE MUI integration with Next.js App Router:
    - Set up theme provider with AppRouterCacheProvider
    - Create custom theme with brand colors and typography
    - Configure server-side rendering with Emotion
    - Set up responsive breakpoints and spacing system
    - Implement dark/light theme switching capabilities
    - Configure MUI Toolpad Core for dashboard layouts
    
UI Task 2 - Component Architecture Implementation:
  BUILD reusable component system:
    - Create base UI components with consistent styling
    - Implement form components with validation and error handling
    - Build navigation components (header, sidebar, breadcrumbs)
    - Create data display components (tables, cards, lists)
    - Implement feedback components (modals, snackbars, loading states)
    - Build complex components (file upload, data visualization)
    
UI Task 3 - Responsive Design and Accessibility:
  ENSURE comprehensive user experience:
    - Implement responsive design across all screen sizes
    - Add keyboard navigation and screen reader support
    - Configure proper ARIA labels and semantic HTML
    - Test color contrast and visual accessibility
    - Implement mobile-first design patterns
    - Add progressive enhancement for offline functionality
```

### Phase 4: Business Logic and Data Layer

```yaml
Logic Task 1 - Repository Pattern Implementation:
  BUILD data access and business logic layers:
    - Create base repository class with common CRUD operations
    - Implement specific repositories for each data entity
    - Add service layer for business logic and validation
    - Create data transfer objects (DTOs) for API responses
    - Implement caching strategies for frequently accessed data
    - Add error handling and logging throughout data layer
    
Logic Task 2 - API Routes and Server Actions:
  DEVELOP server-side functionality:
    - Create API routes following REST/GraphQL patterns
    - Implement server actions for form handling
    - Add input validation and sanitization
    - Implement rate limiting and security measures
    - Create webhook handlers for external integrations
    - Add comprehensive error handling and monitoring
    
Logic Task 3 - Real-time Features:
  INTEGRATE real-time capabilities:
    - Set up Supabase real-time subscriptions
    - Implement WebSocket connection management
    - Create real-time UI components (live updates, notifications)
    - Add subscription cleanup and memory management
    - Implement optimistic updates for better UX
    - Add connection status monitoring and recovery
```

### Phase 5: Comprehensive Testing Implementation

```yaml
Testing Task 1 - Unit and Component Testing:
  IMPLEMENT comprehensive testing coverage:
    - Set up Vitest with React Testing Library
    - Create unit tests for utility functions and helpers
    - Write component tests for all UI components
    - Test custom hooks and context providers
    - Add snapshot testing for component rendering
    - Implement test coverage reporting and thresholds
    
Testing Task 2 - Integration Testing:
  BUILD integration test suite:
    - Set up Supabase test database and environment
    - Create integration tests for authentication flows
    - Test database operations and RLS policies
    - Add API route testing with request/response validation
    - Test real-time subscriptions and WebSocket connections
    - Implement performance testing for critical paths
    
Testing Task 3 - End-to-End Testing:
  CREATE comprehensive E2E test coverage:
    - Set up Playwright with multiple browser testing
    - Create user journey tests (signup, login, core features)
    - Test critical business flows and edge cases
    - Add visual regression testing for UI consistency
    - Implement mobile and responsive testing
    - Create performance audits and accessibility tests
    
Testing Task 4 - Storybook Component Documentation:
  DOCUMENT component library:
    - Set up Storybook with Next.js App Router support
    - Create stories for all UI components
    - Add interactive controls and documentation
    - Implement visual testing with Chromatic
    - Create design system documentation
    - Add component usage examples and best practices
```

## Specialized Validation Loops

### Level 1: Code Quality and Type Safety

```bash
# TypeScript validation
npm run type-check

# ESLint and Prettier validation
npm run lint
npm run lint:fix

# Next.js build validation
npm run build

# Bundle size analysis
npm run analyze

# Expected: Clean compilation, no type errors, optimized bundle
# If issues: Fix TypeScript errors, address linting issues, optimize bundle
```

### Level 2: Next.js Specific Validation

```bash
# App Router validation
npm run dev
curl http://localhost:3000 # Test homepage
curl http://localhost:3000/api/health # Test API routes

# Server Component validation
grep -r "use client" app/ # Verify client component usage
grep -r "use server" app/ # Verify server action implementation

# Performance validation
npm run build
npm run start
npx lighthouse http://localhost:3000 --output=json

# Expected: App router working, components properly classified, good performance scores
# If issues: Fix hydration errors, optimize server/client boundaries, improve performance
```

### Level 3: Supabase Integration Validation

```bash
# Supabase connection validation
npx supabase start
npx supabase status

# Database validation
npx supabase db reset
npx supabase gen types typescript --local > types/supabase.ts

# RLS policy validation
npx supabase test db

# Authentication validation
npm run test -- auth

# Expected: Supabase running locally, database schema applied, RLS policies working, auth tests passing
# If issues: Fix database schema, debug RLS policies, resolve authentication issues
```

### Level 4: UI and Component Validation

```bash
# Storybook validation
npm run storybook
npx storybook dev --smoke-test

# Component testing
npm run test -- components/

# Visual regression testing
npm run test:visual

# Accessibility validation
npm run test:a11y

# Expected: All stories render correctly, component tests pass, accessibility standards met
# If issues: Fix component rendering, address accessibility issues, update stories
```

### Level 5: Integration and E2E Validation

```bash
# Unit and integration tests
npm run test

# Database integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Expected: All tests pass, integration working, E2E flows complete, performance acceptable
# If issues: Debug failing tests, fix integration issues, optimize performance bottlenecks
```

### Level 6: Security and Production Readiness

```bash
# Security audit
npm audit
npx better-npm-audit audit

# Environment validation
npm run validate:env

# Production build testing
npm run build
npm run start
npm run test:production

# Monitoring validation
npm run test:monitoring

# Expected: No security vulnerabilities, environment properly configured, production build working
# If issues: Address security vulnerabilities, fix environment issues, resolve production errors
```

## Success Criteria Checklist

### Next.js Implementation
- [ ] App Router structure properly implemented
- [ ] TypeScript configuration optimized
- [ ] Server and Client Components correctly used
- [ ] API routes and server actions working
- [ ] Performance optimizations applied

### Supabase Integration
- [ ] Client configuration working (browser, server, middleware)
- [ ] Authentication flow fully implemented
- [ ] Database schema and RLS policies deployed
- [ ] Real-time subscriptions working
- [ ] Storage integration functioning

### Material-UI Integration
- [ ] Theme provider properly configured
- [ ] Component system consistently implemented
- [ ] Responsive design working across devices
- [ ] MUI Toolpad Core integrated (if applicable)
- [ ] Accessibility standards met

### Testing Coverage
- [ ] Unit tests covering critical functions
- [ ] Component tests for all UI components
- [ ] Integration tests for Supabase operations
- [ ] End-to-end tests for user journeys
- [ ] Storybook documentation complete

### Production Readiness
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Error monitoring configured
- [ ] Environment variables properly set
- [ ] CI/CD pipeline functional

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured
- [ ] Code coverage thresholds met
- [ ] Bundle size optimized
- [ ] Documentation complete

## Common Issue Resolution

### Next.js App Router Issues
- **Hydration Errors**: Check server/client component boundaries
- **Route Not Found**: Verify file naming and directory structure
- **API Route Issues**: Check route.ts file naming and HTTP methods

### Supabase Integration Issues
- **Authentication Errors**: Verify RLS policies and session management
- **Database Connection**: Check environment variables and Supabase status
- **Real-time Issues**: Verify subscriptions and cleanup logic

### Material-UI Issues
- **Theme Not Applied**: Check AppRouterCacheProvider setup
- **SSR Hydration**: Verify Emotion configuration
- **Component Styling**: Check theme provider hierarchy

This execution framework ensures comprehensive implementation and validation of Next.js + Supabase applications with production-ready quality standards.
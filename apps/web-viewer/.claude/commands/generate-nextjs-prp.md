---
name: generate-nextjs-prp
description: Generate a specialized PRP for Next.js + Supabase full-stack development
---

## Purpose

Generate comprehensive Project Requirements and Patterns (PRPs) for Next.js + Supabase full-stack applications with specialized research, implementation patterns, and validation loops tailored to modern React development with backend-as-a-service integration.

## Usage

```bash
/generate-nextjs-prp <INITIAL.md>
```

Where `<INITIAL.md>` is a file containing the feature requirements and specifications.

## Command Execution

This command performs specialized research and generation for Next.js + Supabase projects:

### Phase 1: Next.js + Supabase Technology Research

**CRITICAL: Web search extensively before implementation. This research is essential for specialized PRPs.**

```yaml
Research Task 1 - Next.js App Router Deep Dive (WEB SEARCH REQUIRED):
  WEB SEARCH and ANALYZE current Next.js patterns:
    - App Router architecture and file conventions
    - Server Components vs Client Components usage patterns  
    - Route handlers and API design patterns
    - Middleware and authentication integration
    - Performance optimization techniques (PPR, ISR, SSG)
    - TypeScript integration best practices
    
Research Task 2 - Supabase Integration Patterns (WEB SEARCH REQUIRED):
  WEB SEARCH and STUDY Supabase implementation approaches:
    - Authentication flows and session management
    - Database schema design with PostgreSQL
    - Row Level Security (RLS) policy patterns
    - Real-time subscriptions and WebSocket management
    - Storage integration and file handling
    - Edge Functions and server-side logic
    - Supabase CLI and local development workflow
    
Research Task 3 - Material-UI + Next.js Integration (WEB SEARCH REQUIRED):
  WEB SEARCH and RESEARCH current MUI implementation:
    - MUI v7+ integration with Next.js App Router
    - Server-side rendering with Emotion/styled-components
    - Theme configuration and customization patterns
    - MUI Toolpad Core for dashboard components
    - Responsive design and mobile-first approaches
    - Performance optimization with tree shaking
    
Research Task 4 - Testing and Quality Assurance (WEB SEARCH REQUIRED):
  WEB SEARCH and ANALYZE modern testing approaches:
    - Vitest setup and configuration for Next.js
    - React Testing Library best practices
    - Playwright end-to-end testing patterns
    - Storybook integration with Next.js App Router
    - Supabase integration testing strategies
    - Component testing and visual regression testing
    
Research Task 5 - Production and Monitoring Patterns (WEB SEARCH REQUIRED):
  WEB SEARCH and INVESTIGATE deployment strategies:
    - Vercel deployment optimization
    - Environment configuration and secrets management
    - Sentry error tracking and performance monitoring
    - Database migration and schema versioning
    - CI/CD pipeline configuration
    - Security best practices and vulnerability scanning
```

### Phase 2: Generate Specialized Next.js + Supabase PRP

Create comprehensive PRP with technology-specific patterns:

```yaml
PRP Generation Task 1 - Technology Integration Analysis:
  ANALYZE feature requirements in context of Next.js + Supabase:
    - Identify required App Router patterns (layouts, pages, route groups)
    - Determine Supabase services needed (auth, database, storage, realtime)
    - Plan MUI component hierarchy and theming requirements
    - Define testing strategy appropriate for full-stack features
    - Specify security requirements and RLS policy needs
    
PRP Generation Task 2 - Implementation Blueprint Creation:
  CREATE detailed implementation guide covering:
    - Next.js project structure following App Router conventions
    - Supabase client configuration (browser, server, middleware)
    - Database schema design with proper relationships and constraints
    - Authentication flow implementation with session management
    - MUI theme configuration and component customization
    - Repository pattern implementation for data access
    - Real-time features and subscription management
    - File upload and storage integration patterns
    
PRP Generation Task 3 - Validation Loop Design:
  DESIGN comprehensive validation covering:
    - TypeScript compilation and type checking
    - Next.js build optimization and bundle analysis
    - Supabase RLS policy testing and security validation
    - Unit tests with Vitest and React Testing Library
    - Integration tests with real Supabase test database
    - End-to-end tests with Playwright
    - Storybook component documentation and testing
    - Performance testing and Lighthouse audits
    - Security scanning and vulnerability assessment
```

### Phase 3: Specialized Context Integration

```yaml
Context Integration Task 1 - Framework-Specific Documentation:
  INCLUDE comprehensive references to:
    - Official Next.js documentation (app router, deployment, optimization)
    - Supabase documentation (auth, database, storage, realtime, edge functions)
    - Material-UI documentation (components, theming, customization)
    - TypeScript best practices for React and database interactions
    - Testing framework documentation (Vitest, Playwright, Storybook)
    - Performance monitoring documentation (Sentry, Web Vitals)
    
Context Integration Task 2 - Common Patterns and Anti-patterns:
  DOCUMENT technology-specific gotchas:
    - Next.js hydration issues and server/client component boundaries
    - Supabase RLS policy debugging and performance optimization
    - MUI server-side rendering and theme provider setup
    - Authentication state management across route navigation
    - Real-time subscription cleanup and memory management
    - Database query optimization and N+1 problem avoidance
    - Bundle size optimization and code splitting strategies
    
Context Integration Task 3 - Security and Performance Considerations:
  EMPHASIZE critical implementation details:
    - Supabase RLS policy design and testing procedures
    - Authentication flow security and session management
    - API route protection and rate limiting
    - File upload security and validation
    - Database query performance and indexing strategies
    - Real-time subscription performance and connection limits
    - Next.js performance optimization (ISR, SSG, streaming)
```

## Generated PRP Structure

The generated PRP will include specialized sections:

```markdown
## Next.js App Router Implementation
- Project structure following App Router conventions
- Server Component vs Client Component usage patterns
- Route handlers and API integration patterns
- Middleware configuration for authentication

## Supabase Integration Patterns  
- Client configuration (browser, server, middleware)
- Authentication flow implementation
- Database schema and RLS policy design
- Real-time subscription management
- Storage integration and file handling

## Material-UI Integration
- Theme provider setup with App Router
- Component customization and styling patterns
- Responsive design implementation
- MUI Toolpad Core dashboard patterns

## Repository Pattern Implementation
- Data access layer (DAL) design
- Service layer organization
- Type-safe database operations
- Error handling and validation

## Testing Strategy
- Unit testing with Vitest and React Testing Library
- Integration testing with Supabase test database
- End-to-end testing with Playwright
- Component testing with Storybook
- Performance testing and monitoring

## Security Implementation
- RLS policy design and validation
- Authentication and authorization patterns
- API security and rate limiting
- File upload security and validation

## Performance Optimization
- Next.js build optimization techniques
- Database query optimization
- Bundle size management
- Real-time subscription performance
```

## Validation Commands

After PRP generation, validate with Next.js + Supabase specific checks:

```bash
# Validate Next.js configuration
npm run type-check
npm run build
npm run lint

# Validate Supabase integration  
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local

# Run comprehensive test suite
npm run test
npm run test:e2e
npm run storybook

# Performance validation
npm run build && npm run analyze
```

## Success Criteria

- [ ] Comprehensive technology research completed with web searches
- [ ] Next.js App Router patterns properly documented
- [ ] Supabase integration patterns clearly defined
- [ ] Material-UI setup and theming configured
- [ ] Repository pattern implementation specified
- [ ] Testing strategy covering all application layers
- [ ] Security implementation with RLS policies documented
- [ ] Performance optimization strategies included
- [ ] Validation loops appropriate for full-stack development
- [ ] All common gotchas and anti-patterns documented
- [ ] Generated PRP immediately actionable for development

This specialized command ensures comprehensive coverage of Next.js + Supabase development patterns, providing developers with production-ready implementation guidance.
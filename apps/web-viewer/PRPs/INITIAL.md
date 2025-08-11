# Next.js + Supabase Feature Request

## TECHNOLOGY/FRAMEWORK:

Next.js 15+ with App Router, Supabase backend (PostgreSQL database, authentication, real-time subscriptions, storage), Material-UI v7+ for UI components, TypeScript for type safety, and comprehensive testing with Vitest, Playwright, and Storybook.

---

## FEATURE PURPOSE:

**What specific feature should this Next.js + Supabase application implement?**

A user dashboard with profile management, real-time notifications, file upload capabilities, and data visualization. The dashboard should support user authentication, personalized content, real-time updates, and responsive design across all devices.

---

## CORE FEATURES:

**What are the essential features this implementation should include?**

- User authentication and session management with Supabase Auth
- Protected dashboard routes with middleware-based route protection
- Profile management with form validation and image uploads
- Real-time notifications using Supabase real-time subscriptions
- Data visualization with charts and interactive components
- File upload and management with Supabase Storage integration
- Responsive Material-UI components with custom theming
- Search and filtering capabilities with PostgreSQL full-text search
- Dark/light mode theme switching
- Comprehensive error handling and user feedback

---

## NEXT.JS APP ROUTER IMPLEMENTATION:

**What App Router patterns and architecture should be implemented?**

- Modern App Router file structure with proper route organization
- Server Components for data fetching and SEO optimization
- Client Components for interactive functionality and real-time features
- Route groups for organizing dashboard sections and layouts
- Loading and error boundaries for proper UX during async operations
- Server Actions for form submissions and data mutations
- API routes for complex business logic and external integrations
- Middleware for authentication state management and route protection
- Optimistic updates for better user experience
- Proper TypeScript integration throughout the application

---

## SUPABASE INTEGRATION PATTERNS:

**What Supabase services and patterns should be implemented?**

- Database schema design with proper relationships and constraints
- Row Level Security (RLS) policies for user-based data access
- Authentication with email/password and OAuth provider integration
- Real-time subscriptions for live updates and notifications
- Storage integration for profile pictures and file management
- Type generation from database schema for type-safe operations
- Repository pattern for data access and business logic separation
- Local development setup with Supabase CLI
- Database migrations and versioning strategies
- Performance optimization with proper indexing and query patterns

---

## MATERIAL-UI INTEGRATION:

**What UI patterns and theming should be implemented?**

- Material-UI v7+ integration with Next.js App Router
- Custom theme configuration with brand colors and typography
- AppRouterCacheProvider setup for proper server-side rendering
- Responsive design using MUI breakpoint system
- Component customization following Material Design principles
- Dark/light mode implementation with theme switching
- Accessibility compliance (WCAG 2.1) throughout the interface
- MUI Toolpad Core integration for dashboard layout components
- Form components with validation and error handling
- Data display components (tables, cards, charts) with proper styling

---

## EXAMPLES TO INCLUDE:

**What working examples should be provided in the implementation?**

- Complete user authentication flow (login, signup, logout, password reset)
- Dashboard layout with navigation and user menu
- Profile management form with image upload and validation
- Real-time chat or notification system
- Data table with sorting, filtering, and pagination
- File upload component with drag-and-drop functionality
- Chart components for data visualization
- Search functionality with autocomplete and filters
- Settings page with theme switching and preferences
- Error handling examples with user-friendly messages

---

## DOCUMENTATION TO RESEARCH:

**What specific documentation should be thoroughly researched and referenced?**

- https://nextjs.org/docs/app - Next.js App Router official documentation
- https://nextjs.org/docs/app/building-your-application/routing - App Router routing patterns
- https://nextjs.org/docs/app/building-your-application/data-fetching - Server Components and data fetching
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs - Supabase Next.js integration guide
- https://supabase.com/docs/guides/auth/server-side/nextjs - Server-side authentication with Next.js
- https://supabase.com/docs/guides/database/postgres/row-level-security - RLS policies and security patterns
- https://supabase.com/docs/guides/realtime - Real-time subscriptions and WebSocket management
- https://supabase.com/docs/guides/storage - File storage and management
- https://mui.com/material-ui/integrations/nextjs/ - Material-UI Next.js integration
- https://mui.com/material-ui/customization/theming/ - MUI theming and customization
- https://mui.com/toolpad/core/introduction/ - MUI Toolpad Core for dashboards
- https://vitest.dev/guide/ - Vitest testing framework
- https://playwright.dev/docs/intro - Playwright end-to-end testing
- https://storybook.js.org/docs/get-started/frameworks/nextjs - Storybook with Next.js
- https://docs.sentry.io/platforms/javascript/guides/nextjs/ - Sentry error monitoring

---

## DEVELOPMENT PATTERNS:

**What specific development patterns, project structures, or workflows should be researched and included?**

- Next.js App Router project structure with TypeScript
- Supabase client configuration for browser, server, and middleware
- Repository pattern implementation for database operations
- Service layer architecture for business logic separation
- Component-driven development with Storybook documentation
- Type-safe development with Supabase-generated TypeScript types
- Form handling with React Hook Form and Zod validation
- State management with React Context and custom hooks
- Error boundary implementation for graceful error handling
- Performance optimization with React.memo, useMemo, and useCallback
- Code splitting and lazy loading for optimal bundle sizes
- CI/CD pipeline setup with automated testing and deployment

---

## SECURITY & BEST PRACTICES:

**What security considerations and best practices are critical for this technology stack?**

- Row Level Security (RLS) policy implementation and testing
- Authentication session management and token refresh
- Input validation and sanitization for all user inputs
- API route protection with middleware and authentication checks
- File upload security with type validation and size limits
- Environment variable management for secrets and configuration
- CORS configuration for cross-origin requests
- Rate limiting implementation for API routes
- Content Security Policy (CSP) configuration
- SQL injection prevention through parameterized queries
- XSS protection with proper input escaping
- HTTPS enforcement in production environments

---

## COMMON GOTCHAS:

**What are the typical pitfalls, edge cases, or complex issues developers face with this technology stack?**

- Next.js App Router hydration mismatches between server and client
- Supabase RLS policy debugging and performance issues
- Material-UI server-side rendering setup with Emotion
- Real-time subscription memory leaks and connection management
- TypeScript type conflicts between Next.js and Supabase
- Authentication state synchronization across route navigation
- Bundle size optimization with Material-UI tree shaking
- Database query performance with complex RLS policies
- File upload handling and progress tracking
- Error boundary placement and error state management

---

## VALIDATION REQUIREMENTS:

**What specific validation, testing, or quality checks should be included in the implementation?**

- TypeScript strict mode validation with no type errors
- Next.js build optimization and bundle size analysis
- Supabase RLS policy testing with automated test suite
- Unit testing with Vitest and React Testing Library
- Integration testing with Supabase test database
- End-to-end testing with Playwright across multiple browsers
- Component testing and documentation with Storybook
- Accessibility testing with axe-core and manual validation
- Performance testing with Lighthouse and Web Vitals
- Security scanning with npm audit and dependency checking
- Visual regression testing for UI consistency
- Database migration testing and rollback procedures

---

## INTEGRATION FOCUS:

**What specific integrations or third-party services are commonly used with this technology stack?**

- Vercel for deployment and hosting optimization
- Sentry for error tracking and performance monitoring
- GitHub Actions for CI/CD pipeline automation
- Stripe for payment processing integration
- SendGrid or Resend for transactional email services
- Cloudinary or similar for image optimization and CDN
- Vercel Analytics for user behavior tracking
- OpenTelemetry for distributed tracing and monitoring
- Docker for containerized development and deployment
- Terraform or similar for infrastructure as code

---

## ADDITIONAL NOTES:

**Any other specific requirements, constraints, or considerations for this implementation?**

- Focus on TypeScript best practices with strict type checking throughout
- Emphasize performance optimization for mobile devices and slow networks
- Implement comprehensive error handling with user-friendly error messages
- Follow accessibility best practices (WCAG 2.1) for inclusive design
- Create reusable component patterns for consistency across the application
- Document all components and utilities with comprehensive JSDoc comments
- Implement proper SEO optimization with Next.js App Router features
- Plan for internationalization (i18n) support in component architecture
- Consider offline functionality with service workers where appropriate
- Design for scalability with proper database indexing and query optimization

---

## TEMPLATE COMPLEXITY LEVEL:

**What level of complexity should this implementation target?**

- [ ] **Beginner-friendly** - Simple getting started patterns
- [X] **Intermediate** - Production-ready patterns with common features  
- [ ] **Advanced** - Comprehensive patterns including complex scenarios
- [ ] **Enterprise** - Full enterprise patterns with monitoring, scaling, security

This implementation should be production-ready but not overly complex. It should demonstrate best practices for Next.js + Supabase development while remaining maintainable and extensible. The focus should be on creating a solid foundation that can be built upon for more complex applications.

---

**REMINDER: Be as specific as possible in each section. The more detailed you are here, the better the generated PRP will be. This INITIAL.md file is where you should put all your requirements, not just basic information.**
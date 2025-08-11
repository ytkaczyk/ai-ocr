# Next.js + Supabase Context Engineering Template

A specialized context engineering template for building production-ready full-stack applications with Next.js App Router, Supabase backend services, Material-UI components, and comprehensive testing strategies.

## 🚀 Quick Start - Copy Template First

**Get started in 30 seconds:**

```bash
# Copy the template to your project directory
python copy_template.py /path/to/your/project

# Navigate to your new project
cd /path/to/your/project

# Follow the PRP workflow (see below)
```

The copy script includes everything you need: specialized patterns, working examples, and comprehensive documentation.

## 📋 PRP Framework Workflow

This template follows the proven 3-step PRP (Project Requirements and Patterns) workflow:

### Step 1: Define Your Requirements
Edit `PRPs/INITIAL.md` with your specific feature requirements:
```bash
# Customize the feature requirements template
code PRPs/INITIAL.md
```

### Step 2: Generate Your PRP
Use the specialized Next.js + Supabase PRP generation command:
```bash
# Generate a comprehensive PRP with technology-specific patterns
/generate-nextjs-prp PRPs/INITIAL.md
```

### Step 3: Execute Your PRP
Execute the generated PRP with comprehensive validation loops:
```bash
# Implement your feature with built-in quality checks
/execute-nextjs-prp PRPs/your-generated-prp.md
```

## 📁 Template Structure

```
nextjs-supabase/
├── CLAUDE.md                    # Next.js + Supabase specialized patterns
├── .claude/commands/            # Specialized PRP commands
│   ├── generate-nextjs-prp.md  # PRP generation for Next.js + Supabase
│   └── execute-nextjs-prp.md   # PRP execution with validation loops
├── PRPs/
│   ├── templates/
│   │   └── prp_nextjs_base.md  # Specialized base PRP template
│   ├── ai_docs/                # Additional documentation (optional)
│   └── INITIAL.md              # Example feature request template
├── examples/                   # Working code examples
│   ├── lib/                    # Supabase clients and repositories
│   ├── components/             # Material-UI components
│   └── app/                    # Next.js App Router examples
├── copy_template.py            # Template deployment script
└── README.md                   # This file
```

## 🎯 What You Can Build

This template is optimized for building modern full-stack web applications:

### Core Application Types
- **SaaS Dashboards** - User management, analytics, real-time data
- **Multi-tenant Applications** - Team collaboration, workspace management
- **E-commerce Platforms** - Product catalogs, user accounts, order management
- **Content Management** - Blog platforms, documentation sites, media libraries
- **Social Applications** - User profiles, messaging, activity feeds

### Key Features You Can Implement
- User authentication and authorization with multiple providers
- Real-time notifications and live updates
- File upload and management systems
- Advanced data visualization and reporting
- Responsive design across all devices
- Search and filtering capabilities
- Payment processing integration
- Email notifications and automation

## 📚 Key Features

### Modern Technology Stack
- **Next.js 15+ App Router** - Latest React framework with server components
- **Supabase** - PostgreSQL database, authentication, storage, real-time subscriptions
- **Material-UI v7+** - Comprehensive React component library with theming
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first styling alongside Material-UI

### Development Excellence
- **Repository Pattern** - Clean data access layer with service separation
- **Row Level Security** - Database-level security with Supabase RLS policies
- **Server Components** - Optimal performance with Next.js App Router
- **Real-time Integration** - WebSocket subscriptions for live updates
- **Type Generation** - Automated TypeScript types from database schema

### Testing & Quality Assurance
- **Vitest** - Fast unit testing with React Testing Library
- **Playwright** - Comprehensive end-to-end testing across browsers
- **Storybook** - Component documentation and visual testing
- **Integration Testing** - Real database testing with Supabase
- **Performance Testing** - Lighthouse audits and Web Vitals monitoring

### Production Readiness
- **Security Best Practices** - Authentication, authorization, input validation
- **Error Monitoring** - Sentry integration for error tracking
- **Performance Optimization** - Bundle splitting, image optimization, caching
- **Accessibility Compliance** - WCAG 2.1 standards throughout
- **SEO Optimization** - Server-side rendering and meta tag management

## 🔍 Examples Included

### Authentication & User Management
- Complete login/signup flow with email verification
- OAuth integration (Google, GitHub, Discord)
- User profile management with image upload
- Password reset and account recovery

### Database & Storage
- Repository pattern implementation with TypeScript
- Row Level Security policy examples
- File upload with drag-and-drop functionality
- Real-time subscriptions and optimistic updates

### UI Components
- Material-UI theme configuration with Next.js App Router
- Responsive dashboard layout with navigation
- Form components with validation and error handling
- Data visualization with charts and interactive elements

### Testing Examples
- Unit tests for services and utilities
- Component tests with React Testing Library
- Integration tests with Supabase database
- End-to-end user journey tests with Playwright

## 📖 Documentation References

### Core Framework Documentation
- [Next.js App Router](https://nextjs.org/docs/app) - Official App Router documentation
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs) - Integration guide
- [Material-UI + Next.js](https://mui.com/material-ui/integrations/nextjs/) - UI component integration

### Specialized Patterns
- [Supabase Authentication](https://supabase.com/docs/guides/auth/server-side/nextjs) - Server-side auth patterns
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - Database security
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - Real-time subscriptions

### Testing & Quality
- [Vitest Guide](https://vitest.dev/guide/) - Modern testing framework
- [Playwright Documentation](https://playwright.dev/docs/intro) - E2E testing
- [Storybook + Next.js](https://storybook.js.org/docs/get-started/frameworks/nextjs) - Component documentation

## 🚫 Common Gotchas

### Next.js App Router
- **Server vs Client Components**: Use `'use client'` directive only when necessary
- **Hydration Issues**: Ensure server and client render the same content
- **Route Protection**: Implement authentication checks in middleware, not components
- **Data Fetching**: Prefer Server Components for data fetching when possible

### Supabase Integration
- **RLS Policy Debugging**: Use Supabase dashboard policy editor for testing
- **Authentication State**: Handle auth state changes across route navigation
- **Real-time Cleanup**: Always clean up subscriptions to prevent memory leaks
- **Type Generation**: Regularly update generated types from database schema

### Material-UI Integration
- **Server-Side Rendering**: Use AppRouterCacheProvider for proper SSR
- **Theme Provider**: Wrap at layout level, not individual page level
- **Bundle Size**: Use tree shaking and proper imports for optimization
- **Custom Styling**: Use theme.components for consistent customization

### Performance Considerations
- **Database Queries**: Add proper indexes for RLS policy performance
- **Bundle Size**: Monitor and optimize JavaScript bundle sizes
- **Real-time Limits**: Be mindful of concurrent subscription limits
- **Image Optimization**: Use Next.js Image component with Supabase Storage

## 🛠️ Development Workflow

### Initial Setup
```bash
# Copy template
python copy_template.py my-nextjs-app
cd my-nextjs-app

# Initialize Next.js project
npx create-next-app@latest . --typescript --app --use-npm

# Install dependencies
npm install @supabase/ssr @supabase/supabase-js
npm install @mui/material @emotion/react @emotion/styled @mui/material-nextjs
npm install @hookform/resolvers react-hook-form zod

# Development dependencies
npm install -D vitest @testing-library/react @playwright/test
npm install -D @types/node @types/react @types/react-dom
```

### Development Commands
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:integration # Integration tests

# Build for production
npm run build

# Start Storybook
npm run storybook
```

### Supabase Setup
```bash
# Start local Supabase
npx supabase start

# Reset database
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > types/supabase.ts
```

## 🔒 Security Best Practices

### Database Security
- Enable RLS on all tables in the public schema
- Create specific policies for each user role and operation
- Add proper indexes on columns used in RLS policies
- Regularly audit and test security policies

### Authentication Security
- Use server-side session validation for protected routes
- Implement proper CORS configuration
- Validate and sanitize all user inputs
- Use environment variables for all secrets

### Application Security
- Implement rate limiting on API routes
- Add proper error handling without exposing sensitive information
- Use HTTPS in production environments
- Regular security audits with npm audit

## 📈 Performance Optimization

### Next.js Optimization
- Use Server Components for data fetching when possible
- Implement proper code splitting and lazy loading
- Optimize images with Next.js Image component
- Enable compression and caching headers

### Database Performance
- Add indexes on frequently queried columns
- Optimize RLS policies for query performance
- Use connection pooling for database connections
- Monitor query performance with Supabase metrics

### Bundle Optimization
- Use tree shaking for Material-UI components
- Implement dynamic imports for large components
- Monitor bundle size with webpack-bundle-analyzer
- Optimize third-party dependencies

## 🌐 Deployment & Production

### Environment Configuration
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Deployment Platforms
- **Vercel** - Optimal for Next.js with automatic optimizations
- **Netlify** - Great for static sites with edge functions
- **Railway** - Full-stack deployment with database hosting
- **Docker** - Containerized deployment for any platform

### Production Checklist
- [ ] Environment variables properly configured
- [ ] Database migrations applied
- [ ] RLS policies tested and validated
- [ ] Error monitoring configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Security audit completed
- [ ] Backup strategy implemented

## 🤝 Contributing

This template is part of the context engineering framework. To contribute:

1. Follow the established patterns in `CLAUDE.md`
2. Add comprehensive examples for new features
3. Update documentation and validation loops
4. Test all changes with the PRP workflow
5. Maintain backwards compatibility

## 📝 License

This template is part of the context engineering framework and follows the same licensing terms as the parent project.

---

## 🎉 Ready to Build!

You now have everything needed to build production-ready Next.js + Supabase applications:

1. **Copy the template** with `python copy_template.py`
2. **Define your requirements** in `PRPs/INITIAL.md`
3. **Generate your PRP** with `/generate-nextjs-prp`
4. **Execute your PRP** with `/execute-nextjs-prp`
5. **Build amazing applications** with confidence!

The template provides comprehensive patterns, working examples, and validation loops to ensure your applications meet production standards from day one.

Happy coding! 🚀
# Dev Container for OCR Translation Viewer

This dev container provides a consistent development environment for the web-viewer application.

## Features

### Installed Extensions

- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Autocomplete for Tailwind classes
- **Playwright Test for VSCode**: Run and debug Playwright tests
- **Vitest Explorer**: Run and debug unit tests
- **Snyk Security**: Vulnerability scanning and security analysis
- **GitLens**: Enhanced Git integration
- **GitHub Copilot**: AI-powered code completion
- **TypeScript Support**: Enhanced TypeScript development
- **NPM IntelliSense**: Autocomplete for npm modules
- **Path IntelliSense**: Autocomplete for file paths

### Pre-configured Settings

- Auto-format on save with Prettier
- ESLint auto-fix on save
- TypeScript workspace version
- Playwright browser reuse for faster test execution

### Pre-installed Tools

- Node.js 22 (LTS)
- Git
- GitHub CLI
- Playwright browsers (Chromium)
- All npm dependencies

## Usage

1. **Open in Dev Container**:
   - Open VS Code in the `apps/web-viewer` directory
   - Press `F1` and select "Dev Containers: Reopen in Container"
   - Wait for the container to build and initialize

2. **Available Commands** (all from package.json):
   ```bash
   npm run dev              # Start development server
   npm run build            # Build for production
   npm run start            # Start production server
   npm run lint             # Run ESLint
   npm run lint:fix         # Fix ESLint issues
   npm run type-check       # TypeScript type checking
   npm run test             # Run unit tests
   npm run test:watch       # Run tests in watch mode
   npm run test:ui          # Run tests with UI
   npm run test:debug       # Debug tests
   npm run test:e2e         # Run E2E tests
   npm run test:e2e:single  # Run E2E tests with dev server
   npm run test:e2e:ui      # Run E2E tests with Playwright UI
   npm run test:coverage    # Run tests with coverage
   ```

3. **Port Forwarding**:
   - Port 3000 (Next.js dev server) is automatically forwarded
   - You'll receive a notification when the port is forwarded

## Post-Create Setup

The container automatically runs:
1. `npm install` - Install all dependencies
2. `npx playwright install chromium` - Install Playwright browsers
3. `npm run postinstall` - Copy PDF.js worker file

## Customization

To customize the dev container:
- Edit `.devcontainer/devcontainer.json` for VS Code settings and extensions
- Edit `.devcontainer/Dockerfile` for additional tools or dependencies

## Troubleshooting

### Playwright Tests Failing
If Playwright tests fail, ensure browsers are installed:
```bash
npx playwright install
```

### Port Already in Use
If port 3000 is already in use, update the port in `devcontainer.json`:
```json
"forwardPorts": [3001]
```

### Performance Issues
For better performance on Windows, ensure you're using WSL 2 and the workspace is in the Linux filesystem.

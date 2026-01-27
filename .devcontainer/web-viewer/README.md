# Dev Container for OCR Translation Viewer

This dev container provides a fully configured, reproducible development environment for the web-viewer application with all necessary tools, extensions, and dependencies pre-installed.

## Overview

The dev container uses:

- **Base Image**: Microsoft's TypeScript-Node devcontainer (Node.js 22 LTS on Debian Bookworm)
- **Container Runtime**: Docker with Docker Compose for volume management
- **Package Manager**: npm with automatic dependency installation
- **Browser Testing**: Playwright with Chromium pre-installed

## Features

### VS Code Extensions

The container comes with the following extensions pre-installed:

**Development Tools:**

- ESLint - Code linting and quality checks
- Prettier - Automatic code formatting
- TypeScript Next - Latest TypeScript language features
- NPM IntelliSense - Autocomplete for npm modules
- Path IntelliSense - Autocomplete for file paths

**Framework & Styling:**

- Tailwind CSS IntelliSense - Autocomplete and syntax highlighting for Tailwind classes

**Testing:**

- Playwright Test for VSCode - Run and debug E2E tests
- Vitest Explorer - Run and debug unit tests with UI

**Security & Quality:**

- Snyk Security Scanner - Vulnerability scanning and security analysis
- Codecov - Code coverage reporting
- CodeRabbit - AI-powered code reviews
- Claude Code (Anthropic) - AI coding assistant

**Git & Collaboration:**

- GitLens - Enhanced Git integration and history
- GitHub Copilot & Copilot Chat - AI-powered code completion

### Pre-configured Settings

The dev container automatically configures VS Code with:

- Format on save (using Prettier)
- ESLint auto-fix on save
- TypeScript workspace version from project
- Playwright browser reuse for faster test execution
- Playwright trace viewer enabled

### Pre-installed Tools

- **Node.js 22** (LTS) - JavaScript runtime
- **npm** - Package manager
- **Git** - Version control
- **GitHub CLI** (`gh`) - GitHub integration from terminal
- **Playwright browsers** - Chromium for E2E testing
- **System dependencies** - All required libraries for Playwright

### Volume Management

The container uses Docker volumes for optimal performance:

- **node_modules volume**: Persists dependencies between rebuilds
- **next_cache volume**: Persists Next.js build cache for faster rebuilds
- **Workspace bind mount**: Syncs your local code with the container

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- [Visual Studio Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- (Windows users) [WSL 2](https://docs.microsoft.com/en-us/windows/wsl/install) configured

### Opening the Dev Container

1. **Clone the repository** (if not already done):

   ```bash
   git clone https://github.com/ytkaczyk/ai-ocr.git
   cd ai-ocr
   ```

2. **Open in VS Code**:

   ```bash
   code .
   ```

3. **Reopen in Container**:
   - VS Code should prompt you to "Reopen in Container"
   - Or manually: Press `F1` → "Dev Containers: Reopen in Container"
   - Wait for the container to build (first time takes 5-10 minutes)

4. **Verify Setup**:
   The container automatically runs post-create commands:
   - Installs all npm dependencies
   - Installs Playwright Chromium browser
   - Copies PDF.js worker files

### First Run

After the container is ready:

```bash
# Navigate to the web-viewer app
cd apps/web-viewer

# Start the development server
npm run dev
```

The Next.js dev server will start on port 3000, which is automatically forwarded to your host machine. You'll receive a notification with a link to open it in your browser.

## Development Workflow

### Available Commands

All commands should be run from the `apps/web-viewer` directory:

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier (if configured)

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:debug       # Debug tests
npm run test:coverage    # Run tests with coverage report

# E2E Testing
npm run test:e2e         # Run Playwright E2E tests (headless)
npm run test:e2e:single  # Run E2E tests with dev server
npm run test:e2e:ui      # Run E2E tests with Playwright UI
npm run test:e2e:debug   # Debug E2E tests (if configured)
```

### Port Forwarding

The container automatically forwards:

- **Port 3000**: Next.js development server
  - Labeled as "Next.js Dev Server"
  - Notification shown when forwarded
  - Access at http://localhost:3000

### Using Git

Git is fully configured in the container:

```bash
# GitHub CLI is available
gh auth login           # Authenticate with GitHub
gh pr list             # List pull requests
gh issue list          # List issues

# Standard git commands work
git status
git add .
git commit -m "message"
git push
```

### Running Tests

**Unit Tests (Vitest):**

```bash
npm run test            # Run once
npm run test:watch      # Watch mode
npm run test:ui         # Interactive UI
```

**E2E Tests (Playwright):**

```bash
npm run test:e2e        # Headless mode
npm run test:e2e:ui     # Interactive UI mode
```

You can also use the VS Code extensions:

- **Vitest Explorer**: Click the test icon in the sidebar
- **Playwright Test**: Right-click on test files to run/debug

## Container Architecture

### File Structure

```
.devcontainer/web-viewer/
├── devcontainer.json      # Main configuration
├── Dockerfile             # Container image definition
├── docker-compose.yml     # Volume and service configuration
└── README.md             # This file
```

### Dockerfile Details

The container is based on `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`:

- Debian 12 (Bookworm) base OS
- Node.js 22 LTS with npm
- Playwright system dependencies pre-installed
- Additional tools: git, curl, wget
- Runs as non-root `node` user

### Volume Strategy

Three volumes optimize performance:

1. **Workspace mount** (`cached`): Bi-directional sync with low latency
2. **node_modules volume**: Persists dependencies, avoids platform issues
3. **next_cache volume**: Persists build cache for faster rebuilds

## Customization

### Adding VS Code Extensions

Edit `.devcontainer/devcontainer.json`:

```jsonc
"customizations": {
  "vscode": {
    "extensions": [
      // Add your extension ID here
      "publisher.extension-name"
    ]
  }
}
```

Rebuild the container: `F1` → "Dev Containers: Rebuild Container"

### Adding System Packages

Edit `.devcontainer/Dockerfile`:

```dockerfile
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    your-package-here \
    && apt-get autoremove -y && apt-get clean -y
```

### Changing Node Version

Edit `.devcontainer/Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm
# Change 22 to your desired version (18, 20, etc.)
```

### Adding Environment Variables

Edit `.devcontainer/docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - YOUR_VAR=value
```

Or create a `.env` file in the workspace root (make sure it's in `.gitignore`).

## Troubleshooting

### Container Won't Build

**Issue**: Build fails with dependency errors

**Solutions**:

1. Ensure Docker Desktop is running
2. Check Docker has enough resources (Settings → Resources)
3. Clear Docker build cache: `docker system prune -a`
4. Try rebuilding: `F1` → "Dev Containers: Rebuild Container"

### Playwright Tests Failing

**Issue**: Browser not found or tests fail to run

**Solutions**:

```bash
# Reinstall Playwright browsers
npx playwright install

# Install system dependencies
npx playwright install-deps

# Check browser installation
npx playwright install --help
```

### Port 3000 Already in Use

**Issue**: Cannot start dev server, port already bound

**Solutions**:

1. Stop other processes using port 3000
2. Change the port in `devcontainer.json`:
   ```json
   "forwardPorts": [3001]
   ```
3. Or use a different port in dev command:
   ```bash
   PORT=3001 npm run dev
   ```

### Slow Performance on Windows

**Issue**: File operations are slow, high CPU usage

**Solutions**:

1. Ensure you're using WSL 2 (not WSL 1)
2. Clone repository in WSL filesystem: `\\wsl$\Ubuntu\home\user\projects`
3. Don't clone in `/mnt/c/` (Windows filesystem)
4. Check Docker Desktop WSL 2 backend is enabled (Settings → General)

### npm install Fails

**Issue**: Package installation errors or permission issues

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If permission errors, ensure running as node user
whoami  # Should show 'node'
```

### Container Exits Immediately

**Issue**: Container starts then immediately stops

**Solutions**:

1. Check Docker Desktop logs
2. Ensure `docker-compose.yml` has `command: sleep infinity`
3. Review container logs: `docker logs <container-id>`
4. Verify no syntax errors in config files

### Git Line Ending Issues

**Issue**: CRLF will be replaced by LF warnings

**Solution**: This is normal and handled by `.gitattributes`. The warnings are informational. The project uses LF line endings, and Git will automatically convert them.

### Extension Not Working

**Issue**: VS Code extension not loading or functioning

**Solutions**:

1. Reload window: `F1` → "Developer: Reload Window"
2. Check extension compatibility with container
3. Verify extension in `devcontainer.json` extensions list
4. Rebuild container: `F1` → "Dev Containers: Rebuild Container"

## Performance Tips

1. **Use WSL 2** (Windows): Keep project files in Linux filesystem
2. **Allocate Resources**: Give Docker Desktop adequate RAM (8GB+) and CPU (4+ cores)
3. **Use Volumes**: The container uses volumes for `node_modules` and `.next` - don't delete them
4. **Prune Regularly**: Clean up unused containers/images: `docker system prune`
5. **Cache Layers**: Minimize Dockerfile changes to reuse cached layers

## Security

The container includes Snyk security scanning:

```bash
# Scan for vulnerabilities
snyk test

# Monitor project
snyk monitor

# Configure Snyk
# Copy .snyk.example to .snyk and add your org ID
```

## Additional Resources

- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/)
- [Project Main README](../../apps/web-viewer/README.md)

## Support

For issues specific to this project:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review [project documentation](../../apps/web-viewer/docs/)
3. Open an issue on [GitHub](https://github.com/ytkaczyk/ai-ocr/issues)

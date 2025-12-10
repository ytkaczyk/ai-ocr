# Security Configuration Guide

This document provides setup instructions for security features in the OCR Translation Comparison Viewer.

**Related Tasks**: T116a, T116b  
**Requirements**: FR-033 (Security)  
**Created**: 2025-11-24

---

## Overview

The project implements multiple layers of security scanning and validation:

1. **npm audit** - Checks for known vulnerabilities in dependencies
2. **Snyk** - Advanced dependency vulnerability scanning
3. **Content Security Policy (CSP)** - Browser-level security headers
4. **Path Traversal Prevention** - File system security
5. **Input Sanitization** - Validation of all user inputs

---

## npm Audit (T116a)

### Configuration

npm audit is configured in GitHub Actions (`.github/workflows/ci.yml`) to run on every push and pull request.

```yaml
security-audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - name: Install dependencies
      run: npm ci
      working-directory: apps/web-viewer
    - name: Run npm audit
      run: npm audit --audit-level=high
      working-directory: apps/web-viewer
      continue-on-error: false
```

### Severity Levels

- **High**: Build fails automatically
- **Critical**: Build fails automatically
- **Moderate**: Warning only (does not fail build)
- **Low**: Warning only (does not fail build)

### Manual Execution

Run locally to check for vulnerabilities:

```powershell
cd apps/web-viewer
npm audit
```

To see detailed report:

```powershell
npm audit --json
```

To automatically fix vulnerabilities:

```powershell
npm audit fix
```

### Exception Process

If a vulnerability cannot be fixed immediately:

1. Document the vulnerability in `docs/security-exceptions.md`
2. Include:
   - CVE ID or npm advisory ID
   - Severity level
   - Reason for exception
   - Mitigation steps taken
   - Expected resolution date
3. Temporarily allow the build to pass:
   ```yaml
   continue-on-error: true  # Add comment with ticket number
   ```
4. Create an issue to track the fix

---

## Snyk Security Scanning (T116b)

### Setup Requirements

1. **Create Snyk Account**
   - Visit [https://snyk.io](https://snyk.io)
   - Sign up with GitHub account
   - Free tier supports unlimited public repositories

2. **Get Snyk API Token**
   - Navigate to Account Settings → API Token
   - Copy the token (starts with `snyk-`)

3. **Configure GitHub Secret**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `SNYK_TOKEN`
   - Value: Paste your Snyk API token
   - Click "Add secret"

### Configuration

Snyk is configured in `.github/workflows/ci.yml`:

```yaml
snyk-security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - name: Install dependencies
      run: npm ci
      working-directory: apps/web-viewer
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      continue-on-error: false
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --file=apps/web-viewer/package.json
        command: test
```

### Severity Threshold

- **High or Critical**: Build fails
- **Medium or Low**: Warning only

To adjust severity threshold, modify `--severity-threshold` in workflow file:
- `low`: Fail on any vulnerability
- `medium`: Fail on medium, high, or critical
- `high`: Fail on high or critical (current setting)
- `critical`: Fail only on critical

### Manual Execution

Install Snyk CLI:

```powershell
npm install -g snyk
snyk auth
```

Run Snyk scan:

```powershell
cd apps/web-viewer
snyk test
```

Monitor project (continuous monitoring):

```powershell
snyk monitor
```

### Snyk Dashboard

View detailed vulnerability reports at: https://app.snyk.io

Features:
- Dependency tree visualization
- Fix recommendations
- Automated pull requests for fixes
- Email alerts for new vulnerabilities

---

## Content Security Policy (T115)

### Configuration

CSP headers are configured in `next.config.mjs`:

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}
```

### CSP Directives Explained

- `default-src 'self'`: Only load resources from same origin
- `script-src 'unsafe-eval'`: Required for PDF.js worker
- `script-src 'unsafe-inline'`: Required for Next.js
- `style-src 'unsafe-inline'`: Required for Tailwind CSS
- `img-src data: blob:`: Required for PDF.js canvas rendering
- `frame-ancestors 'none'`: Prevent clickjacking
- `base-uri 'self'`: Prevent base tag injection
- `form-action 'self'`: Prevent form submission attacks

### Testing CSP

Verify CSP headers are working:

```powershell
curl -I http://localhost:3000 | Select-String -Pattern "Content-Security-Policy"
```

Or use browser DevTools:
1. Open Network tab
2. Refresh page
3. Click on main document
4. View Response Headers → Content-Security-Policy

---

## Path Traversal Prevention (T114, FR-033a)

### Implementation

All file system operations use `preventPathTraversal()` function:

```typescript
import { preventPathTraversal, validateFilename } from '@/lib/utils/security';

// Validate user input
validateFilename(documentId);

// Resolve and validate path
const safePath = preventPathTraversal(userPath, dataFolder);
```

### Security Functions

Located in `lib/utils/security.ts`:

1. **preventPathTraversal()**
   - Resolves paths to absolute paths
   - Validates path is within base directory
   - Prevents `../` attacks

2. **validateFilename()**
   - Regex: `^[a-zA-Z0-9_-]+$`
   - Max length: 255 characters
   - Prevents special characters

3. **sanitizeLanguageCode()**
   - Format: `language-COUNTRY` (e.g., `en-US`)
   - Prevents injection attacks

4. **sanitizePageNumber()**
   - Range: 1 to maxPages
   - Prevents overflow/underflow

5. **sanitizePaneWidth()**
   - Range: 10% to 80%
   - Prevents invalid UI states

6. **sanitizeErrorMessage()**
   - Replaces file paths with `<PATH>`
   - Prevents path disclosure

### Testing

Security tests are in `tests/integration/security.test.ts`:

```powershell
npm run test tests/integration/security.test.ts
```

**Test Coverage**: 47 tests covering all FR-033 requirements

---

## Symlink Rejection (T113b, FR-033c)

### Implementation

All file operations check for symlinks:

```typescript
import { isSymlink, rejectSymlink } from '@/lib/utils/file-system';

// Check if path is a symlink
if (await isSymlink(filePath)) {
  throw new Error('Symbolic links are not permitted');
}

// Or use combined validation
await rejectSymlink(filePath, 'PDF file');
```

### Security Logging

Symlink access attempts are logged:

```
[SECURITY] Symlink access attempt blocked: PDF file at /path/to/file
```

---

## CI/CD Integration

### GitHub Actions Workflow

Security checks run automatically on:
- Every push to `main` or feature branches
- Every pull request to `main`

### Job Dependencies

```
security-audit (npm audit)
  ↓
snyk-security (Snyk scan)
  ↓
lint (ESLint)
  ↓
test (Unit/Integration tests)
  ↓
build (Production build)
  ↓
e2e (End-to-end tests)
```

### Failure Handling

If any security job fails:
1. Build stops immediately
2. Subsequent jobs are skipped
3. Developers are notified via GitHub
4. Pull request cannot be merged

---

## Security Testing

### Test Files

1. **Unit Tests**: `tests/integration/security.test.ts` (47 tests)
   - Path traversal prevention
   - Filename validation
   - Input sanitization
   - Error message safety

2. **Integration Tests**: `tests/integration/api/page-content.test.ts`
   - API endpoint security
   - Path traversal in routes
   - File type validation

3. **E2E Tests**: Various e2e specs
   - XSS prevention
   - CSRF protection
   - Clickjacking prevention

### Running All Security Tests

```powershell
# Unit tests
npm run test tests/integration/security.test.ts

# Integration tests
npm run test tests/integration/

# Full test suite
npm test

# With coverage
npm run test:coverage
```

---

## Security Checklist (FR-033)

- [x] **FR-033a**: Path traversal prevention implemented
- [x] **FR-033b**: Filename validation with regex
- [x] **FR-033c**: Symlink rejection with logging
- [x] **FR-033d**: Input sanitization for all user inputs
- [x] **FR-033e**: Error message safety (no path disclosure)
- [x] **T114**: Path traversal verified in all routes
- [x] **T115**: CSP headers configured
- [x] **T116**: Security test coverage (47 tests)
- [x] **T116a**: npm audit in CI pipeline
- [x] **T116b**: Snyk scanning in CI pipeline

---

## Monitoring and Alerts

### Snyk Monitoring

After initial setup, Snyk continuously monitors:
- New vulnerabilities in dependencies
- License compliance issues
- Docker image vulnerabilities (if applicable)

Configure alerts:
1. Visit [Snyk Dashboard](https://app.snyk.io)
2. Project Settings → Notifications
3. Enable email alerts for high/critical issues

### Dependabot (Optional)

Enable Dependabot for automated dependency updates:

1. GitHub repository → Settings → Security → Code security and analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"

---

## Troubleshooting

### npm audit fails with EAUDITNOPJSON

**Issue**: npm audit requires package-lock.json

**Solution**:
```powershell
npm install  # Regenerate package-lock.json
npm audit
```

### Snyk job fails with "Missing SNYK_TOKEN"

**Issue**: SNYK_TOKEN secret not configured

**Solution**:
1. Get token from [Snyk Account Settings](https://app.snyk.io/account)
2. Add to GitHub Secrets (see Setup Requirements above)

### CSP blocks PDF.js

**Issue**: PDF.js requires `unsafe-eval` for web worker

**Solution**: Already configured in `next.config.mjs`

If CSP issues persist:
1. Check browser console for CSP violations
2. Update CSP directives in `next.config.mjs`
3. Test with `npm run dev`

### Path traversal test failures

**Issue**: Path separator differences (Windows vs Unix)

**Solution**: Use `path.normalize()` in tests (already implemented)

---

## References

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Snyk documentation](https://docs.snyk.io/)
- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FR-033 Security Requirements](../../../specs/001-ocr-translation-viewer/spec.md#fr-033)

---

## Next Steps

1. Configure SNYK_TOKEN in GitHub repository secrets
2. Enable Snyk monitoring for continuous vulnerability scanning
3. Set up Dependabot for automated dependency updates
4. Schedule regular security audits (monthly)
5. Review and update security exceptions quarterly

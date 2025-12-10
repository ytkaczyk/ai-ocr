# Branch Protection Rules

## Overview

This document describes the required branch protection rules for the OCR Translation Comparison Viewer project. These rules ensure code quality, security, and stability by requiring all changes to pass automated checks before merging.

## Required Branch Protection Rules

### Main Branch (`main`)

**Purpose**: Protect production-ready code from breaking changes.

**Required Status Checks** (must pass before merging):
1. ✅ `security-audit` - npm audit for high/critical vulnerabilities
2. ✅ `snyk-security` - Snyk vulnerability scanning
3. ✅ `lint` - ESLint code quality checks
4. ✅ `test` - Unit and integration tests with coverage threshold (70% minimum)
5. ✅ `build` - Production build verification
6. ✅ `e2e` - End-to-end tests (Playwright)
7. ✅ `lighthouse-ci` - Performance testing (LCP < 5s on 3 runs) *[T126a]*

**Additional Rules**:
- ✅ Require pull request reviews before merging (1 approval minimum)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators (no one can bypass these rules)
- ✅ Restrict who can push to matching branches (admins only for direct push)
- ✅ Allow force pushes: **DISABLED**
- ✅ Allow deletions: **DISABLED**

### Feature Branches (e.g., `001-ocr-translation-viewer`)

**Purpose**: Maintain quality during active development.

**Required Status Checks**:
1. ✅ `security-audit` - npm audit for high/critical vulnerabilities
2. ✅ `snyk-security` - Snyk vulnerability scanning
3. ✅ `lint` - ESLint code quality checks
4. ✅ `test` - Unit and integration tests with coverage threshold
5. ✅ `build` - Production build verification
6. ✅ `e2e` - End-to-end tests (Playwright)

**Additional Rules**:
- ✅ Require pull request reviews: **OPTIONAL** (recommended but not enforced for feature branches)
- ✅ Require status checks to pass before merging
- ✅ Allow force pushes: **ENABLED** (for rebasing during development)
- ✅ Allow deletions: **ENABLED** (after merging to main)

## GitHub Configuration Steps

### 1. Navigate to Repository Settings
1. Go to repository: `https://github.com/ytkaczyk/ai-ocr`
2. Click **Settings** → **Branches**
3. Click **Add rule** under "Branch protection rules"

### 2. Configure Main Branch Protection
1. **Branch name pattern**: `main`
2. Enable **Require a pull request before merging**
   - Require approvals: `1`
   - Dismiss stale pull request approvals when new commits are pushed: ✅
3. Enable **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Add status checks:
     - `security-audit`
     - `snyk-security`
     - `lint`
     - `test`
     - `build`
     - `e2e`
     - `lighthouse-ci` (after T126a is implemented)
4. Enable **Include administrators**: ✅
5. Enable **Restrict who can push to matching branches**: ✅ (admins only)
6. Disable **Allow force pushes**: ❌
7. Disable **Allow deletions**: ❌
8. Click **Create** or **Save changes**

### 3. Configure Feature Branch Protection
1. **Branch name pattern**: `0[0-9][0-9]-*` (matches feature branches like `001-ocr-translation-viewer`)
2. Enable **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Add status checks:
     - `security-audit`
     - `snyk-security`
     - `lint`
     - `test`
     - `build`
     - `e2e`
3. Enable **Allow force pushes**: ✅ (for rebasing)
4. Enable **Allow deletions**: ✅ (cleanup after merge)
5. Click **Create** or **Save changes**

## Required Secrets Configuration

The following secrets must be configured in **Settings** → **Secrets and variables** → **Actions**:

1. **`CODECOV_TOKEN`** - Codecov upload token (obtain from https://codecov.io)
   - Required for: Coverage reporting (T124)
   - Scope: Repository secret

2. **`SNYK_TOKEN`** - Snyk API token (obtain from https://snyk.io)
   - Required for: Vulnerability scanning (T116b)
   - Scope: Repository secret

3. **`LHCI_GITHUB_APP_TOKEN`** - Lighthouse CI GitHub App token (optional, obtain from https://github.com/apps/lighthouse-ci)
   - Required for: Performance testing comments on PRs (T126a)
   - Scope: Repository secret (optional)

## Status Check Details

### `security-audit` (npm audit)
- **What it checks**: npm dependencies for known vulnerabilities
- **Threshold**: Fails on high or critical severity
- **Rationale**: Prevents merging code with known security issues (FR-033)

### `snyk-security` (Snyk)
- **What it checks**: Dependencies, container images, and code for vulnerabilities
- **Threshold**: Fails on high severity
- **Rationale**: Additional security layer beyond npm audit (T116b)

### `lint` (ESLint)
- **What it checks**: Code quality, consistency, and best practices
- **Threshold**: Zero ESLint errors allowed
- **Rationale**: Enforces code standards per constitution principle "Code Quality"

### `test` (Vitest)
- **What it checks**: Unit and integration tests, coverage threshold
- **Threshold**: All tests pass, coverage ≥ 70%
- **Rationale**: Ensures functionality works as expected per plan.md

### `build` (Next.js build)
- **What it checks**: Production build succeeds without errors
- **Threshold**: Zero build errors
- **Rationale**: Prevents merging code that breaks production builds

### `e2e` (Playwright)
- **What it checks**: End-to-end user workflows in real browsers
- **Threshold**: All E2E tests pass
- **Rationale**: Validates user-facing functionality per acceptance criteria

### `lighthouse-ci` (Lighthouse CI) *[T126a]*
- **What it checks**: Performance metrics (LCP, FID, CLS, etc.)
- **Threshold**: LCP < 5s on 3 consecutive runs (SC-001)
- **Rationale**: Enforces performance requirements per specification

## Enforcement Strategy

### Pre-Merge Requirements
- ✅ All status checks must pass (green checkmarks)
- ✅ Code review approved (main branch only)
- ✅ Branch is up to date with target branch
- ❌ No open review comments requesting changes

### Continuous Monitoring
- **Dependabot**: Automatically creates PRs for dependency updates (T126b)
- **Security alerts**: GitHub Dependabot alerts for vulnerabilities
- **Coverage tracking**: Codecov dashboard shows coverage trends

### Escalation Process
1. **Red status check**: Developer fixes issue, pushes new commit
2. **Persistent failures**: Team reviews failing check, may adjust threshold if justified
3. **Emergency hotfix**: Requires admin approval to bypass (logged and reviewed)

## Verification

After configuring branch protection rules, verify by:

1. **Create test PR**: Push a branch with intentional lint error
2. **Verify blocking**: PR should show failing `lint` check, merge button disabled
3. **Fix and verify**: Fix error, push commit, verify merge button enables after checks pass
4. **Test force push**: Attempt force push to `main` (should be blocked)
5. **Test deletion**: Attempt to delete `main` branch (should be blocked)

## Maintenance

### Regular Reviews
- **Quarterly**: Review status check thresholds (coverage, performance)
- **After incidents**: Review if branch protection prevented issue or needs improvement
- **New checks**: Add new required status checks as CI pipeline evolves

### Updates
- **Adding checks**: Update this document and GitHub settings
- **Removing checks**: Document rationale, get team approval, update settings
- **Threshold changes**: Document justification, update plan.md and this file

## Related Documentation

- [CI/CD Pipeline](.github/workflows/ci.yml) - GitHub Actions workflow
- [Security Requirements](docs/security-requirements-verification.md) - FR-033 implementation
- [Testing Strategy](../specs/001-ocr-translation-viewer/plan.md#testing-strategy) - Test coverage requirements
- [Constitution](../specs/001-ocr-translation-viewer/spec.md#constitution-mapping) - Code quality principles

## Status

- ✅ **T126**: Branch protection documentation complete
- ⏭️ **T126a**: Lighthouse CI implementation pending
- ⏭️ **T126b**: Dependabot configuration pending
- 🔧 **Configuration**: Manual GitHub settings required (see steps above)

---

**Last Updated**: 2025-11-24  
**Maintained By**: Development Team  
**Review Frequency**: Quarterly

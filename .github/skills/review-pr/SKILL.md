---
name: review-pr
description: Analyzes and implements code review recommendations from GitHub pull requests. Fetches review comments, discusses implementation priorities with the user, applies changes, and validates through comprehensive testing (build, lint, unit tests, e2e tests).
license: MIT
metadata:
  author: Yves Tkaczyk
  version: "0.1"
---

# Pull Request Review Implementation Skill

This skill helps you systematically implement code review feedback from GitHub pull requests, ensuring quality through automated validation.

## What this skill does

- Fetches review comments from a specific GitHub pull request
- Categorizes feedback by severity and type
- Discusses implementation priorities with the user
- Implements approved changes
- Validates changes through comprehensive testing
- Creates atomic commits for implemented feedback

## When to use this skill

Use this skill when you:
- Receive code review feedback on a pull request
- Need to address reviewer comments systematically
- Want to ensure changes don't introduce regressions
- Need guidance on prioritizing review feedback

## How to use this skill

### Step 1: Identify the Pull Request

**Determine which PR to review:**
- Check for active pull request in repository context
- Ask user for PR number if not evident
- Verify PR exists and has review comments

**Required information:**
- Repository owner (e.g., "ytkaczyk")
- Repository name (e.g., "ai-ocr")
- Pull request number (e.g., 35)

### Step 2: Fetch Review Comments

**Use GitHub MCP tools to get feedback:**

```typescript
// Get review comments (line-specific feedback)
mcp_github_pull_request_read({
  method: "get_review_comments",
  owner: "owner",
  repo: "repo", 
  pullNumber: prNumber
})

// Get general reviews (approval, changes requested, comments)
mcp_github_pull_request_read({
  method: "get_reviews",
  owner: "owner",
  repo: "repo",
  pullNumber: prNumber
})
```

### Step 3: Analyze and Categorize Feedback

**Organize feedback by priority:**

1. **Critical Issues** (🔴 Must Fix)
   - Security vulnerabilities
   - Logic errors that cause bugs
   - Race conditions or memory leaks
   - Breaking changes

2. **Important Issues** (🟡 Should Fix)
   - Performance problems
   - Dead code or unused imports
   - Missing error handling
   - Type safety issues

3. **Suggestions** (🟢 Nice to Have)
   - Code style improvements
   - Refactoring opportunities
   - Additional test coverage
   - Documentation enhancements

4. **Won't Fix** (⚪ Defer or Ignore)
   - Out of scope for current PR
   - Disagree with recommendation (document why)
   - Planned for separate PR

**Present analysis to user:**
```
Found 6 review comments:

Critical (2):
- [Gemini] TTL race condition on in-flight requests
- [Copilot] Response cloning bug in cache

Important (3):
- [Copilot] Dead code (request-cache.ts unused)
- [Copilot] Cleanup race condition
- [Copilot] JSON.stringify cache key unreliability

Suggestions (1):
- [Copilot] Add test coverage for new utilities

Which items should I implement?
```

### Step 4: Confirm Implementation Plan

**Discuss with user:**
- Which feedback items to address
- Whether to group related changes
- If any feedback should be deferred

**Example dialogue:**
```
User: "Address the critical and important issues, defer test coverage"
Assistant: "I'll implement 5 issues and create commits. The test coverage 
            suggestion will be tracked separately."
```

### Step 5: Implement Changes

**Apply changes based on feedback:**

1. **Analyze root cause** - Understand why the issue exists
2. **Consider alternatives** - Multiple ways to fix?
3. **Choose simplest solution** - Prefer deletion over addition
4. **Make focused changes** - One logical fix at a time

**Implementation strategies:**

- **For dead code**: Delete it entirely (simplest fix)
- **For bugs**: Fix root cause, not symptoms
- **For performance**: Optimize without over-engineering
- **For style**: Follow existing patterns in codebase

**Example from PR #35:**
```
Feedback: "request-cache.ts is unused dead code with multiple bugs"
Analysis: File never imported, adds complexity for no benefit
Solution: Delete entire file (addresses ALL related issues at once)
Result: -70 lines, 6 review comments resolved
```

### Step 6: Validate Changes

**⚠️ CRITICAL: ALL validation steps must pass before committing code.**

Run the complete validation suite in order. **Do NOT skip any step. Do NOT commit until all 4 steps pass.**

**1. Build verification (REQUIRED):**
```bash
npm run build
```
- Ensures TypeScript compiles
- Catches type errors
- Verifies production bundle builds
- **Must complete with 0 errors**

**2. Lint verification (REQUIRED):**
```bash
npm run lint
```
- Enforces code style
- Catches common mistakes
- Ensures best practices
- **Must complete with 0 warnings**

**3. Unit tests (REQUIRED):**
```bash
npm run test
```
- Validates individual functions
- Tests edge cases
- Ensures logic correctness
- **All tests must pass**

**4. End-to-end tests (REQUIRED):**
```bash
npm run test:e2e
```
- Tests full user workflows
- Validates integration
- Catches UI/UX regressions
- **All tests must pass**

**Validation checklist (ALL must be checked before committing):**
- [ ] Build passes without errors ✓
- [ ] Lint passes with 0 warnings ✓
- [ ] All unit tests pass ✓
- [ ] All e2e tests pass ✓
- [ ] No new errors in console (if applicable)

**⚠️ If ANY step fails:**
1. Fix the issue
2. Re-run ALL validation steps from the beginning
3. Only proceed to commit when all 4 steps pass

### Step 7: Create Atomic Commits

**Only proceed to this step after ALL validation steps pass (build, lint, test, test:e2e).**

**Follow conventional commit format:**

```bash
git add <changed-files>
git commit -m "<type>: <description>

<body explaining why and what>

Addresses review feedback:
- <specific comment 1>
- <specific comment 2>"
```

**Commit types:**
- `fix`: Bug fixes from review feedback
- `refactor`: Code improvements without changing behavior
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `docs`: Documentation updates

**Example commit:**
```
refactor: remove unused request caching code

- Delete request-cache.ts as it's not used anywhere
- Remove fetchFn parameter from RetryOptions (never utilized)
- Simplify DEFAULT_OPTIONS type back to Required<RetryOptions>

Addresses PR review feedback:
- Dead code (request-cache.ts unused)
- Response cloning bugs in cache implementation
- Race conditions in TTL and cleanup logic
- JSON.stringify cache key reliability issues
- Missing test coverage for unused features
```

### Step 8: Update Pull Request

**Push changes and notify reviewers:**

```bash
git push origin <branch-name>
```

**Mark resolved review threads:**

After implementing feedback, mark the corresponding review conversations as resolved. This helps reviewers track what's been addressed.

**For each implemented review comment:**
1. Identify the review thread ID from the fetched comments
2. Mark as resolved if the feedback was fully implemented

**Add summary comment to PR:**
```markdown
Addressed review feedback:

✅ Critical: TTL race condition (resolved by removing unused code)
✅ Important: Dead code and related bugs (removed request-cache.ts)
⏳ Deferred: Test coverage (will address in separate PR)

All quality gates passing:
- Build: ✓
- Lint: ✓  
- Unit tests: ✓
- E2E tests: ✓

Marked 5 review threads as resolved.
```

**Important**: Only mark threads as resolved when you've actually addressed the feedback. If you're deferring or disagreeing, leave them open and add an explanatory comment instead.

## Best Practices

### Always Analyze Before Implementing

**Don't blindly apply feedback.** Understand:
- Why the reviewer flagged it
- What problem it causes
- Whether the suggested solution is best

Sometimes the best fix is different from what's suggested.

### Group Related Changes

**Create atomic commits** that represent single logical changes:
- Fix for specific bug → one commit
- Removal of dead code → one commit
- Performance optimization → one commit

Don't mix unrelated changes in one commit.

### Consider Scope

**Not all feedback must be addressed immediately:**
- **In scope**: Directly related to PR changes
- **Out of scope**: New features or unrelated improvements
- **Separate PR**: Large refactors that deserve own review

Be transparent about what you're deferring and why.

### Validate Thoroughly

**Run ALL quality gates before pushing - no exceptions:**

**The 4 Required Steps (in order):**
1. `npm run build` - Must succeed with 0 errors
2. `npm run lint` - Must pass with 0 warnings
3. `npm run test` - All unit tests must pass
4. `npm run test:e2e` - All e2e tests must pass

**⚠️ NEVER:**
- Skip any validation step
- Commit before running all 4 steps
- Assume "it will probably work"
- Say "I'll run tests after committing"

**If a step fails:**
- Fix the issue immediately
- Re-run ALL steps from the beginning
- Only commit when all 4 steps pass

Validation is not optional - it's the safety net that prevents breaking production.

### Communicate Clearly

**When marking conversations resolved:**
- Only resolve when feedback is fully addressed
- Add comment explaining the fix before resolving
- Leave open if deferring (explain why in comment)

**When deferring feedback:**
- Explain why (out of scope, needs more research, etc.)
- Create tracking issue if significant
- Thank reviewer for catching it

**When disagreeing with feedback:**
- Explain your reasoning respectfully
- Provide context reviewer might not have
- Be open to discussion

### Learn from Patterns

**Notice recurring feedback types:**
- Same mistake across files → update your mental checklist
- Tool-specific issues → consider automation
- Style violations → update linter config

Use feedback to improve future code quality.

## Common Review Feedback Patterns

### Pattern: Dead Code

**Feedback**: "This code is unused"

**How to verify:**
```bash
# Search for imports
grep -r "import.*fileName" .

# Search for function usage  
grep -r "functionName" .
```

**Action**: Delete if truly unused. Dead code adds maintenance burden.

### Pattern: Race Conditions

**Feedback**: "This has a race condition when..."

**Investigation:**
- Trace async operations
- Check timing dependencies
- Look for shared mutable state

**Solutions:**
- Proper Promise chaining
- Lock mechanisms
- Immutable data structures

### Pattern: Type Safety Issues

**Feedback**: "This should have stricter types"

**Examples:**
```typescript
// Weak typing
const data: any = fetchData();

// Better typing
const data: UserProfile = fetchData();
```

**Action**: Add proper types, avoid `any` unless necessary.

### Pattern: Performance Issues

**Feedback**: "This causes unnecessary re-renders"

**React-specific checks:**
- Are objects/arrays recreated each render?
- Should values be memoized?
- Are dependencies specified correctly?

**Solutions:**
```typescript
// Memoize expensive computations
const value = useMemo(() => compute(data), [data]);

// Memoize callbacks
const handler = useCallback(() => doSomething(), []);
```

### Pattern: Missing Error Handling

**Feedback**: "What happens if this fails?"

**Add appropriate handling:**
```typescript
// Before
const data = await fetch(url).then(r => r.json());

// After
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data;
} catch (error) {
  logger.error('Fetch failed', error);
  throw error; // or return default value
}
```

## Troubleshooting

### Build Fails After Changes

**Check:**
- Did you introduce syntax errors?
- Are all imports still valid?
- Did you break type contracts?

**Fix:**
```bash
# See detailed error
npm run build 2>&1 | less

# Check specific file
npx tsc --noEmit <file.ts>
```

### Tests Fail After Changes

**Investigate:**
- Which tests are failing?
- What changed in those code paths?
- Are test assumptions still valid?

**Don't just update tests to pass** - understand WHY they're failing.

### Lint Errors

**Common causes:**
- Unused imports (remove them)
- Console statements (use proper logging)
- Hook rule violations (move hooks before conditions)

**Fix systematically:**
```bash
# Auto-fix what's possible
npm run lint -- --fix

# Manually fix remaining issues
```

### E2E Tests Flaky

**Possible causes:**
- Timing issues (add proper waits)
- State pollution between tests
- Network conditions

**Improve stability:**
```typescript
// Wait for specific conditions
await page.waitForSelector('[data-testid="loaded"]');

// Don't use arbitrary timeouts
// await page.waitForTimeout(1000); // ❌

// Use deterministic waits
await page.waitForLoadState('networkidle'); // ✓
```

## Example: Full Workflow

### Scenario: PR #35 Review Implementation

**Step 1**: Identify PR
```
PR: #35 "Remove extra api calls"
Repo: ytkaczyk/ai-ocr
Branch: remove-extra-api-calls
```

**Step 2**: Fetch comments
```
Found 6 review comments from Gemini and Copilot
```

**Step 3**: Analyze
```
Critical (1): TTL race condition
Important (5): Dead code, response bugs, cleanup races, cache key issues, missing tests
```

**Step 4**: Confirm with user
```
User: "Implement all, prioritize fixing the bugs"
```

**Step 5**: Implement
```
Analysis: request-cache.ts is unused AND has all the bugs
Solution: Delete entire file (fixes all issues at once)
Also: Remove unused fetchFn parameter from retry.ts
```

**Step 6**: Validate (ALL REQUIRED)
```bash
npm run build     # ✓ Pass (0 errors)
npm run lint      # ✓ Pass (0 warnings)
npm run test      # ✓ Pass (464 tests)
npm run test:e2e  # ✓ Pass (all workflows)
```

⚠️ **CRITICAL**: All 4 validation steps completed successfully before proceeding to commit.

**Step 7**: Commit
```bash
git rm lib/utils/request-cache.ts
git add lib/utils/retry.ts
git commit -m "refactor: remove unused request caching code

- Delete request-cache.ts as it's not used anywhere
- Remove fetchFn parameter (never utilized)
- Addresses all 6 review comments by removing problematic code"
```

**Step 8**: Push
```bash
git push origin remove-extra-api-calls
```

**Step 9**: Mark conversations as resolved
```
Marked 5 review threads as resolved (all addressed by removing dead code)
Added summary comment to PR explaining what was fixed
```

**Result**: All review feedback addressed with a single, clean commit that removes complexity rather than adding patches.

## Related Skills

- **commit**: Create properly formatted atomic commits
- **troubleshoot**: Debug issues found during validation
- Use after implementing changes to ensure proper version control

## Quick Reference

```bash
# Fetch PR review comments
mcp_github_pull_request_read(method: "get_review_comments", ...)
mcp_github_pull_request_read(method: "get_reviews", ...)

# Validate changes (ALL REQUIRED - NO EXCEPTIONS)
npm run build      # ✓ Must pass
npm run lint       # ✓ Must pass  
npm run test       # ✓ Must pass
npm run test:e2e   # ✓ Must pass

# Only after ALL validation passes:
git add <files>
git commit -m "<type>: <description>"
git push origin <branch>
```

**⚠️ CRITICAL RULE: Never commit without running all 4 validation steps first.**

**Remember**: The goal is not just to satisfy reviewers, but to improve code quality. Sometimes the best response to feedback is "good catch, but here's a better solution."

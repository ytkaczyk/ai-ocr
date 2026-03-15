---
name: troubleshoot
description: Diagnoses and fixes runtime issues using browser automation and observation rather than guesswork. Treats the running application as the source of truth to reproduce issues, gather diagnostic evidence, and validate fixes empirically.
license: MIT
metadata:
  author: Yves Tkaczyk
  version: "0.1"
---

# Troubleshooting with MCP Servers

Use browser automation MCP servers to diagnose and fix runtime issues through observation and experimentation rather than guesswork.

## Core Principle

**Treat the running application as the source of truth.** Instead of hypothesizing about what might be wrong, use MCP tools to observe actual behavior, gather objective evidence, and validate fixes empirically.

## When to Use This Skill

- User reports unexpected behavior or errors
- Need to understand how the application actually works at runtime
- Investigating performance issues or inefficiencies
- Verifying that fixes solve the reported problem
- Understanding the gap between expected and actual behavior
- Debugging issues that don't reproduce in tests

## Troubleshooting Methodology

### 1. Reproduce the Issue

**Goal**: Confirm the problem exists and understand the exact conditions that trigger it.

**Principles**:
- Follow the user's exact steps - don't improvise or skip steps
- Use browser automation to ensure repeatability
- Document what you observe vs. what was expected
- Capture the state at each critical step

**MCP Tools**:
- Navigate to starting point
- Interact with UI elements (clicks, typing, selections)
- Wait for content to load or appear
- Take snapshots to capture state

**Why This Matters**: You can't fix what you can't reproduce. A clear reproduction proves the problem exists and will later prove your fix works.

### 2. Gather Diagnostic Evidence

**Goal**: Collect objective data about what's happening at runtime.

**Principles**:
- Focus on facts, not assumptions
- Gather multiple types of evidence (network, console, DOM)
- Look for patterns across multiple observations
- Note timing and sequence of events

**Data Sources**:
- **Network activity**: What requests are made? Which succeed/fail? In what order?
- **Console output**: What errors, warnings, or logs appear? When?
- **Page state**: What's rendered? What's missing? What changed?
- **Timing**: How long do operations take? Are there race conditions?

**Why This Matters**: Evidence reveals the actual behavior. Console errors point to where things break. Network logs show communication problems. The DOM shows what users actually see.

### 3. Analyze Root Cause

**Goal**: Understand why the problem occurs by connecting observations to code.

**Principles**:
- Work backwards from symptoms to causes
- Search for code that produces observed behavior
- Understand the flow: user action → code execution → observable result
- Distinguish between symptoms and root causes

**Investigation Techniques**:
- Search for error messages in code
- Find files that handle failing requests
- Trace data flow through components
- Check configuration and environment
- Review recent changes that might have introduced the issue

**Common Mistake**: Fixing symptoms instead of root causes leads to whack-a-mole debugging. Always ask "why does this happen?" until you reach the fundamental issue.

### 4. Implement Fix

**Goal**: Address the root cause with minimal, targeted changes.

**Principles**:
- Make the smallest change that fixes the problem
- Prefer deletion over addition when possible
- Consider side effects and edge cases
- Maintain consistency with existing patterns

**Fix Categories**:
- **Remove**: Delete obsolete code, unused functions, dead endpoints
- **Optimize**: Add memoization, reduce re-renders, improve algorithms
- **Correct**: Fix logic errors, wrong assumptions, type mismatches
- **Add**: Handle edge cases, improve error handling, add missing validation

**Why This Matters**: Small, focused fixes are easier to review, test, and rollback if needed. They minimize risk and make the intent clear.

### 5. Verify the Fix

**Goal**: Prove the fix solves the problem without creating new issues.

**Principles**:
- Start fresh to avoid cached state
- Repeat exact reproduction steps
- Verify absence of symptoms (errors gone, requests succeed)
- Confirm expected behavior now occurs
- Check for unintended side effects

**Verification Checklist**:
- Browser console is clean (no errors)
- Network requests succeed (no 404s, 500s)
- UI displays correctly
- User workflow completes successfully
- No new warnings or issues appear

**Why This Matters**: An unverified fix is just a hope. Empirical verification proves the problem is solved.

### 6. Validate Quality

**Goal**: Ensure the fix meets production standards.

**Principles**:
- Code must build successfully
- No lint errors or warnings
- Tests pass
- No regressions introduced

**Quality Gates**:
- Build succeeds (TypeScript compiles, no syntax errors)
- Linter passes (code style, best practices)
- Tests pass (existing functionality intact)
- Manual review (code is clear and maintainable)

**Why This Matters**: A working fix that breaks the build or violates standards creates more problems than it solves.

## Diagnostic Patterns

### Pattern: Understanding Component Re-renders

**When to Use**: Investigating performance issues, duplicate API calls, or unexpected updates

**Observable Symptoms**:
- Same component renders multiple times
- useEffect runs more often than expected
- Props/state seem to change when values haven't

**Investigation Approach**:
1. Check if arrays/objects are recreated on each render
2. Verify React Strict Mode isn't causing confusion (dev only, intentional double-render)
3. Look for missing dependencies in useMemo/useCallback
4. Trace prop changes up the component tree

**Key Principle**: Re-renders happen when React detects a change. If values are the same but object identity differs, React sees a change.

**Common Fix**: Memoize expensive computations or values passed as props:
```typescript
// Problem: New array every render
const items = data.map(transform);

// Solution: Memoize based on data changes
const items = useMemo(() => data.map(transform), [data]);
```

### Pattern: Missing or Broken API Endpoints

**When to Use**: Seeing 404, 500, or other HTTP errors in network logs

**Observable Symptoms**:
- Network requests fail with 4xx or 5xx status
- Console shows "Failed to fetch" or similar errors
- UI doesn't load expected data

**Investigation Approach**:
1. Note the exact URL being requested
2. Search codebase for files that should handle that route
3. Check if endpoint exists, was renamed, or has different parameters
4. Verify request method (GET/POST/etc) matches endpoint expectations

**Key Principle**: The URL in the browser's network tab is the ground truth. If it doesn't match what the backend expects, something is out of sync.

**Common Fixes**:
- Update client code to use new endpoint paths
- Remove prefetch logic for deleted endpoints
- Add missing API routes if they should exist
- Fix parameter encoding/formatting

### Pattern: React Hooks Rules Violations

**When to Use**: ESLint errors about hook usage, or unexpected hook behavior

**Observable Symptoms**:
- "React Hook called conditionally" lint error
- Hooks called different number of times across renders
- State gets mixed up between renders

**Investigation Approach**:
1. Find the file and line from lint output
2. Look for hooks (useState, useEffect, useMemo, etc.) after conditional returns
3. Check if hooks are inside loops, conditions, or nested functions
4. Verify same hooks run in same order every render

**Key Principle**: React relies on consistent hook call order. Calling hooks conditionally breaks React's internal state tracking.

**Common Fix**: Move hooks before early returns:
```typescript
// Problem: Hook after conditional return
if (loading) return <Spinner />;
const [state, setState] = useState(initial);

// Solution: Hook before any returns
const [state, setState] = useState(initial);
if (loading) return <Spinner />;
```

### Pattern: Cancelled or Duplicate Network Requests

**When to Use**: Network tab shows cancelled requests or multiple identical requests

**Observable Symptoms**:
- Request appears, immediately cancelled, then runs again
- Same request fires twice in quick succession
- Only happens in development, not production

**Investigation Approach**:
1. Check if React Strict Mode is enabled (development feature)
2. Look at component mounting behavior in dev vs prod
3. Verify useEffect cleanup functions abort requests
4. Check if dependency changes trigger re-fetches

**Key Principle**: In development, React Strict Mode intentionally double-invokes effects to help find bugs. This is expected and won't happen in production.

**Common Patterns**:
- Cancelled requests in dev are usually Strict Mode - verify they don't happen in prod build
- True duplicates often come from unstable dependencies causing effect re-runs
- Missing AbortController cleanup can leave orphaned requests

## MCP Tools Reference

### Browser Automation (Playwright)

**Navigation & Control**:
- Navigate to URL: Simulate user visiting a page
- Click elements: Trigger user interactions
- Wait for content: Ensure page has loaded before proceeding
- Close/restart browser: Get clean state for retesting

**Data Collection**:
- Get network log: See all HTTP requests and responses
- Get console output: Capture errors, warnings, and logs
- Get page snapshot: View current DOM structure as accessibility tree

**Use Cases**:
- Reproduce user-reported issues exactly as they experienced them
- Verify fixes work in actual browser environment
- Capture evidence of problems (errors, failed requests, wrong content)

### Key Principles for Using MCP Tools

1. **Automate Repetition**: Use browser automation for steps you'll need to repeat (reproduction, verification)
2. **Capture Evidence**: Network logs and console output are objective facts about what happened
3. **Isolate Variables**: Start fresh browser sessions to avoid stale state contaminating tests
4. **Check Multiple Sources**: Network + console + DOM together give complete picture

## Best Practices

### Start with Observation, Not Theory

**Don't**: Immediately jump to "it's probably a caching issue" or "must be a race condition"
**Do**: Run the app, reproduce the issue, and gather facts first

**Why**: Theories without evidence lead to random changes that might mask symptoms without fixing causes.

### Compare Development vs Production

**Principle**: Some issues only appear in one environment

**Check both modes**:
- Development mode may have debugging features (React Strict Mode, verbose logging)
- Production builds are optimized differently (minification, tree-shaking)
- Environment variables might differ

**Application**: If an issue only happens in dev, investigate dev-specific features. If only in prod, check build/optimization process.

### Make One Change at a Time

**Principle**: Multiple simultaneous changes make it impossible to know what fixed (or broke) something

**Process**:
1. Make focused change to address one specific issue
2. Verify the change (build, lint, test)
3. Reproduce issue to confirm fix
4. Commit before moving to next issue

**Why**: Clear cause-effect relationship between changes and outcomes.

### Trust But Verify

**Principle**: Don't assume the fix works - prove it empirically

**Verification Steps**:
1. Close browser (fresh state)
2. Reproduce original issue steps
3. Confirm symptoms are gone
4. Check for new issues introduced
5. Validate with build/lint/test

**Common Mistake**: Making a change that "should work" and moving on without testing.

### Document Your Investigation

**What to Record**:
- Exact steps to reproduce
- Observed behavior vs expected behavior
- Evidence gathered (console errors, network logs)
- Root cause identified
- Fix applied

**Why**: Helps others understand the issue, and helps you if it reoccurs or you need to explain the fix.

### Use the Right Tool

**Browser Automation**: For issues requiring user interaction or testing workflows
**Static Analysis**: For code quality issues, type errors, unused code
**Tests**: For functionality verification and regression prevention
**Build Tools**: For compilation, bundling, optimization issues

**Principle**: Match the tool to the problem type rather than forcing one approach for everything.

## Example Application

### Scenario: User Reports Unexpected Error

**Report**: "When I click the submit button, nothing happens and I see an error in the console"

**Step 1 - Reproduce**:
- Navigate to the page
- Fill out the form
- Click submit button
- Observe: Button doesn't respond, console shows error

**Step 2 - Gather Evidence**:
- Console: "TypeError: Cannot read property 'trim' of undefined"
- Network: No request sent (form never submitted)
- DOM: Button exists, not disabled

**Step 3 - Analyze**:
- Search for "trim" in form submission code
- Find: `const email = form.email.value.trim()`
- Issue: Code assumes email field exists, but optional fields might not be in form
- Root cause: Missing null check before calling `.trim()`

**Step 4 - Fix**:
```typescript
// Before
const email = form.email.value.trim();

// After
const email = form.email?.value?.trim() || '';
```

**Step 5 - Verify**:
- Fresh browser session
- Submit form without email field
- Observe: Form submits successfully, no console error

**Step 6 - Validate**:
- Build passes ✓
- Lint passes ✓
- Tests pass ✓

### Key Takeaways

1. **Evidence-driven**: Found exact error in console, didn't guess
2. **Root cause**: Null check missing, not "form doesn't work"
3. **Minimal fix**: One optional chain, not refactoring entire form
4. **Empirically verified**: Reproduced issue, confirmed fix works

## Related Skills

- **commit**: Create atomic commits documenting your fix with clear commit messages
- Use after completing troubleshooting to capture your changes properly

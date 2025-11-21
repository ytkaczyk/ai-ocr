# Manual Screen Reader Testing Guide

This guide provides instructions for manually testing the OCR Translation Comparison Viewer with screen readers to ensure comprehensive accessibility compliance.

**Implements**: T108 - Manual testing with NVDA/JAWS/VoiceOver screen readers

---

## Table of Contents

1. [Overview](#overview)
2. [Screen Reader Setup](#screen-reader-setup)
3. [Test Scenarios](#test-scenarios)
4. [Expected Behaviors](#expected-behaviors)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Automated accessibility testing with axe-core provides coverage for many WCAG 2.1 Level AA criteria, but manual screen reader testing is essential to verify:

- Screen reader announcements are clear and contextual
- Navigation order is logical and intuitive
- Interactive elements are properly labeled and announced
- State changes are communicated effectively
- Content is structured semantically

**Time Required**: 30-45 minutes per screen reader  
**Frequency**: Before each major release, and when accessibility features change

---

## Screen Reader Setup

### Windows - NVDA (Free, Open Source)

**Download**: https://www.nvaccess.org/download/

**Basic Controls**:
- Start/Stop: `Ctrl + Alt + N`
- Read next: `Down Arrow`
- Read previous: `Up Arrow`
- Click element: `Enter` or `Space`
- Navigate headings: `H`
- Navigate landmarks: `D`
- Navigate buttons: `B`
- Navigate forms: `F`
- List elements: `Insert + F7`

### Windows - JAWS (Commercial, Trial Available)

**Download**: https://www.freedomscientific.com/products/software/jaws/

**Basic Controls**:
- Start/Stop: Desktop shortcut
- Read next: `Down Arrow`
- Read previous: `Up Arrow`
- Click element: `Enter` or `Space`
- Navigate headings: `H`
- Navigate landmarks: `R`
- Navigate buttons: `B`
- Navigate forms: `F`
- List elements: `Insert + F3`

### macOS - VoiceOver (Built-in)

**Activation**: `Command + F5` or System Preferences > Accessibility > VoiceOver

**Basic Controls**:
- VoiceOver key: `Control + Option` (VO)
- Read next: `VO + Right Arrow`
- Read previous: `VO + Left Arrow`
- Click element: `VO + Space`
- Navigate headings: `VO + Command + H`
- Navigate landmarks: `VO + U` then arrows
- Web Rotor: `VO + U`

---

## Test Scenarios

### 1. Document Selection

**Objective**: Verify users can discover and select documents using only the screen reader.

**Steps**:
1. Navigate to the home page
2. Listen to the page announcement (should mention "Document selection" or similar)
3. Use heading navigation (`H` key) to find "Select a Document"
4. Tab through document cards
5. Verify each card announces: document name, page count, file size, available languages
6. Select a document using `Enter` or `Space`

**Expected Announcements**:
- "Select a Document, heading level 2"
- "Document card, button, kombucha, 3 pages, English (US), French"
- "Document selected" or similar confirmation

---

### 2. Page Navigation

**Objective**: Verify page navigation is accessible and state changes are announced.

**Steps**:
1. With a document loaded, tab to the pager controls
2. Verify toolbar is announced as "Document navigation and display controls"
3. Tab to each navigation button and verify proper labels:
   - "Go to first page, button"
   - "Go to previous page, button"
   - "Go to next page, button"
   - "Go to last page, button"
4. Navigate to page 2 using the next button
5. Listen for screen reader announcement: "Page 2 of [total]"
6. Use arrow key shortcuts (`Right Arrow`) to navigate
7. Verify announcement occurs after each navigation

**Expected Announcements**:
- "Page navigation, navigation landmark"
- "Go to first page, button, unavailable" (when on page 1)
- "Go to next page, button"
- After navigation: "Page 2 of 3"

---

### 3. Mode Switching

**Objective**: Verify 2-pane and 3-pane mode controls are accessible.

**Steps**:
1. Tab to the mode toggle group
2. Verify announcement: "View mode selector, group"
3. Navigate to 2-pane button
4. Verify announcement: "2-Pane, button, pressed" (if currently active)
5. Navigate to 3-pane button
6. If available, activate 3-pane mode
7. Listen for mode switch announcement

**Expected Announcements**:
- "View mode selector, group"
- "2-Pane, button, pressed"
- "3-Pane, button" or "3-Pane, button, unavailable, (2 language versions required for 3-pane)"
- After mode switch: "Switching to 3-pane..."

---

### 4. Content Panes

**Objective**: Verify PDF and markdown content is accessible and properly labeled.

**Steps**:
1. Navigate to the content area using landmark navigation (`R` or `D` key)
2. Verify announcement: "Document content panes, region"
3. Navigate into a pane
4. For PDF pane, verify: "PDF viewer pane, region"
5. For Markdown pane, verify: "Markdown viewer pane, region"
6. Navigate through markdown content using heading navigation
7. Test zoom controls on PDF pane (if visible)

**Expected Announcements**:
- "Document content panes, region"
- "PDF viewer pane, region"
- "Markdown viewer pane, region, Markdown content for en-US processed"
- Zoom controls: "PDF zoom controls, group"

---

### 5. Error States

**Objective**: Verify errors are announced with appropriate urgency.

**Steps**:
1. Trigger an error (e.g., navigate to invalid document ID in URL)
2. Verify error is announced immediately
3. Verify error has alert role: "Error loading document, alert"
4. Listen for full error message
5. If retry button exists, verify it's announced and focusable

**Expected Announcements**:
- "Error loading document, alert" (announced automatically)
- Full error message text
- "Try again, button"

---

### 6. Loading States

**Objective**: Verify loading indicators are announced appropriately.

**Steps**:
1. Refresh the page and listen for initial loading announcement
2. Select a document and listen for document loading
3. Navigate to a different page and listen for page loading
4. Verify announcements are polite (not interrupting other content)

**Expected Announcements**:
- "Loading documents..." (polite, in background)
- "Loading document..." (when selecting)
- "Page 2 of 3" (after navigation completes)

---

### 7. Keyboard Navigation

**Objective**: Verify all functionality is accessible via keyboard.

**Steps**:
1. Tab through the entire interface without using mouse
2. Verify focus is visible on all interactive elements
3. Use arrow keys for page navigation
4. Use `Enter` or `Space` to activate buttons
5. Verify `Escape` closes any modals (if applicable)
6. Test `Home` and `End` for first/last page navigation

**Expected Behavior**:
- All interactive elements reachable via `Tab`
- Focus order is logical (left-to-right, top-to-bottom)
- Focus indicator is clearly visible
- `Arrow Left/Right`, `Page Up/Down` work for navigation
- `Ctrl+Home`, `Ctrl+End` go to first/last page

---

## Expected Behaviors

### General Principles

1. **All interactive elements must be keyboard accessible**
   - Document cards, buttons, selects, inputs all reachable via Tab

2. **Focus order must be logical**
   - Mode toggle → Pager controls → Content panes

3. **State changes must be announced**
   - Page navigation, mode switching, loading, errors

4. **Landmarks and regions must be labeled**
   - `main`, `navigation`, `toolbar`, `region` roles with aria-labels

5. **Loading states must use aria-live="polite"**
   - Non-urgent updates don't interrupt user

6. **Errors must use role="alert" and aria-live="assertive"**
   - Critical issues announced immediately

---

## Testing Checklist

### Document Selection Page

- [ ] Page has proper document title
- [ ] Heading structure is logical (H1 for title, H2 for sections)
- [ ] Document count is announced
- [ ] Each document card has descriptive label
- [ ] Cards are keyboard navigable (Tab + Enter/Space)
- [ ] Loading indicator announced with aria-live="polite"
- [ ] Error states use role="alert"

### Viewer Page

- [ ] Toolbar announced as landmark
- [ ] Mode toggle group has proper label
- [ ] All pager buttons have aria-labels
- [ ] Page number input is labeled
- [ ] Arrow keys work for navigation
- [ ] Page changes announced via screen reader
- [ ] Content panes have descriptive regions
- [ ] PDF zoom controls are labeled
- [ ] Language selector is accessible

### Error Handling

- [ ] Errors use role="alert" and aria-live="assertive"
- [ ] Error messages are descriptive
- [ ] Retry buttons are accessible
- [ ] Error announcements are immediate

### General Accessibility

- [ ] No focus traps (can always Tab forward/backward)
- [ ] Focus indicator is visible (2px outline or equivalent)
- [ ] All images have alt text or aria-label
- [ ] Icons use aria-hidden="true" when decorative
- [ ] Skip links available (if needed for long pages)

---

## Troubleshooting

### Issue: Screen reader not announcing page changes

**Possible Causes**:
- aria-live region not present
- Announcement text not updating
- Browser or screen reader cache

**Solution**:
- Verify `<ScreenReaderAnnouncement>` component is rendered
- Check browser DevTools for `[data-testid="screen-reader-announcement"]`
- Clear browser cache and reload
- Test in different browser

---

### Issue: Focus lost after navigation

**Possible Causes**:
- React re-render removing focused element
- No focus management in navigation handler

**Solution**:
- Ensure navigation buttons maintain focus after click
- Use `useRef` to preserve focus on re-render
- Test focus management in browser DevTools

---

### Issue: Loading states not announced

**Possible Causes**:
- Missing aria-live attribute
- Announcement too fast (already hidden)

**Solution**:
- Verify aria-live="polite" on loading indicators
- Ensure loading states visible for at least 500ms
- Check that screen reader is running

---

### Issue: Buttons not activating with Enter/Space

**Possible Causes**:
- Using `<div>` instead of `<button>`
- Missing `onClick` handler
- Missing keyboard event handler

**Solution**:
- Use semantic `<button>` elements
- Add `onKeyDown` handler for Enter and Space
- Verify `role="button"` if using non-button elements

---

## Resources

- [WebAIM Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [NVDA Keyboard Shortcuts](https://webaim.org/resources/shortcuts/nvda)
- [JAWS Keyboard Shortcuts](https://webaim.org/resources/shortcuts/jaws)
- [VoiceOver Commands](https://webaim.org/articles/voiceover/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Reporting Issues

When reporting accessibility issues, please include:

1. **Screen reader**: Name and version (e.g., NVDA 2023.1)
2. **Browser**: Name and version (e.g., Chrome 120)
3. **Operating System**: Name and version (e.g., Windows 11)
4. **Steps to reproduce**: Detailed steps
5. **Expected behavior**: What should happen
6. **Actual behavior**: What actually happens
7. **WCAG criterion**: If known (e.g., 2.1.1 Keyboard, 4.1.2 Name, Role, Value)

---

**Last Updated**: 2025-11-20  
**Reviewer**: Accessibility Team  
**Next Review**: Before next major release

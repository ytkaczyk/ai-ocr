# Browser Compatibility

This document outlines browser compatibility, requirements, and testing strategies for the OCR Translation Comparison Viewer.

## Supported Browsers

### Production Environment

**The application is designed and tested exclusively for Google Chrome.**

- **Google Chrome** (current + 1 previous major version)

**Other browsers (Microsoft Edge, Firefox, Safari) are NOT supported.**

### Why Chrome Only?

This application is optimized specifically for Chrome to ensure:
- Consistent PDF.js canvas rendering performance
- Reliable React 19 compatibility
- Predictable behavior across all features
- Simplified testing and maintenance

### Test Environment

Automated E2E tests run exclusively in Chromium (Chrome's open-source base):

- **Chromium** (Chrome's rendering engine)

## Browser Requirements

### Minimum Requirements

To run this application, users must have:
- **Google Chrome version 120 or later** (current - 1 major version)
- **JavaScript enabled**
- **Minimum 1920×1080 screen resolution** (desktop mode required)

### Not Supported

The following browsers are **NOT supported** and may not function correctly:
- Microsoft Edge
- Mozilla Firefox  
- Apple Safari
- Any mobile browsers
- Internet Explorer (deprecated)

## Testing Strategy

### Automated E2E Tests

All E2E test suites run exclusively against Chrome (Chromium):

- **Total Test Executions**: 230 tests in Chrome
- **Current Pass Rate**: 204/230 passing (88.7%)
- **Parallel Execution**: 12 workers, ~3.3 min runtime
- **Intentionally Skipped**: 26 tests (require specific test data fixtures)

### Test Suites

1. **Document Selection** (9 tests): Loading, selection, navigation, language switching, errors
2. **Viewer Navigation** (24 tests): Layout, loading, navigation, synchronization, keyboard, jump-to-page, errors
3. **Concurrent Interactions** (17 tests): Rapid clicks, keyboard, mixed input, stress testing, page jumps
4. **PDF Edge Cases** (13 tests): Landscape, rotated, large/small pages, mixed sizes, errors
5. **Markdown Edge Cases** (15 tests): Broken syntax, invalid images, long lines, nested structures, special chars, empty content
6. **Responsive Layout** (10 tests): Mobile, tablet, desktop viewports, resizing, navigation
7. **Zero State** (3 tests): Empty data folder, no documents, error handling
8. **Mode Switching** (tests for 2-pane/3-pane toggle)
9. **Three-Pane Sync** (tests for 3-pane synchronization)
10. **Language Selection** (tests for per-pane language switching)

### Visual Regression Testing

**Status**: Not yet implemented (T103l)

**Planned Coverage**:
- Markdown typography consistency (FR-028b)
- Layout consistency (FR-028c)
- PDF rendering accuracy (FR-028a)

## Performance Considerations

### PDF Rendering (FR-028a)

- **Chrome**: Optimal performance with hardware-accelerated canvas rendering
- **Best for**: Large documents (>100 pages), high-resolution PDFs

### Recommendations

1. **Large Documents (>100 pages)**:
   - Chrome provides optimal performance
   - Enable zoom controls to reduce rendering load
   - Use "Fit Page" mode for initial view

2. **High-Resolution PDFs**:
   - Progressive loading implemented (low-res → high-res)
   - Lazy loading for distant pages (unload pages >10 away)
   - Image compression for >2000×2000 dimensions

## Testing Locally

### Run Tests

```bash
# Run all E2E tests (Chrome only, parallel execution)
npm run test:e2e

# Run E2E tests with single worker and dev server (for debugging)
npm run test:e2e:single

# Run tests for specific browser
npx playwright test --project=chromium
```

### Manual Browser Testing

1. Start the development server: `npm run dev`
2. Open the application in **Google Chrome**
3. Test critical paths:
   - Document loading
   - Page navigation (keyboard + mouse)
   - Mode switching (2-pane ↔ 3-pane)
   - PDF zoom controls
   - Language selection
   - Responsive layout (resize window)

## Known Issues and Workarounds

### Issue: Other Browsers Not Supported

**Status**: By design - Chrome-only application  
**Reason**: Ensures consistent behavior and simplifies testing/maintenance  
**Recommendation**: Use Google Chrome version 120 or later

## Reporting Browser Issues

When reporting Chrome-specific issues, please include:

1. **Browser**: Chrome version (e.g., "Chrome 121.0.6167.85")
2. **OS**: Operating system and version
3. **Document**: Size, page count, language(s)
4. **Action**: What you were doing when the issue occurred
5. **Expected**: What should have happened
6. **Actual**: What actually happened
7. **Console Logs**: Any errors in browser console (F12 → Console)

## Future Improvements

- [ ] Add visual regression testing (T103l)
- [ ] Add Lighthouse CI for performance testing
- [ ] Create Chrome-specific performance benchmarks
- [ ] Document screen reader compatibility (NVDA, JAWS, VoiceOver)

## References

- **FR-022**: Browser Compatibility Requirements (Chrome only)
- **FR-028**: Chrome-Specific Rendering Standards
- **FR-028a**: Canvas Performance Optimization
- **FR-028b**: Markdown Typography Consistency
- **FR-028c**: Layout Consistency
- **SC-002**: Browser Support Test Methodology (Chrome only)

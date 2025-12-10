# FR-034: Per-Pane Language Selection

**Feature**: OCR Translation Comparison Viewer  
**Requirement ID**: FR-034  
**Status**: ✅ Implemented  
**Implementation Date**: 2025-11-15  
**Phase**: Phase 5 (User Story 2)

## Overview

This feature allows users to independently select the language version displayed in each markdown pane, providing flexible comparison workflows beyond the default 3-pane mode assignments.

## Problem Statement

The original specification (FR-005) defined 2-pane and 3-pane viewing modes with fixed language assignments:
- **2-pane mode**: PDF + source language markdown
- **3-pane mode**: PDF + source language markdown + target language markdown

During user testing, it became clear that users needed the ability to:
- Compare different language versions in the same pane (e.g., switch from English to Spanish)
- Toggle between raw OCR output and processed content for any language
- Create custom comparison workflows (e.g., compare two translations side-by-side)

## Requirements

### FR-034a: Language Selector
Each markdown pane displays a dropdown selector populated with available languages from the document's language folders (per FR-009).

**Implementation**: `LanguageSelector` component with:
- Dropdown using ShadCN `Select` component
- Globe icon from lucide-react
- Formatted language names (e.g., "English (US)" for `en-US`)
- Disabled state when only one language is available

### FR-034b: Raw/Processed Toggle
Each language selector includes a toggle for raw vs processed content when both versions exist.

**Implementation**: Radio group with options:
- "Processed" (default): Displays content from `<language_code>/` folders
- "Raw": Displays content from `raw.<language_code>/` folders

### FR-034c: Selection Priority
User-selected languages take precedence over default language assignments.

**Implementation**: Priority logic in `PaneContainer`:
1. **User-selected language** (from `pane.languageCode` in store)
2. **3-pane mode defaults** (`sourceLanguageCode` for OCR pane, `targetLanguageCode` for translation pane)
3. **Fallback** (document's current `languageCode`)

### FR-034d: State Persistence
Language selections persist in Zustand store per pane.

**Implementation**: 
- Store action: `setPaneLanguage(paneId: string, languageCode: string, isRaw: boolean)`
- Store state: Each pane tracks `languageCode` and `isRaw` independently
- Selections persist across page navigation and mode switching

### FR-034e: UI Feedback
Language selector provides clear visual feedback and accessibility features.

**Implementation**:
- Formatted language names with country codes
- Globe icon for language identification
- Disabled state with opacity reduction when only one language available
- ARIA labels for screen readers
- Keyboard navigation support

## Architecture

### Components

#### `LanguageSelector.tsx`
```typescript
interface LanguageSelectorProps {
  availableLanguages: string[];
  selectedLanguage: string;
  isRaw: boolean;
  onLanguageChange: (language: string, isRaw: boolean) => void;
  disabled?: boolean;
}
```

**Responsibilities**:
- Render language dropdown with formatted names
- Render raw/processed toggle (only when both versions exist)
- Emit language change events to parent
- Handle disabled state

#### `MarkdownPane.tsx` (Enhanced)
```typescript
interface MarkdownPaneProps {
  // Existing props...
  availableLanguages?: string[];
  onLanguageChange?: (language: string, isRaw: boolean) => void;
}
```

**Enhancements**:
- Header section with language selector
- Pass through availableLanguages from parent
- Forward language change events to parent

#### `PaneContainer.tsx` (Enhanced)
```typescript
// Priority-based language selection logic
const renderPane = (pane: Pane) => {
  let paneLanguageCode = languageCode; // Fallback
  
  if (pane.languageCode) {
    // Priority 1: User-selected language
    paneLanguageCode = pane.languageCode;
  } else if (pane.isRaw && sourceLanguageCode) {
    // Priority 2: 3-pane mode defaults
    paneLanguageCode = sourceLanguageCode;
  } else if (!pane.isRaw && targetLanguageCode) {
    paneLanguageCode = targetLanguageCode;
  }
  
  return (
    <MarkdownPane
      languageCode={paneLanguageCode}
      availableLanguages={availableLanguages}
      onLanguageChange={(lang, raw) => setPaneLanguage(pane.id, lang, raw)}
    />
  );
};
```

#### `Viewer.tsx` (Enhanced)
```typescript
// Build available languages from document metadata
const availableLanguagesForSelector = useMemo(() => {
  if (!document) return [];
  
  const languages = new Set<string>();
  document.availableLanguages.forEach(lang => {
    // Extract base language code (remove 'raw.' prefix)
    const baseCode = lang.replace(/^raw\./, '');
    languages.add(baseCode);
  });
  
  return Array.from(languages);
}, [document]);
```

### Store Actions

#### `setPaneLanguage`
```typescript
setPaneLanguage: (paneId: string, languageCode: string, isRaw: boolean) => {
  set((state) => {
    const pane = state.panes.find(p => p.id === paneId);
    if (pane) {
      pane.languageCode = languageCode;
      pane.isRaw = isRaw;
    }
    return { panes: [...state.panes] };
  });
}
```

## Bug Fix: Language Selection Priority

### Issue
After initial implementation, user-selected languages were being overridden by 3-pane mode defaults. Users reported that "regardless of the selected language, it selects the first one."

### Root Cause
The `renderPane` logic in `PaneContainer.tsx` was applying 3-pane mode defaults (`sourceLanguageCode`/`targetLanguageCode`) before checking for user-selected languages.

### Solution
Reordered the conditional logic to prioritize user selections:
```typescript
// BEFORE (buggy)
if (pane.isRaw && sourceLanguageCode) {
  paneLanguageCode = sourceLanguageCode;
} else if (!pane.isRaw && targetLanguageCode) {
  paneLanguageCode = targetLanguageCode;
} else if (pane.languageCode) {
  paneLanguageCode = pane.languageCode;
}

// AFTER (fixed)
if (pane.languageCode) {
  paneLanguageCode = pane.languageCode; // Priority 1: User selection
} else if (pane.isRaw && sourceLanguageCode) {
  paneLanguageCode = sourceLanguageCode; // Priority 2: 3-pane defaults
} else if (!pane.isRaw && targetLanguageCode) {
  paneLanguageCode = targetLanguageCode;
}
```

## Testing

### Implemented
- ✅ Manual testing with multi-language documents (kombucha: en-US, fr-FR, es-ES)
- ✅ Build verification (TypeScript strict mode)
- ✅ Lint verification (ESLint)

### Deferred to Phase 6
- ⏳ Unit tests for `LanguageSelector` component (T097f)
- ⏳ E2E tests for language switching (T097g)
- ⏳ URL persistence for language selections (T097h)

## User Impact

### Before FR-034
Users were limited to fixed language assignments:
- 2-pane: Always source language
- 3-pane: Always source + target languages

### After FR-034
Users can create flexible comparison workflows:
- Compare any two languages side-by-side
- Switch between raw and processed versions for any language
- Compare two translations against each other
- Test OCR quality across different language versions

## Future Enhancements

### URL Persistence (T097h)
Extend URL query parameters to include per-pane language selections for bookmarkable configurations:
```
?mode=3pane&pane1Lang=en-US&pane1Raw=false&pane2Lang=es-ES&pane2Raw=false&pane3Lang=fr-FR&pane3Raw=true
```

### Language Presets
Save commonly used language configurations as presets for quick switching:
- "Source vs Target" (current 3-pane default)
- "All Translations" (compare multiple target languages)
- "Raw vs Processed" (same language, both versions)

## Related Requirements

- **FR-005**: Two display modes (2-pane, 3-pane) - FR-034 extends mode functionality
- **FR-009**: Language folder naming conventions - FR-034 uses language codes from folder structure
- **FR-019**: Language-specific folder naming - FR-034 supports raw/processed detection
- **FR-021**: Default to processed content - FR-034 respects this default in selector

## Files Modified

1. `components/viewer/LanguageSelector.tsx` - Created new component
2. `components/viewer/MarkdownPane.tsx` - Added language selector to header
3. `components/viewer/PaneContainer.tsx` - Added language selection logic and priority handling
4. `components/viewer/Viewer.tsx` - Built availableLanguages list from document metadata
5. `lib/stores/useViewerStore.ts` - Added `setPaneLanguage` action
6. `specs/001-ocr-translation-viewer/spec.md` - Added FR-034 requirement
7. `specs/001-ocr-translation-viewer/tasks.md` - Added T097a-T097h tasks

## Acceptance Criteria

- [X] Each markdown pane displays a language selector dropdown
- [X] Dropdown is populated with available languages from document metadata
- [X] Language selector includes raw/processed toggle when applicable
- [X] User-selected language takes priority over 3-pane defaults
- [X] Language selections persist in store across page navigation
- [X] Language selector displays formatted language names (e.g., "English (US)")
- [X] Language selector is disabled when only one language is available
- [X] Build and lint pass with 0 errors
- [ ] Unit tests for LanguageSelector component (deferred to Phase 6)
- [ ] E2E tests for language switching (deferred to Phase 6)
- [ ] URL persistence for language selections (optional enhancement, deferred)

## Conclusion

FR-034 successfully addresses a user-identified gap in the specification by providing flexible per-pane language selection. The feature enhances the core comparison workflow without disrupting existing functionality, and the bug fix ensures user selections are properly respected.

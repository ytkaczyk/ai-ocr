import '@testing-library/jest-dom';
import { beforeAll, afterAll, vi } from 'vitest';
import React from 'react';

// Mock lib/utils for cn function
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
}));

// Mock lucide-react icons with all required exports
vi.mock('lucide-react', () => ({
  FolderOpen: () => React.createElement('svg', { 'data-testid': 'folder-open-icon' }),
  Settings: () => React.createElement('svg', { 'data-testid': 'settings-icon' }),
  AlertCircle: () => React.createElement('svg', { 'data-testid': 'alert-circle-icon' }),
  Columns2: () => React.createElement('svg', { 'data-testid': 'columns2-icon' }),
  Columns3: () => React.createElement('svg', { 'data-testid': 'columns3-icon' }),
  Loader2: () => React.createElement('svg', { 'data-testid': 'loader2-icon', className: 'animate-spin' }),
  ChevronLeft: () => React.createElement('svg', { 'data-testid': 'chevron-left-icon' }),
  ChevronRight: () => React.createElement('svg', { 'data-testid': 'chevron-right-icon' }),
  ChevronsLeft: () => React.createElement('svg', { 'data-testid': 'chevrons-left-icon' }),
  ChevronsRight: () => React.createElement('svg', { 'data-testid': 'chevrons-right-icon' }),
  ChevronDown: () => React.createElement('svg', { 'data-testid': 'chevron-down-icon' }),
  ChevronUp: () => React.createElement('svg', { 'data-testid': 'chevron-up-icon' }),
  Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
  Globe: () => React.createElement('svg', { 'data-testid': 'globe-icon' }),
  ZoomIn: () => React.createElement('svg', { 'data-testid': 'zoom-in-icon' }),
  ZoomOut: () => React.createElement('svg', { 'data-testid': 'zoom-out-icon' }),
  Info: () => React.createElement('svg', { 'data-testid': 'info-icon' }),
  AlertTriangle: () => React.createElement('svg', { 'data-testid': 'alert-triangle-icon' }),
  FileText: () => React.createElement('svg', { 'data-testid': 'file-text-icon' }),
  Monitor: () => React.createElement('svg', { 'data-testid': 'monitor-icon' }),
  FileQuestion: () => React.createElement('svg', { 'data-testid': 'file-question-icon' }),
}));

// Suppress React 19 act() warnings from async child component updates
// These are expected when testing components that render async children
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

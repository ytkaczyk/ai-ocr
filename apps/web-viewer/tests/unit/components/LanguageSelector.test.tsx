import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageSelector } from '@/components/viewer/LanguageSelector';

/**
 * Unit tests for LanguageSelector component (T097f)
 * Tests FR-034: Per-pane language selection
 * Tests FR-034a: Language selector dropdown
 * Tests FR-034e: UI feedback and formatting
 * 
 * Note: Dropdown interaction tests (raw/processed toggle, language selection)
 * are covered by E2E tests due to Radix UI Select limitations in JSDOM.
 * 
 * Total: 20 tests
 */

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Globe: () => <span data-testid="globe-icon">Globe</span>,
  ChevronDown: () => <span data-testid="chevron-icon">ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Check: () => <span>Check</span>,
}));

describe('LanguageSelector', () => {
  let mockOnLanguageChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLanguageChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering (FR-034a, FR-034e)', () => {
    it('should render Globe icon', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
    });

    it('should render Select component with multiple languages', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByRole('combobox', { name: /select language version/i })).toBeInTheDocument();
    });

    it('should display formatted language name for selected language', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('English (US)')).toBeInTheDocument();
    });

    it('should show custom label if provided', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false, label: 'Custom Label' },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });
  });

  describe('Language Formatting (FR-034e)', () => {
    const testCases = [
      { code: 'en-US', isRaw: false, expected: 'English (US)' },
      { code: 'en-GB', isRaw: false, expected: 'English (UK)' },
      { code: 'es-ES', isRaw: false, expected: 'Spanish (ES)' },
      { code: 'fr-FR', isRaw: false, expected: 'French (FR)' },
      { code: 'de-DE', isRaw: false, expected: 'German (DE)' },
      { code: 'ja-JP', isRaw: false, expected: 'Japanese (JP)' },
      { code: 'zh-CN', isRaw: false, expected: 'Chinese (CN)' },
    ];

    testCases.forEach(({ code, isRaw, expected }) => {
      it(`should format ${code} as "${expected}"`, () => {
        const languages = [{ languageCode: code, isRaw }];

        render(
          <LanguageSelector
            availableLanguages={languages}
            selectedLanguageCode={code}
            selectedIsRaw={isRaw}
            onLanguageChange={mockOnLanguageChange}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });

    it('should append "(Raw)" suffix for raw content', () => {
      const languages = [{ languageCode: 'en-US', isRaw: true }];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={true}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('English (US) (Raw)')).toBeInTheDocument();
    });

    it('should show language code for unmapped languages', () => {
      const languages = [{ languageCode: 'xx-YY', isRaw: false }];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="xx-YY"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('xx-YY')).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode (Single Language)', () => {
    it('should render as read-only text with single language', () => {
      const languages = [{ languageCode: 'en-US', isRaw: false }];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      // Should not render select dropdown
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      
      // Should show language as text
      expect(screen.getByText('English (US)')).toBeInTheDocument();
      expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
    });

    it('should use custom label in read-only mode', () => {
      const languages = [{ languageCode: 'en-US', isRaw: false, label: 'Source Language' }];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('Source Language')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render "No languages available" when empty', () => {
      render(
        <LanguageSelector
          availableLanguages={[]}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByText('No languages available')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
          disabled={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Custom className', () => {
    it('should accept and apply custom className', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      const { container } = render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on select trigger', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      expect(screen.getByRole('combobox', { name: /select language version/i })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes on select', () => {
      const languages = [
        { languageCode: 'en-US', isRaw: false },
        { languageCode: 'es-ES', isRaw: false },
      ];

      render(
        <LanguageSelector
          availableLanguages={languages}
          selectedLanguageCode="en-US"
          selectedIsRaw={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label', 'Select language version');
    });
  });
});

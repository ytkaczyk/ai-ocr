'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

/**
 * LanguageSelector component
 * Allows users to select which language version to display in a markdown pane
 * Implements FR-034: Per-pane language selection
 */

interface LanguageSelectorProps {
  availableLanguages: Array<{
    languageCode: string;
    isRaw: boolean;
    label?: string;
  }>;
  selectedLanguageCode: string;
  selectedIsRaw: boolean;
  onLanguageChange: (languageCode: string, isRaw: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function LanguageSelector({
  availableLanguages,
  selectedLanguageCode,
  selectedIsRaw,
  onLanguageChange,
  className = '',
  disabled = false,
}: LanguageSelectorProps) {
  // Create a unique value combining language code and raw status
  const selectedValue = `${selectedLanguageCode}:${selectedIsRaw ? 'raw' : 'processed'}`;

  const handleValueChange = (value: string) => {
    const [languageCode, type] = value.split(':');
    const isRaw = type === 'raw';
    onLanguageChange(languageCode, isRaw);
  };

  // Format language code for display (e.g., "en-US" -> "English (US)")
  const formatLanguageLabel = (code: string, isRaw: boolean): string => {
    const langMap: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'es-ES': 'Spanish (ES)',
      'es-MX': 'Spanish (MX)',
      'fr-FR': 'French (FR)',
      'fr-CA': 'French (CA)',
      'de-DE': 'German (DE)',
      'it-IT': 'Italian (IT)',
      'pt-BR': 'Portuguese (BR)',
      'pt-PT': 'Portuguese (PT)',
      'ja-JP': 'Japanese (JP)',
      'zh-CN': 'Chinese (CN)',
      'zh-TW': 'Chinese (TW)',
      'ko-KR': 'Korean (KR)',
      'ar-SA': 'Arabic (SA)',
      'ru-RU': 'Russian (RU)',
    };

    const displayName = langMap[code] || code;
    return isRaw ? `${displayName} (Raw)` : displayName;
  };

  if (availableLanguages.length === 0) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        No languages available
      </div>
    );
  }

  // If only one option, show as read-only text
  if (availableLanguages.length === 1) {
    const lang = availableLanguages[0];
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">
          {lang.label || formatLanguageLabel(lang.languageCode, lang.isRaw)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-3.5 w-3.5 text-muted-foreground" data-testid="globe-icon" />
      <Select
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-8 w-[200px] text-xs"
          aria-label="Select language version"
        >
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => {
            const value = `${lang.languageCode}:${lang.isRaw ? 'raw' : 'processed'}`;
            const label = lang.label || formatLanguageLabel(lang.languageCode, lang.isRaw);
            
            return (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

import { DocumentSet } from '@/lib/types/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * DocumentCard component
 * Displays individual document information in a card format
 */

export interface DocumentCardProps {
  document: DocumentSet;
  onSelect: (documentId: string) => void;
  isSelected?: boolean;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get language display name from code
 */
function getLanguageDisplay(languageCode: string, isRaw: boolean): string {
  const langMap: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'fr-FR': 'French',
    'es-ES': 'Spanish',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-BR': 'Portuguese (BR)',
    'ja-JP': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
  };

  const baseName = langMap[languageCode] || languageCode;
  return isRaw ? `${baseName} (Raw)` : baseName;
}

export function DocumentCard({ document, onSelect, isSelected = false }: DocumentCardProps) {
  // FR-021: Prefer processed over raw content
  const processedLanguages = document.availableLanguages.filter((lang) => !lang.isRaw);
  const rawLanguages = document.availableLanguages.filter((lang) => lang.isRaw);

  const displayLanguages = processedLanguages.length > 0 ? processedLanguages : rawLanguages;

  return (
    <Card
      role="button"
      aria-pressed={isSelected}
      data-testid="document-card"
      data-selected={isSelected.toString()}
      className={`cursor-pointer transition-colors hover:border-primary ${
        isSelected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => onSelect(document.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(document.id);
        }
      }}
      tabIndex={0}
      aria-label={`${document.fileName}, ${document.pageCount} pages, ${displayLanguages.map(l => getLanguageDisplay(l.languageCode, l.isRaw)).join(', ')}. ${isSelected ? 'Selected' : 'Not selected'}. Press Enter or Space to select.`}
    >
      <CardHeader>
        <CardTitle className="text-lg" data-testid="document-name">{document.fileName}</CardTitle>
        <CardDescription data-testid="document-info">
          <span data-testid="page-count">{document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'}</span> •{' '}
          <span data-testid="file-size">{formatFileSize(document.pdfSizeBytes || 0)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <strong>Available Languages:</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayLanguages.map((lang) => (
              <span
                key={`${lang.languageCode}-${lang.isRaw}`}
                data-testid="language-badge"
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {getLanguageDisplay(lang.languageCode, lang.isRaw)}
              </span>
            ))}
            {rawLanguages.length > 0 && processedLanguages.length > 0 && (
              <span className="text-xs text-muted-foreground">
                +{rawLanguages.length} raw {rawLanguages.length === 1 ? 'version' : 'versions'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

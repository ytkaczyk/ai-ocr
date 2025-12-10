import { FileQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * MissingPagePlaceholder component
 * Displays a placeholder when a markdown page is missing from the OCR output
 * Implements FR-014: Missing markdown page placeholder
 */

interface MissingPagePlaceholderProps {
  pageNumber: number;
  languageCode: string;
  isRaw?: boolean;
  className?: string;
}

export function MissingPagePlaceholder({
  pageNumber,
  languageCode,
  isRaw = false,
  className = '',
}: MissingPagePlaceholderProps) {
  const translationType = isRaw ? 'raw OCR output' : 'translation';

  return (
    <div
      className={`flex h-full w-full items-center justify-center p-8 ${className}`}
      role="alert"
      aria-live="polite"
      aria-label={`Page ${pageNumber} is missing from ${languageCode} ${translationType}`}
    >
      <Card className="w-full max-w-md" style={{ backgroundColor: '#F3F4F6' }}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-300"
            aria-hidden="true"
          >
            <FileQuestion className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Page {pageNumber} Not Available
          </h3>
          <p className="text-sm text-gray-700">
            This page was not found in the {languageCode} {translationType}. It may not have been
            processed yet or was skipped during OCR scanning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

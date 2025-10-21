import { AlertCircle, FolderOpen, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * EmptyState component
 * Displays helpful messages and actions for zero-state scenarios
 * Implements FR-023: Zero-state scenarios
 */

export type EmptyStateType = 'no-documents' | 'unconfigured' | 'error';

export interface EmptyStateProps {
  type: EmptyStateType;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateConfig: Record<
  EmptyStateType,
  {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    defaultAction?: {
      label: string;
      href: string;
    };
  }
> = {
  'no-documents': {
    icon: FolderOpen,
    title: 'No Documents Found',
    description:
      'The data folder is empty or contains no valid document sets. Add PDF files with corresponding language folders to get started.',
    defaultAction: {
      label: 'View Setup Guide',
      href: '/docs/setup',
    },
  },
  unconfigured: {
    icon: Settings,
    title: 'Data Folder Not Configured',
    description:
      'The DATA_FOLDER_PATH environment variable is not set or points to an invalid location. Please configure your .env file.',
    defaultAction: {
      label: 'Configuration Guide',
      href: '/docs/configuration',
    },
  },
  error: {
    icon: AlertCircle,
    title: 'Error Loading Documents',
    description:
      'An error occurred while loading documents. This may be due to file system permissions or invalid folder structure.',
  },
};

export function EmptyState({ type, message, action }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription className="text-base">
            {message || config.description}
          </CardDescription>
        </CardHeader>
        {(action || config.defaultAction) && (
          <CardContent className="text-center">
            {action ? (
              <Button onClick={action.onClick} variant="default">
                {action.label}
              </Button>
            ) : config.defaultAction ? (
              <Button asChild variant="outline">
                <a href={config.defaultAction.href}>{config.defaultAction.label}</a>
              </Button>
            ) : null}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

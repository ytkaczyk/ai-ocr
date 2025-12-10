import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/viewer/EmptyState';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders with required type prop', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });

    it('renders title from config', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByText('No Documents Found')).toBeInTheDocument();
    });

    it('renders default description from config', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByText(/data folder is empty/i)).toBeInTheDocument();
    });

    it('renders custom message when provided', () => {
      render(<EmptyState type="no-documents" message="Custom message for testing" />);
      
      expect(screen.getByText('Custom message for testing')).toBeInTheDocument();
      expect(screen.queryByText(/data folder is empty/i)).not.toBeInTheDocument();
    });
  });

  describe('No Documents Type (FR-023)', () => {
    it('renders no-documents type with correct title', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByText('No Documents Found')).toBeInTheDocument();
    });

    it('renders no-documents description', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByText(/data folder is empty/i)).toBeInTheDocument();
      expect(screen.getByText(/add pdf files/i)).toBeInTheDocument();
    });

    it('renders folder icon for no-documents type', () => {
      const { container } = render(<EmptyState type="no-documents" />);
      
      // Icon should be present
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders default action link for no-documents type', () => {
      render(<EmptyState type="no-documents" />);
      
      expect(screen.getByRole('link', { name: /view setup guide/i })).toBeInTheDocument();
    });

    it('default action links to setup guide', () => {
      render(<EmptyState type="no-documents" />);
      
      const link = screen.getByRole('link', { name: /view setup guide/i });
      expect(link).toHaveAttribute('href', '/docs/setup');
    });
  });

  describe('Unconfigured Type (FR-023)', () => {
    it('renders unconfigured type with correct title', () => {
      render(<EmptyState type="unconfigured" />);
      
      expect(screen.getByText('Data Folder Not Configured')).toBeInTheDocument();
    });

    it('renders unconfigured description', () => {
      render(<EmptyState type="unconfigured" />);
      
      expect(screen.getByText(/DATA_FOLDER_PATH/i)).toBeInTheDocument();
      expect(screen.getByText(/environment variable/i)).toBeInTheDocument();
    });

    it('renders settings icon for unconfigured type', () => {
      const { container } = render(<EmptyState type="unconfigured" />);
      
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders default action link for unconfigured type', () => {
      render(<EmptyState type="unconfigured" />);
      
      expect(screen.getByRole('link', { name: /configuration guide/i })).toBeInTheDocument();
    });

    it('default action links to configuration guide', () => {
      render(<EmptyState type="unconfigured" />);
      
      const link = screen.getByRole('link', { name: /configuration guide/i });
      expect(link).toHaveAttribute('href', '/docs/configuration');
    });
  });

  describe('Error Type (FR-023)', () => {
    it('renders error type with correct title', () => {
      render(<EmptyState type="error" />);
      
      expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
    });

    it('renders error description', () => {
      render(<EmptyState type="error" />);
      
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      expect(screen.getByText(/file system permissions/i)).toBeInTheDocument();
    });

    it('renders alert icon for error type', () => {
      const { container } = render(<EmptyState type="error" />);
      
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render action for error type by default', () => {
      render(<EmptyState type="error" />);
      
      // Error type has no defaultAction in config
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('Custom Actions', () => {
    it('renders custom action button when provided', async () => {
      const mockClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <EmptyState
          type="no-documents"
          action={{ label: 'Custom Action', onClick: mockClick }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Custom Action' });
      expect(button).toBeInTheDocument();
      
      await user.click(button);
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('custom action replaces default action', () => {
      const mockClick = vi.fn();
      
      render(
        <EmptyState
          type="no-documents"
          action={{ label: 'Custom Action', onClick: mockClick }}
        />
      );
      
      // Should only have custom action button
      expect(screen.queryByRole('link', { name: /view setup guide/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
    });

    it('custom action can be added to error type', async () => {
      const mockClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <EmptyState
          type="error"
          action={{ label: 'Retry', onClick: mockClick }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Retry' });
      await user.click(button);
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout and Styling', () => {
    it('renders within a card component', () => {
      const { container } = render(<EmptyState type="no-documents" />);
      
      // Card structure should be present
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('renders icon with rounded background', () => {
      const { container } = render(<EmptyState type="no-documents" />);
      
      // Icon wrapper should have rounded background
      const iconWrapper = container.querySelector('.rounded-full');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('centers content', () => {
      const { container } = render(<EmptyState type="no-documents" />);
      
      const wrapper = container.querySelector('.items-center.justify-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies minimum height constraint', () => {
      const { container } = render(<EmptyState type="no-documents" />);
      
      const wrapper = container.querySelector('[class*="min-h"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('displays title text prominently', () => {
      render(<EmptyState type="no-documents" />);
      
      const title = screen.getByText('No Documents Found');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('font-semibold');
    });

    it('provides meaningful text content for screen readers', () => {
      render(<EmptyState type="error" />);
      
      // Title and description provide context
      expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });

    it('action button is keyboard accessible', async () => {
      const mockClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <EmptyState
          type="error"
          action={{ label: 'Retry', onClick: mockClick }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Retry' });
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalled();
    });

    it('action link is keyboard accessible', () => {
      render(<EmptyState type="no-documents" />);
      
      const link = screen.getByRole('link', { name: /view setup guide/i });
      expect(link).toHaveAttribute('href');
    });
  });

  describe('Content Customization', () => {
    it('accepts custom message for no-documents type', () => {
      render(
        <EmptyState
          type="no-documents"
          message="Please add documents to the configured folder"
        />
      );
      
      expect(screen.getByText('Please add documents to the configured folder')).toBeInTheDocument();
      expect(screen.queryByText(/data folder is empty/i)).not.toBeInTheDocument();
    });

    it('accepts custom message for unconfigured type', () => {
      render(
        <EmptyState
          type="unconfigured"
          message="Custom configuration error message"
        />
      );
      
      expect(screen.getByText('Custom configuration error message')).toBeInTheDocument();
    });

    it('accepts custom message for error type', () => {
      render(
        <EmptyState
          type="error"
          message="Failed to connect to the server"
        />
      );
      
      expect(screen.getByText('Failed to connect to the server')).toBeInTheDocument();
    });

    it('preserves title even with custom message', () => {
      render(
        <EmptyState
          type="error"
          message="Custom error details"
        />
      );
      
      // Title should remain the same
      expect(screen.getByText('Error Loading Documents')).toBeInTheDocument();
      // But description should be custom
      expect(screen.getByText('Custom error details')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string message', () => {
      render(<EmptyState type="no-documents" message="" />);
      
      // Empty message is falsy, so it should use the default description
      const description = screen.getByText(/data folder is empty/i);
      expect(description).toBeInTheDocument();
    });

    it('handles very long custom message', () => {
      const longMessage = 'A'.repeat(500);
      render(<EmptyState type="error" message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles action with long label', async () => {
      const mockClick = vi.fn();
      const user = userEvent.setup();
      const longLabel = 'This is a very long action button label that might wrap';
      
      render(
        <EmptyState
          type="error"
          action={{ label: longLabel, onClick: mockClick }}
        />
      );
      
      const button = screen.getByRole('button', { name: longLabel });
      await user.click(button);
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('FR-023: Zero-State Scenarios', () => {
    it('provides helpful guidance for no-documents scenario', () => {
      render(<EmptyState type="no-documents" />);
      
      // Should explain what to do
      expect(screen.getByText(/add pdf files/i)).toBeInTheDocument();
      // Should have actionable next step
      expect(screen.getByRole('link', { name: /view setup guide/i })).toBeInTheDocument();
    });

    it('provides helpful guidance for unconfigured scenario', () => {
      render(<EmptyState type="unconfigured" />);
      
      // Should explain the issue
      expect(screen.getByText(/DATA_FOLDER_PATH/i)).toBeInTheDocument();
      // Should have actionable next step
      expect(screen.getByRole('link', { name: /configuration guide/i })).toBeInTheDocument();
    });

    it('provides helpful guidance for error scenario', () => {
      render(<EmptyState type="error" />);
      
      // Should explain the issue
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      expect(screen.getByText(/file system permissions/i)).toBeInTheDocument();
    });

    it('uses distinct icons for each scenario type', () => {
      const { container: container1 } = render(<EmptyState type="no-documents" />);
      const { container: container2 } = render(<EmptyState type="unconfigured" />);
      const { container: container3 } = render(<EmptyState type="error" />);
      
      // Each should have an icon
      expect(container1.querySelector('svg')).toBeInTheDocument();
      expect(container2.querySelector('svg')).toBeInTheDocument();
      expect(container3.querySelector('svg')).toBeInTheDocument();
    });

    it('all types provide clear, actionable information', () => {
      // No-documents: explains what's missing
      render(<EmptyState type="no-documents" />);
      expect(screen.getByText(/data folder is empty/i)).toBeInTheDocument();
      
      // Unconfigured: explains configuration issue
      render(<EmptyState type="unconfigured" />);
      expect(screen.getByText(/not set or points to an invalid location/i)).toBeInTheDocument();
      
      // Error: explains potential causes
      render(<EmptyState type="error" />);
      expect(screen.getByText(/file system permissions or invalid folder structure/i)).toBeInTheDocument();
    });
  });
});


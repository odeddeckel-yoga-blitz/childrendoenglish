import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

// Suppress console.error from ErrorBoundary.componentDidCatch
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

vi.mock('../utils/sentry', () => ({
  captureException: vi.fn(),
}));

function ThrowError({ shouldThrow }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Raw error.message should NOT be shown to users (only generic text)
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('renders the back to menu button and calls onReset', () => {
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Back to Menu'));
    expect(onReset).toHaveBeenCalled();
  });
});

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import LoadingScreen from '../components/LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders progress percentage', () => {
    render(<LoadingScreen progress={42} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('renders a progressbar with correct value', () => {
    render(<LoadingScreen progress={60} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
  });

  it('shows preparing message initially', () => {
    render(<LoadingScreen progress={30} />);
    expect(screen.getByText('Preparing your quiz...')).toBeInTheDocument();
  });

  it('shows timeout message with retry/cancel after 12 seconds', () => {
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    render(<LoadingScreen progress={30} onRetry={onRetry} onCancel={onCancel} />);

    act(() => {
      vi.advanceTimersByTime(13000);
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Back to Menu')).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuitModal from '../components/QuitModal';

const defaultProps = {
  onContinue: vi.fn(),
  onQuit: vi.fn(),
  lang: 'en',
};

describe('QuitModal', () => {
  it('renders the quit modal dialog', () => {
    render(<QuitModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('End quiz?')).toBeInTheDocument();
  });

  it('shows progress saved message', () => {
    render(<QuitModal {...defaultProps} />);
    expect(screen.getByText('Your progress will be saved.')).toBeInTheDocument();
  });

  it('calls onContinue when Continue clicked', () => {
    render(<QuitModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue'));
    expect(defaultProps.onContinue).toHaveBeenCalled();
  });

  it('calls onQuit when End Quiz clicked', () => {
    render(<QuitModal {...defaultProps} />);
    fireEvent.click(screen.getByText('End Quiz'));
    expect(defaultProps.onQuit).toHaveBeenCalled();
  });
});

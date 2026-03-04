import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeSelect from '../components/ModeSelect';

const defaultProps = {
  level: 'beginner',
  lang: 'en',
  canRead: true,
  onSelect: vi.fn(),
  onBack: vi.fn(),
};

describe('ModeSelect', () => {
  it('renders the choose mode heading', () => {
    render(<ModeSelect {...defaultProps} />);
    expect(screen.getByText('Choose Mode')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<ModeSelect {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders all 4 quiz modes for readers', () => {
    render(<ModeSelect {...defaultProps} />);
    expect(screen.getByText('Listen & Match')).toBeInTheDocument();
    expect(screen.getByText('Image Quiz')).toBeInTheDocument();
    expect(screen.getByText('Word Quiz')).toBeInTheDocument();
    expect(screen.getByText('Audio Quiz')).toBeInTheDocument();
  });

  it('hides Image Quiz for pre-readers (canRead=false)', () => {
    render(<ModeSelect {...defaultProps} canRead={false} />);
    expect(screen.queryByText('Image Quiz')).not.toBeInTheDocument();
    expect(screen.getByText('Listen & Match')).toBeInTheDocument();
  });

  it('calls onSelect with mode id when clicked', () => {
    render(<ModeSelect {...defaultProps} />);
    fireEvent.click(screen.getByText('Word Quiz'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('word');
  });
});

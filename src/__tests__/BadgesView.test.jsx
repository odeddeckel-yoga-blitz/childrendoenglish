import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BadgesView from '../components/BadgesView';

const defaultProps = {
  stats: { badges: ['first_word'] },
  lang: 'en',
  onBack: vi.fn(),
};

describe('BadgesView', () => {
  it('renders the badges title', () => {
    render(<BadgesView {...defaultProps} />);
    expect(screen.getByText('Badges')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<BadgesView {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('shows earned badge count', () => {
    render(<BadgesView {...defaultProps} />);
    // Shows "1 / N" where N is total badges
    expect(screen.getByText(/^1 \//)).toBeInTheDocument();
  });

  it('marks earned badges with Earned label', () => {
    render(<BadgesView {...defaultProps} />);
    const earned = screen.getAllByText('Earned!');
    expect(earned.length).toBe(1);
  });
});

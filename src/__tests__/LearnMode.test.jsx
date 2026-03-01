import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LearnMode from '../components/LearnMode';

const defaultProps = {
  stats: { wordProgress: { cat: { interval: 14 }, dog: { interval: 3 } } },
  lang: 'en',
  canRead: true,
  onBack: vi.fn(),
};

describe('LearnMode', () => {
  it('renders the header', () => {
    render(<LearnMode {...defaultProps} />);
    expect(screen.getByText('Learn Words')).toBeInTheDocument();
  });

  it('renders grid of word cards', () => {
    render(<LearnMode {...defaultProps} />);
    // Should render multiple word images
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows mastery dots for words with progress', () => {
    const { container } = render(<LearnMode {...defaultProps} />);
    // Cat has interval >= 14, should have an emerald dot
    const dots = container.querySelectorAll('.bg-emerald-500');
    expect(dots.length).toBeGreaterThan(0);
    // Dog has interval < 14, should have an amber dot
    const amberDots = container.querySelectorAll('.bg-amber-500');
    expect(amberDots.length).toBeGreaterThan(0);
  });

  it('filters words by search', () => {
    render(<LearnMode {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search words...');
    fireEvent.change(input, { target: { value: 'cat' } });
    // Should show "cat" word card
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('shows empty state with emoji when no results', () => {
    render(<LearnMode {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search words...');
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });
    expect(screen.getByText('No words found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search or category')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LearnMode {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('switches to detail view', () => {
    render(<LearnMode {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Detail view'));
    // Should show navigation arrows in detail view
    expect(screen.getByLabelText('Previous word')).toBeInTheDocument();
    expect(screen.getByLabelText('Next word')).toBeInTheDocument();
  });
});

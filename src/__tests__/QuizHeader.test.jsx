import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizHeader from '../components/QuizHeader';

const defaultProps = {
  score: 3,
  total: 10,
  streak: 0,
  soundEnabled: true,
  onToggleSound: vi.fn(),
  onQuit: vi.fn(),
  currentIndex: 4,
  lang: 'en',
};

describe('QuizHeader', () => {
  it('renders score display', () => {
    render(<QuizHeader {...defaultProps} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('renders question counter', () => {
    render(<QuizHeader {...defaultProps} />);
    expect(screen.getByText(/Question 5 of 10/)).toBeInTheDocument();
  });

  it('re-asked words keep the total at 10 (CUX13)', () => {
    render(<QuizHeader {...defaultProps} total={16} scoreTotal={10} currentIndex={6} questionNum={5} isRetry />);
    expect(screen.getByText(/Question 5 of 10/)).toBeInTheDocument();
    expect(screen.queryByText(/of 16/)).toBeNull();
  });

  it('renders a progressbar', () => {
    render(<QuizHeader {...defaultProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onQuit when quit button clicked', () => {
    render(<QuizHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Quit quiz'));
    expect(defaultProps.onQuit).toHaveBeenCalled();
  });

  it('shows streak fire icon when streak >= 3', () => {
    render(<QuizHeader {...defaultProps} streak={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

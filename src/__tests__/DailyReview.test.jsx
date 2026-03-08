import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DailyReview from '../components/DailyReview';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

vi.mock('../utils/images', () => ({
  getImageUrl: (word) => `/images/${word.id}.webp`,
}));

const makeWords = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `word${i}`,
    word: `Word${i}`,
    level: 'beginner',
    category: 'animals',
  }));

const defaultProps = {
  words: makeWords(3),
  stats: { wordProgress: {} },
  lang: 'en',
  canRead: true,
  onComplete: vi.fn(),
  onBack: vi.fn(),
};

describe('DailyReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the daily review header and progress', () => {
    render(<DailyReview {...defaultProps} />);
    expect(screen.getByText('Daily Review')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
    expect(screen.getByText(/Question 1/)).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<DailyReview {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders answer options for the current word', () => {
    render(<DailyReview {...defaultProps} />);
    // Should have 4 option buttons (1 correct + 3 distractors)
    const buttons = screen.getAllByRole('button').filter(
      (btn) => !btn.getAttribute('aria-label') && btn.textContent !== 'Skip this word'
    );
    expect(buttons.length).toBe(4);
  });

  it('shows skip button when unanswered', () => {
    render(<DailyReview {...defaultProps} />);
    expect(screen.getByText('Skip this word')).toBeInTheDocument();
  });
});

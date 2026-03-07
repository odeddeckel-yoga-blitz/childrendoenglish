import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProgressDashboard from '../components/ProgressDashboard';

const defaultProps = {
  stats: {
    wordProgress: { cat: { interval: 14, lastSeen: Date.now() }, dog: { interval: 3, lastSeen: Date.now() } },
    currentStreak: 3,
    longestStreak: 7,
    totalQuizzes: 10,
    badges: [],
    unlockedLevels: ['beginner'],
    bestScores: {},
    quizHistory: [
      { mode: 'image', level: 'beginner', score: 8, total: 10, date: new Date().toISOString() },
    ],
  },
  lang: 'en',
  onBack: vi.fn(),
};

describe('ProgressDashboard', () => {
  it('renders the progress heading', () => {
    render(<ProgressDashboard {...defaultProps} />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<ProgressDashboard {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('shows stats: streak, words seen, mastered', () => {
    render(<ProgressDashboard {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // currentStreak
    expect(screen.getByText('2')).toBeInTheDocument(); // wordsLearned
    expect(screen.getByText('1')).toBeInTheDocument(); // wordsMastered (cat interval >= 14)
  });
});

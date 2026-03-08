import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ParentDashboard from '../components/ParentDashboard';

vi.mock('../utils/storage', () => ({
  loadStats: (_id) => ({
    wordProgress: { cat: { interval: 14 }, dog: { interval: 3 } },
    totalQuizzes: 5,
    currentStreak: 2,
    longestStreak: 4,
    badges: [],
    unlockedLevels: ['beginner'],
    bestScores: {},
    quizHistory: [],
  }),
}));

const defaultProps = {
  players: [
    { id: '1', name: 'Alex', avatar: '🦊', canRead: true },
    { id: '2', name: 'Sam', avatar: '🐱', canRead: false },
  ],
  lang: 'en',
  onBack: vi.fn(),
};

describe('ParentDashboard', () => {
  it('renders the dashboard header', () => {
    render(<ParentDashboard {...defaultProps} />);
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<ParentDashboard {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders player cards with names and avatars', () => {
    render(<ParentDashboard {...defaultProps} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('shows empty state when no players provided', () => {
    render(<ParentDashboard {...defaultProps} players={[]} />);
    expect(screen.getByText('No players found')).toBeInTheDocument();
  });
});

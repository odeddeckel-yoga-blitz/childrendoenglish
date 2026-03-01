import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Menu from '../components/Menu';

const defaultStats = {
  totalQuizzes: 5,
  badges: ['first-quiz'],
  wordProgress: { cat: { interval: 14 }, dog: { interval: 3 } },
  dailyGoal: { date: new Date().toISOString().slice(0, 10), wordsReviewed: 3 },
  currentStreak: 2,
  longestStreak: 5,
};

const defaultProps = {
  stats: defaultStats,
  darkMode: false,
  soundEnabled: true,
  lang: 'en',
  activePlayer: { id: '1', name: 'Alex', avatar: '🦊', canRead: true },
  playerCount: 1,
  showInstallBanner: false,
  onInstall: vi.fn(),
  onDismissInstall: vi.fn(),
  onNavigate: vi.fn(),
  onToggleDark: vi.fn(),
  onToggleSound: vi.fn(),
  onOpenProfilePicker: vi.fn(),
};

describe('Menu', () => {
  it('renders the app name and tagline', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Children Do English')).toBeInTheDocument();
    expect(screen.getByText('Build your vocabulary!')).toBeInTheDocument();
  });

  it('shows active player name', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText(/Playing as Alex/)).toBeInTheDocument();
  });

  it('navigates to learn mode on button click', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Learn Words'));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('learning');
  });

  it('navigates to quiz on button click', () => {
    render(<Menu {...defaultProps} />);
    fireEvent.click(screen.getByText('Play Quiz'));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('levelSelect');
  });

  it('renders dark mode toggle', () => {
    render(<Menu {...defaultProps} />);
    const btn = screen.getByLabelText('Dark mode');
    fireEvent.click(btn);
    expect(defaultProps.onToggleDark).toHaveBeenCalled();
  });

  it('renders quick stats with correct values', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument(); // totalQuizzes
  });

  it('shows learning path button', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Learning Path')).toBeInTheDocument();
  });

  it('shows parent dashboard link', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
  });

  it('renders in Hebrew when lang=he', () => {
    render(<Menu {...defaultProps} lang="he" />);
    expect(screen.getByText('ילדים עושים אנגלית')).toBeInTheDocument();
  });
});

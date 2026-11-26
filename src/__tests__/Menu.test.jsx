import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Menu from '../components/Menu';
import { loadHebrew } from '../utils/i18n';

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
  onQuickStart: vi.fn(),
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

  it('does not render the removed quick-stats card or Parent Dashboard card', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.queryByText('Mastered')).not.toBeInTheDocument();
    // Parent Dashboard survives only as the small footer link
    expect(screen.getAllByText('Parent Dashboard')).toHaveLength(1);
  });

  it('shows learning path button', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getByText('Learning Path')).toBeInTheDocument();
  });

  it('shows parent dashboard link', () => {
    render(<Menu {...defaultProps} />);
    expect(screen.getAllByText('Parent Dashboard').length).toBeGreaterThanOrEqual(1);
  });

  it('leads with the learning-cycle Continue card; clicking starts the cycle', () => {
    // The cycle hero replaced the old new-user quick-start (2026-10-05):
    // one obvious continue action instead of a menu of equal doors.
    const onContinueCycle = vi.fn();
    const onNavigate = vi.fn();
    const newUserStats = { ...defaultStats, totalQuizzes: 0, wordProgress: {} };
    render(<Menu {...defaultProps} stats={newUserStats} onContinueCycle={onContinueCycle}
      cycleInfo={{ batch: 0, stage: 0, label: 'A', stages: 3, mastered: 0, totalBatches: 48, isNew: true }}
      onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText(/Word batch 1/));
    expect(onContinueCycle).toHaveBeenCalled();
    // The regular quiz card now always routes to level select
    fireEvent.click(screen.getByText('Play Quiz'));
    expect(onNavigate).toHaveBeenCalledWith('levelSelect');
  });

  describe('returning home (homeNext prop; owner D4 11-26: every returning player, no split)', () => {
    const base = {
      learned: 12, name: 'Maya', gameName: '', isNew: false,
      path: { num: 2, label: 'B', step: 2, total: 5, mode: 'Listen & Pick', starter: false },
      onNext: vi.fn(), onNotMe: vi.fn(), onOpenPath: vi.fn(),
    };
    const mreq = { ...base, next: { kind: 'mreq', words: [{ id: 'cat' }, { id: 'dog' }, { id: 'sun' }] } };

    it('a first visit (no homeNext) keeps the Continue hero and no Next card', () => {
      render(<Menu {...defaultProps} onContinueCycle={vi.fn()} cycleInfo={{ batch: 1, stage: 1, label: 'B', stages: 5, mastered: 0, totalBatches: 48 }} />);
      expect(screen.queryByTestId('next-card')).not.toBeInTheDocument();
      expect(screen.getByText('Continue learning')).toBeInTheDocument();
      expect(screen.getByText('0 words mastered')).toBeInTheDocument();
    });

    it('missed words: names the player, starts the re-quiz, Not me opens the picker', () => {
      const onNext = vi.fn(); const onNotMe = vi.fn();
      render(<Menu {...defaultProps} onContinueCycle={vi.fn()} homeNext={{ ...mreq, onNext, onNotMe }} />);
      const card = screen.getByTestId('next-card');
      expect(card).toHaveAttribute('data-kind', 'mreq');
      expect(card.textContent).toContain('Words for Maya to try again');
      expect(card.textContent).toContain('A quick quiz with 3 words');
      fireEvent.click(screen.getByTestId('not-me'));
      expect(onNotMe).toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText(/Words for/));
      expect(onNext).toHaveBeenCalled();
      // no Continue hero, no "mastered" line; the path stays one tap away
      expect(screen.queryByText('Continue learning')).not.toBeInTheDocument();
      expect(screen.queryByText(/words mastered/)).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('path-line'));
      expect(base.onOpenPath).toHaveBeenCalled();
    });

    it('path and game kinds', () => {
      const { unmount } = render(<Menu {...defaultProps} homeNext={{ ...base, next: { kind: 'path' } }} />);
      expect(screen.getByTestId('next-card').textContent).toMatch(/Word batch 2.*Step 2 of 5: Listen & Pick/);
      expect(screen.queryByTestId('path-line')).not.toBeInTheDocument();
      unmount();
      render(<Menu {...defaultProps} homeNext={{ ...base, gameName: 'Missing Letter', next: { kind: 'game', game: 'missing-letter' } }} />);
      const card = screen.getByTestId('next-card');
      expect(card).toHaveAttribute('href', '/games/missing-letter/');
      expect(card.textContent).toContain('Try a new game: Missing Letter');
    });

    it('"N words learned", with an encouraging line instead of 0', () => {
      const { unmount } = render(<Menu {...defaultProps} homeNext={{ ...base, next: { kind: 'path' } }} />);
      expect(screen.getByTestId('words-learned').textContent).toBe('12 words learned');
      unmount();
      render(<Menu {...defaultProps} homeNext={{ ...base, learned: 0, next: { kind: 'path' } }} />);
      expect(screen.getByTestId('words-learned').textContent).toBe('Every word you try helps you learn!');
    });

    it('More holds 6 items (was 8); My Word List and Learning Path move under For grown-ups', () => {
      const { unmount } = render(<Menu {...defaultProps} todayCount={12} />);
      expect(screen.getByTestId('menu-more').querySelectorAll(':scope > div button')).toHaveLength(8);
      unmount();
      render(<Menu {...defaultProps} todayCount={12} homeNext={{ ...base, next: { kind: 'path' } }} />);
      const more = screen.getByTestId('menu-more');
      expect(more.querySelectorAll(':scope > div button')).toHaveLength(6);
      expect(more.textContent).not.toContain('My Word List');
      const grown = screen.getByText(/For grown-ups/).closest('details');
      expect(grown.textContent).toContain('My Word List');
      expect(grown.textContent).toContain('Learning Path');
    });
  });

  it('a mixed batch (no letter label) is titled by its number only, never "letter A"', () => {
    const { unmount } = render(<Menu {...defaultProps} onContinueCycle={vi.fn()}
      cycleInfo={{ batch: 0, stage: 0, label: '', stages: 5, mastered: 0, totalBatches: 57 }} />);
    expect(screen.getByText('Word batch 1')).toBeInTheDocument();
    expect(screen.queryByText(/Word batch 1 — letter/)).not.toBeInTheDocument();
    unmount();
    render(<Menu {...defaultProps} homeNext={{ learned: 0, name: 'Maya', gameName: '', isNew: false, next: { kind: 'path' },
      path: { num: 3, label: '', step: 1, total: 5, mode: 'Flashcards', starter: false }, onNext: vi.fn(), onNotMe: vi.fn(), onOpenPath: vi.fn() }} />);
    expect(screen.getByTestId('next-card').textContent).toContain('Word batch 3');
    expect(screen.getByTestId('next-card').textContent).not.toContain('letter');
  });

  it('renders in Hebrew when lang=he', async () => {
    await loadHebrew();
    render(<Menu {...defaultProps} lang="he" />);
    expect(screen.getByText('ילדים עושים אנגלית')).toBeInTheDocument();
  });
});

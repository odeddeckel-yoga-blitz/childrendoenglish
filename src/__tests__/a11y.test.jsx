import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Menu from '../components/Menu';
import LearnMode from '../components/LearnMode';

const menuProps = {
  stats: {
    totalQuizzes: 5,
    badges: ['first-quiz'],
    wordProgress: { cat: { interval: 14 }, dog: { interval: 3 } },
    dailyGoal: { date: new Date().toISOString().slice(0, 10), wordsReviewed: 3 },
    currentStreak: 2,
    longestStreak: 5,
  },
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

const learnModeProps = {
  stats: { wordProgress: { cat: { interval: 14 }, dog: { interval: 3 } } },
  lang: 'en',
  canRead: true,
  onBack: vi.fn(),
};

describe('Accessibility (axe)', () => {
  it('Menu has no a11y violations', async () => {
    const { container } = render(<Menu {...menuProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LearnMode has no a11y violations', async () => {
    const { container } = render(<LearnMode {...learnModeProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
});

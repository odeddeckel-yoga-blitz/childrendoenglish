import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultScreen from '../components/ResultScreen';

// Mock sound module
vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

const defaultProps = {
  results: { score: 8, total: 10, answers: [] },
  lang: 'en',
  level: 'beginner',
  mode: 'image',
  onPlayAgain: vi.fn(),
  onMenu: vi.fn(),
};

describe('ResultScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders score correctly', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
  });

  it('renders only the simplified action buttons (Play Again, Back to Menu)', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.getByText('Back to Menu')).toBeInTheDocument();
    // Removed in the UX simplification — must NOT come back
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Mode')).not.toBeInTheDocument();
    expect(screen.queryByText(/Try .* next!/)).not.toBeInTheDocument();
  });

  it('calls onPlayAgain when Play Again clicked', () => {
    render(<ResultScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('Play Again'));
    expect(defaultProps.onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('calls onMenu when Back to Menu clicked', () => {
    render(<ResultScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('Back to Menu'));
    expect(defaultProps.onMenu).toHaveBeenCalledTimes(1);
  });

  it('shows answer review section when answers provided', () => {
    const props = {
      ...defaultProps,
      results: {
        score: 1,
        total: 2,
        answers: [
          { wordId: 'cat', correct: true },
          { wordId: 'dog', correct: false, selected: 'cat' },
        ],
      },
    };
    render(<ResultScreen {...props} />);
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.getByText('dog')).toBeInTheDocument();
  });
});

describe('ResultScreen arcade layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const arcadeProps = {
    ...defaultProps,
    results: {
      score: 8,
      total: 10,
      answers: [],
      arcade: { score: 120, bestStreak: 4, fastAnswers: 6 },
      arcadeNewBest: true,
      newCritters: ['fox'],
    },
    canRead: true,
    onLightning: vi.fn(),
  };

  it('shows this-run arcade stats and the new-best banner', () => {
    render(<ResultScreen {...arcadeProps} />);
    expect(screen.getByText('⭐ 120')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('★ NEW BEST SCORE!')).toBeInTheDocument();
  });

  it('shows the hatched critter card', () => {
    render(<ResultScreen {...arcadeProps} />);
    expect(screen.getByText(/You hatched Foxy!/)).toBeInTheDocument();
  });

  it('offers the Lightning Round and calls onLightning', () => {
    render(<ResultScreen {...arcadeProps} />);
    const btn = screen.getByText(/Lightning — how many in 60 seconds\?/);
    fireEvent.click(btn);
    expect(arcadeProps.onLightning).toHaveBeenCalledTimes(1);
  });

  it('hides the Lightning Round for pre-readers (canRead false)', () => {
    render(<ResultScreen {...arcadeProps} canRead={false} />);
    expect(screen.queryByText(/Lightning — how many/)).not.toBeInTheDocument();
  });

  it('hides the Lightning Round after a quit', () => {
    render(
      <ResultScreen
        {...arcadeProps}
        results={{ ...arcadeProps.results, quit: true, newCritters: [] }}
      />
    );
    expect(screen.queryByText(/Lightning — how many/)).not.toBeInTheDocument();
  });

  it('renders without arcade data (legacy results)', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.queryByText('★ NEW BEST SCORE!')).not.toBeInTheDocument();
  });
});

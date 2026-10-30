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

  it('a good free quiz: one primary "Next quiz", plus Back to Menu', () => {
    render(<ResultScreen {...defaultProps} />);
    const prim = document.querySelectorAll('[data-kdm-primary]');
    expect(prim).toHaveLength(1);
    expect(prim[0]).toHaveTextContent('Next quiz');
    expect(screen.getByText('Back to Menu')).toBeInTheDocument();
    // Removed in the UX simplification — must NOT come back
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Mode')).not.toBeInTheDocument();
    expect(screen.queryByText(/Try .* next!/)).not.toBeInTheDocument();
  });

  it('calls onPlayAgain when the good-score primary is clicked', () => {
    render(<ResultScreen {...defaultProps} />);
    fireEvent.click(screen.getByText(/Next quiz/));
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
        results={{ ...arcadeProps.results, quit: true }}
      />
    );
    expect(screen.queryByText(/Lightning — how many/)).not.toBeInTheDocument();
  });

  it('renders without arcade data (legacy results)', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText(/Next quiz/)).toBeInTheDocument();
    expect(screen.queryByText('★ NEW BEST SCORE!')).not.toBeInTheDocument();
  });

  it('offers a rename to a player who skipped the name, then hides it', () => {
    const onSave = vi.fn();
    render(<ResultScreen {...defaultProps} namePrompt={{ onSave }} />);
    fireEvent.change(screen.getByLabelText('Nice playing! What’s your name?'), { target: { value: 'Dana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('Dana');
    expect(screen.queryByLabelText('Nice playing! What’s your name?')).toBeNull();
  });

  it('no rename offer after a quit', () => {
    render(<ResultScreen {...defaultProps} results={{ score: 1, total: 10, answers: [], quit: true }} namePrompt={{ onSave: vi.fn() }} />);
    expect(screen.queryByLabelText('Nice playing! What’s your name?')).toBeNull();
  });

  // Persona standard P1 + CUX3/CUX6: one primary picked by the score.
  it('a low score: the one primary is "same words again", the ladder does not advance', () => {
    const onRetrySame = vi.fn(), next = vi.fn();
    render(<ResultScreen {...defaultProps} results={{ score: 2, total: 10, answers: [] }}
      onRetrySame={onRetrySame} cycleNext={{ label: 'Next: Word quiz →', onClick: next }}
      namePrompt={{ onSave: vi.fn() }} />);
    const prim = document.querySelectorAll('[data-kdm-primary]');
    expect(prim).toHaveLength(1);
    expect(prim[0]).toHaveTextContent('Again — same words');
    fireEvent.click(prim[0]);
    expect(onRetrySame).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Next: Word quiz →')).toBeNull();
    expect(screen.getByText('Get 7 of 10 right to move on')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nice playing! What’s your name?')).toBeNull();
    expect(next).not.toHaveBeenCalled();
  });

  it('a pass in the ladder: the one primary is the next step; the rest sit under More choices', () => {
    const next = vi.fn();
    render(<ResultScreen {...defaultProps} results={{ score: 7, total: 10, answers: [] }}
      onRetrySame={vi.fn()} cycleNext={{ label: 'Next: Word quiz →', onClick: next }} />);
    const prim = document.querySelectorAll('[data-kdm-primary]');
    expect(prim).toHaveLength(1);
    expect(prim[0]).toHaveTextContent('Next: Word quiz →');
    expect(screen.getByText('Play Again').closest('details')).not.toBeNull();
    fireEvent.click(prim[0]);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

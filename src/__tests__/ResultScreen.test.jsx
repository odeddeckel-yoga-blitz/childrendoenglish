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
  stats: { badges: [] },
  lang: 'en',
  level: 'beginner',
  mode: 'image',
  onPlayAgain: vi.fn(),
  onChangeMode: vi.fn(),
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

  it('shows "Amazing!" message for high percentage (90%+)', () => {
    const props = {
      ...defaultProps,
      results: { score: 9, total: 10, answers: [] },
    };
    render(<ResultScreen {...props} />);
    expect(screen.getByText('Amazing!')).toBeInTheDocument();
  });

  it('shows "Keep practicing!" message for low percentage (<50%)', () => {
    const props = {
      ...defaultProps,
      results: { score: 3, total: 10, answers: [] },
    };
    render(<ResultScreen {...props} />);
    expect(screen.getByText('Keep practicing!')).toBeInTheDocument();
  });

  it('renders confetti for perfect score', () => {
    const props = {
      ...defaultProps,
      results: { score: 10, total: 10, answers: [] },
    };
    const { container } = render(<ResultScreen {...props} />);
    const confettiContainer = container.querySelector('.confetti-container');
    expect(confettiContainer).toBeInTheDocument();
    const pieces = container.querySelectorAll('.confetti-piece');
    expect(pieces.length).toBe(30);
  });

  it('renders action buttons (Play Again, Share, Change Mode, Back to Menu)', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Change Mode')).toBeInTheDocument();
    expect(screen.getByText('Back to Menu')).toBeInTheDocument();
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

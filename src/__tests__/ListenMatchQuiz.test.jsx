import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListenMatchQuiz from '../components/ListenMatchQuiz';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

import { WORDS } from '../data/words';

const testWords = WORDS.slice(0, 10);

const defaultProps = {
  words: testWords,
  lang: 'en',
  soundEnabled: true,
  onToggleSound: vi.fn(),
  onComplete: vi.fn(),
  onQuit: vi.fn(),
};

describe('ListenMatchQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quiz header with score', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('displays the current word', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    const word = testWords[0].word;
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it('renders speaker button', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    expect(screen.getByLabelText('Tap to hear again')).toBeInTheDocument();
  });

  it('renders 4 image options', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(4);
  });

  it('renders images with alt text', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img.getAttribute('alt')).toBeTruthy();
    });
  });

  it('shows skip button', () => {
    render(<ListenMatchQuiz {...defaultProps} />);
    expect(screen.getByText('Skip this word')).toBeInTheDocument();
  });
});

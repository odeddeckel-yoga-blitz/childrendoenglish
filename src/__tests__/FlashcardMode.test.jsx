import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlashcardMode from '../components/FlashcardMode';
import { spacedRepetitionSort } from '../utils/spaced-repetition';

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

// Wrap spaced-repetition so we can override in the finished-state test
vi.mock('../utils/spaced-repetition', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    spacedRepetitionSort: vi.fn((...args) => actual.spacedRepetitionSort(...args)),
  };
});

const defaultProps = {
  stats: { wordProgress: {} },
  lang: 'en',
  canRead: true,
  onUpdateStats: vi.fn(),
  onBack: vi.fn(),
};

describe('FlashcardMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the real implementation for most tests
    spacedRepetitionSort.mockImplementation(
      (...args) => {
        // Use inline re-implementation of the sort to avoid circular import
        const [words, wordProgress] = args;
        const now = Date.now();
        const DAY = 86400000;
        return [...words].sort((a, b) => {
          const cardA = wordProgress[a.id];
          const cardB = wordProgress[b.id];
          const scoreA = !cardA ? 1 : ((now - cardA.lastSeen) / DAY >= cardA.interval ? 2 : 0);
          const scoreB = !cardB ? 1 : ((now - cardB.lastSeen) / DAY >= cardB.interval ? 2 : 0);
          if (scoreA !== scoreB) return scoreB - scoreA;
          return Math.random() - 0.5;
        });
      }
    );
  });

  it('renders flashcard progress bar', () => {
    render(<FlashcardMode {...defaultProps} />);
    expect(screen.getByRole('progressbar', { name: 'Flashcard progress' })).toBeInTheDocument();
  });

  it('shows card counter (1 / N)', () => {
    render(<FlashcardMode {...defaultProps} />);
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
  });

  it('hides Know It and Still Learning buttons before flip', () => {
    render(<FlashcardMode {...defaultProps} />);
    expect(screen.queryByText('Know It')).not.toBeInTheDocument();
    expect(screen.queryByText('Still Learning')).not.toBeInTheDocument();
  });

  it('shows buttons and swipe hint after flipping card', () => {
    render(<FlashcardMode {...defaultProps} />);
    // Click the card to flip it
    fireEvent.click(screen.getByRole('button', { name: /flip/i }));
    expect(screen.getByText('Know It')).toBeInTheDocument();
    expect(screen.getByText('Still Learning')).toBeInTheDocument();
    expect(screen.getByText('Swipe right = Know it, Swipe left = Still learning')).toBeInTheDocument();
  });

  it('renders back button with aria-label', () => {
    render(<FlashcardMode {...defaultProps} />);
    expect(screen.getByLabelText('Back to menu')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    render(<FlashcardMode {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('shows finished state when cards exhausted', () => {
    spacedRepetitionSort.mockReturnValue([]);
    render(<FlashcardMode {...defaultProps} />);
    expect(screen.getByText('No cards to review!')).toBeInTheDocument();
  });

  it('shows custom word count when words prop is provided', () => {
    const makeWord = (id, word) => ({
      id, word, definition: `A ${word}`, phonetic: `/${word}/`,
      exampleSentence: `I see a ${word}.`, hebrewTranslation: word,
      category: 'test', imageUrl: `/img/${word}.webp`,
    });
    const words = [makeWord('cat', 'cat'), makeWord('dog', 'dog'), makeWord('bird', 'bird')];
    render(
      <FlashcardMode
        stats={{ wordProgress: {} }}
        words={words}
        onUpdateStats={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});

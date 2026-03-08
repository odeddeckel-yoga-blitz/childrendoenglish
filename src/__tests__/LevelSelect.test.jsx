import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LevelSelect from '../components/LevelSelect';

const defaultProps = {
  stats: {
    unlockedLevels: ['beginner', 'intermediate'],
    bestScores: { beginner: 8 },
    totalQuizzes: 0,
    currentStreak: 0,
    wordProgress: {},
    badges: [],
  },
  lang: 'en',
  canRead: true,
  onStartQuiz: vi.fn(),
  onBack: vi.fn(),
};

describe('LevelSelect', () => {
  it('renders the play quiz heading', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('Play Quiz')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<LevelSelect {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders three levels as tabs', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('renders quiz mode cards', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('Image Quiz')).toBeInTheDocument();
    expect(screen.getByText('Word Quiz')).toBeInTheDocument();
    expect(screen.getByText('Audio Quiz')).toBeInTheDocument();
    expect(screen.getByText('Listen & Match')).toBeInTheDocument();
  });

  it('calls onStartQuiz with level and mode when mode clicked', () => {
    render(<LevelSelect {...defaultProps} />);
    fireEvent.click(screen.getByText('Image Quiz'));
    expect(defaultProps.onStartQuiz).toHaveBeenCalledWith('intermediate', 'image');
  });
});

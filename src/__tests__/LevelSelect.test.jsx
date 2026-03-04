import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LevelSelect from '../components/LevelSelect';

const defaultProps = {
  stats: {
    unlockedLevels: ['beginner', 'intermediate'],
    bestScores: { beginner: 8 },
  },
  lang: 'en',
  onSelect: vi.fn(),
  onBack: vi.fn(),
};

describe('LevelSelect', () => {
  it('renders the choose level heading', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('Choose Level')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<LevelSelect {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders three levels', () => {
    render(<LevelSelect {...defaultProps} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('calls onSelect with level id when unlocked level clicked', () => {
    render(<LevelSelect {...defaultProps} />);
    fireEvent.click(screen.getByText('Beginner'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('beginner');
  });
});

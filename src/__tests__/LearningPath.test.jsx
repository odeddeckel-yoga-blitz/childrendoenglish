import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LearningPath from '../components/LearningPath';

const defaultProps = {
  stats: { wordProgress: {} },
  lang: 'en',
  onBack: vi.fn(),
  onStartLesson: vi.fn(),
  onLearnLesson: vi.fn(),
};

describe('LearningPath', () => {
  it('renders heading and description', () => {
    render(<LearningPath {...defaultProps} />);
    expect(screen.getByText('Learning Path')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<LearningPath {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders lesson cards with Learn Words and Play Quiz buttons', () => {
    render(<LearningPath {...defaultProps} />);
    const learnButtons = screen.getAllByText('Learn Words');
    const quizButtons = screen.getAllByText('Play Quiz');
    expect(learnButtons.length).toBeGreaterThan(0);
    expect(quizButtons.length).toBeGreaterThan(0);
  });

  it('calls onStartLesson when Play Quiz is clicked on a lesson', () => {
    render(<LearningPath {...defaultProps} />);
    const quizButtons = screen.getAllByText('Play Quiz');
    fireEvent.click(quizButtons[0]);
    expect(defaultProps.onStartLesson).toHaveBeenCalled();
  });
});

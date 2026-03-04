import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssessmentFlow from '../components/AssessmentFlow';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

vi.mock('../utils/images', () => ({
  getImageUrl: (word) => `/images/${word.id}.webp`,
}));

const defaultProps = {
  lang: 'en',
  onComplete: vi.fn(),
  onSkip: vi.fn(),
};

describe('AssessmentFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assessment header', () => {
    render(<AssessmentFlow {...defaultProps} />);
    expect(screen.getByText('Quick Assessment')).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<AssessmentFlow {...defaultProps} />);
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('calls onSkip when skip button clicked', () => {
    render(<AssessmentFlow {...defaultProps} />);
    const skipBtn = screen.getByText('Skip');
    skipBtn.click();
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });

  it('shows question counter starting at 1 of 15', () => {
    render(<AssessmentFlow {...defaultProps} />);
    expect(screen.getByText(/Question/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });
});

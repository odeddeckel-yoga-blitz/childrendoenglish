import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Onboarding from '../components/Onboarding';

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
  onComplete: vi.fn(),
  activePlayer: { id: '1', name: 'Alex', avatar: '🦊' },
  lang: 'en',
};

describe('Onboarding', () => {
  it('renders welcome step on step 0', () => {
    render(<Onboarding {...defaultProps} />);
    expect(screen.getByText('Welcome, Alex!')).toBeInTheDocument();
  });

  it('shows skip onboarding button', () => {
    render(<Onboarding {...defaultProps} />);
    expect(screen.getByLabelText('Skip onboarding')).toBeInTheDocument();
  });

  it('calls onComplete when skip button clicked', () => {
    const props = { ...defaultProps, onComplete: vi.fn() };
    render(<Onboarding {...props} />);
    fireEvent.click(screen.getByLabelText('Skip onboarding'));
    expect(props.onComplete).toHaveBeenCalled();
  });

  it('finishes onboarding after demo step', () => {
    const props = { ...defaultProps, onComplete: vi.fn() };
    render(<Onboarding {...props} />);
    // Step 0 (welcome) -> 1: next
    fireEvent.click(screen.getByLabelText('Next step'));
    // Step 1 (see & learn) -> 2: next
    fireEvent.click(screen.getByLabelText('Next step'));
    // Step 2 (demo): next finishes onboarding
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(props.onComplete).toHaveBeenCalled();
  });
});

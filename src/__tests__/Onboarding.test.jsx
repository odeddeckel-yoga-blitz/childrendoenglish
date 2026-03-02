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
  onSelectLanguage: vi.fn(),
  activePlayer: { id: '1', name: 'Alex', avatar: '🦊' },
};

describe('Onboarding', () => {
  it('renders language picker on step 0', () => {
    render(<Onboarding {...defaultProps} />);
    expect(screen.getByText('What language do you speak?')).toBeInTheDocument();
  });

  it('shows "English" and "עברית" buttons', () => {
    render(<Onboarding {...defaultProps} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('עברית (Hebrew)')).toBeInTheDocument();
  });

  it('clicking English advances to welcome step', () => {
    render(<Onboarding {...defaultProps} />);
    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('Welcome, Alex!')).toBeInTheDocument();
  });

  it('shows skip onboarding button', () => {
    render(<Onboarding {...defaultProps} />);
    expect(screen.getByLabelText('Skip onboarding')).toBeInTheDocument();
  });

  it('calls onComplete when skip button clicked', () => {
    const props = { ...defaultProps, onComplete: vi.fn(), onSelectLanguage: vi.fn() };
    render(<Onboarding {...props} />);
    fireEvent.click(screen.getByLabelText('Skip onboarding'));
    expect(props.onComplete).toHaveBeenCalled();
  });

  it('finishes onboarding after demo step', () => {
    const props = { ...defaultProps, onComplete: vi.fn(), onSelectLanguage: vi.fn() };
    render(<Onboarding {...props} />);
    // Step 0 -> 1: pick language
    fireEvent.click(screen.getByText('English'));
    // Step 1 -> 2: next
    fireEvent.click(screen.getByLabelText('Next step'));
    // Step 2 -> 3: next
    fireEvent.click(screen.getByLabelText('Next step'));
    // Step 3: next finishes onboarding
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(props.onComplete).toHaveBeenCalled();
  });
});

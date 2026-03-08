import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '../components/LandingPage';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

const defaultProps = {
  lang: 'en',
  activePlayer: null,
  onGetStarted: vi.fn(),
  onContinue: vi.fn(),
  onPrivacy: vi.fn(),
};

describe('LandingPage', () => {
  it('renders hero with CTA button', () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText('Learn English — The Fun Way!')).toBeInTheDocument();
    expect(screen.getAllByText("Let's Get Started")[0]).toBeInTheDocument();
  });

  it('shows "Welcome back" when activePlayer provided', () => {
    const activePlayer = { id: '1', name: 'Alex', avatar: '🦊' };
    render(<LandingPage {...defaultProps} activePlayer={activePlayer} />);
    expect(screen.getByText('Welcome back, Alex!')).toBeInTheDocument();
  });

  it('calls onGetStarted when CTA clicked', () => {
    const onGetStarted = vi.fn();
    render(<LandingPage {...defaultProps} onGetStarted={onGetStarted} />);
    fireEvent.click(screen.getAllByText("Let's Get Started")[0]);
    expect(onGetStarted).toHaveBeenCalled();
  });
});

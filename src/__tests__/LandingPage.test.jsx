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
  onLanguageStart: vi.fn(),
  onContinue: vi.fn(),
  onPrivacy: vi.fn(),
  onToggleLanguage: vi.fn(),
};

describe('LandingPage', () => {
  it('renders hero with language selection', () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText('Learn English — The Fun Way!')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getAllByText('עברית').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Welcome back" when activePlayer provided', () => {
    const activePlayer = { id: '1', name: 'Alex', avatar: '🦊' };
    render(<LandingPage {...defaultProps} activePlayer={activePlayer} />);
    expect(screen.getByText('Welcome back, Alex!')).toBeInTheDocument();
  });

  it('calls onLanguageStart when language card clicked', () => {
    const onLanguageStart = vi.fn();
    render(<LandingPage {...defaultProps} onLanguageStart={onLanguageStart} />);
    fireEvent.click(screen.getByText('English'));
    expect(onLanguageStart).toHaveBeenCalledWith('en');
  });
});

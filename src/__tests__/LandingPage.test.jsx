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
  onLanguageStart: vi.fn(),
  onPrivacy: vi.fn(),
  onTerms: vi.fn(),
  onToggleLanguage: vi.fn(),
};

describe('LandingPage', () => {
  it('renders hero with language selection', () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText('Learn English — The Fun Way!')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getAllByText('עברית').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onTerms when Terms of Service clicked', () => {
    const onTerms = vi.fn();
    render(<LandingPage {...defaultProps} onTerms={onTerms} />);
    fireEvent.click(screen.getByText('Terms of Service'));
    expect(onTerms).toHaveBeenCalledTimes(1);
  });

  it('calls onLanguageStart when language card clicked', () => {
    const onLanguageStart = vi.fn();
    render(<LandingPage {...defaultProps} onLanguageStart={onLanguageStart} />);
    fireEvent.click(screen.getByText('English'));
    expect(onLanguageStart).toHaveBeenCalledWith('en');
  });
});

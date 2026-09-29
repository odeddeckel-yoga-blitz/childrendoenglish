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
  onSelectLanguage: vi.fn(),
};

describe('LandingPage', () => {
  it('renders hero with language selection', () => {
    render(<LandingPage {...defaultProps} />);
    expect(screen.getByText('Learn English — The Fun Way!')).toBeInTheDocument();
    // "English" appears in both the top-bar picker and the hero tile
    expect(screen.getAllByText('English').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('עברית').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Español').length).toBeGreaterThanOrEqual(1);
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
    // Target the hero TILE (its subtitle is unique), not the top-bar picker
    fireEvent.click(screen.getByText('Learn vocabulary in English').closest('button'));
    expect(onLanguageStart).toHaveBeenCalledWith('en');
  });

  it('starts Spanish from its hero tile', () => {
    const onLanguageStart = vi.fn();
    render(<LandingPage {...defaultProps} onLanguageStart={onLanguageStart} />);
    fireEvent.click(screen.getByText('Interfaz en español').closest('button'));
    expect(onLanguageStart).toHaveBeenCalledWith('es');
  });
});

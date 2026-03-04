import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CookieConsent from '../components/CookieConsent';

const defaultProps = {
  lang: 'en',
  onAccept: vi.fn(),
  onDecline: vi.fn(),
};

describe('CookieConsent', () => {
  it('renders the consent dialog', () => {
    render(<CookieConsent {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders Accept and Decline buttons', () => {
    render(<CookieConsent {...defaultProps} />);
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  it('calls onAccept when Accept clicked', () => {
    render(<CookieConsent {...defaultProps} />);
    fireEvent.click(screen.getByText('Accept'));
    expect(defaultProps.onAccept).toHaveBeenCalled();
  });

  it('calls onDecline when Decline clicked', () => {
    render(<CookieConsent {...defaultProps} />);
    fireEvent.click(screen.getByText('Decline'));
    expect(defaultProps.onDecline).toHaveBeenCalled();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivacyPolicy from '../components/PrivacyPolicy';

const defaultProps = {
  lang: 'en',
  onBack: vi.fn(),
};

describe('PrivacyPolicy', () => {
  it('renders the privacy policy heading', () => {
    render(<PrivacyPolicy {...defaultProps} />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders back button and calls onBack', () => {
    render(<PrivacyPolicy {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Back to menu'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders all privacy policy sections', () => {
    render(<PrivacyPolicy {...defaultProps} />);
    expect(screen.getByText('What data we collect')).toBeInTheDocument();
    expect(screen.getByText('What is stored on your device')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});

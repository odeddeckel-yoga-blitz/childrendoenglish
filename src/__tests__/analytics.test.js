import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('analytics', () => {
  let needsConsentPrompt, setAnalyticsConsent, hasAnalyticsConsent, trackEvent;

  beforeEach(async () => {
    localStorage.clear();
    window.gtag = undefined;

    // Reset modules so the internal gaLoaded flag starts fresh each test
    vi.resetModules();
    const mod = await import('../utils/analytics');
    needsConsentPrompt = mod.needsConsentPrompt;
    setAnalyticsConsent = mod.setAnalyticsConsent;
    hasAnalyticsConsent = mod.hasAnalyticsConsent;
    trackEvent = mod.trackEvent;
  });

  it('needsConsentPrompt returns true when no consent stored', () => {
    expect(needsConsentPrompt()).toBe(true);
  });

  it('setAnalyticsConsent stores the value', () => {
    // Provide window.gtag so loadGA() does not throw
    window.gtag = vi.fn();
    setAnalyticsConsent(true);
    expect(localStorage.getItem('childrendoenglish-analytics-consent')).toBe('accepted');
  });

  it('hasAnalyticsConsent returns true after accepting', () => {
    window.gtag = vi.fn();
    setAnalyticsConsent(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('trackEvent does nothing when no consent', () => {
    window.gtag = vi.fn();
    trackEvent('test_event', { foo: 'bar' });
    expect(window.gtag).not.toHaveBeenCalled();
  });
});

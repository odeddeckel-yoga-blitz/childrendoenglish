export const trackEvent = (name, params = {}) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, params);
    }
  } catch {
    // Silent fallback
  }
};

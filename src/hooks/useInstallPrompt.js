import { useState, useEffect, useRef, useCallback } from 'react';
import { analytics } from '../utils/analytics';

export default function useInstallPrompt({ gameState, totalQuizzes }) {
  const deferredPrompt = useRef(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (gameState === 'menu' && totalQuizzes >= 1 && deferredPrompt.current && !localStorage.getItem('childrendoenglish-install-dismissed')) {
      setShowInstallBanner(true);
    } else {
      setShowInstallBanner(false);
    }
  }, [gameState, totalQuizzes]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setShowInstallBanner(false);
    analytics.pwaInstall(outcome);
    if (outcome === 'dismissed') {
      localStorage.setItem('childrendoenglish-install-dismissed', '1');
    }
  }, []);

  const dismissInstall = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('childrendoenglish-install-dismissed', '1');
  }, []);

  return { showInstallBanner, handleInstall, dismissInstall };
}

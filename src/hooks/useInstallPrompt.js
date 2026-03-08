import { useState, useEffect, useRef, useCallback } from 'react';
import { analytics } from '../utils/analytics';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)')?.matches) return true;
  if (navigator.standalone === true) return true;
  return false;
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function useInstallPrompt({ gameState, totalQuizzes }) {
  const deferredPrompt = useRef(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const isIOS = detectIOS();

  useEffect(() => {
    if (isStandalone()) return;
    if (isIOS) return; // iOS handled separately below

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isIOS]);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem('childrendoenglish-install-dismissed')) {
      setShowInstallBanner(false);
      return;
    }
    if (gameState === 'menu' && totalQuizzes >= 1) {
      if (isIOS || deferredPrompt.current) {
        setShowInstallBanner(true);
      } else {
        setShowInstallBanner(false);
      }
    } else {
      setShowInstallBanner(false);
    }
  }, [gameState, totalQuizzes, isIOS]);

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

  return { showInstallBanner, handleInstall, dismissInstall, isIOS };
}

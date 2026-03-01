import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(ref, isOpen, onEscape) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement;

    const el = ref.current;
    if (!el) return;

    // Focus first focusable element
    const focusables = el.querySelectorAll(FOCUSABLE);
    if (focusables.length > 0) {
      setTimeout(() => focusables[0].focus(), 0);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const nodes = el.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus();
      }
    };
  }, [isOpen, ref, onEscape]);
}

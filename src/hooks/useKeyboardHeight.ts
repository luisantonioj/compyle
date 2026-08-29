// compyle — track mobile virtual keyboard height via VisualViewport API
// Sets CSS custom property --kb-h and data-keyboard-open attribute on <html>.
// Safari fallback for browsers that don't support interactive-widget meta.

import { useEffect } from 'react';

/** Minimum pixel delta to consider the keyboard "open" (filters address-bar resizes). */
const KB_THRESHOLD = 100;

export function useKeyboardHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    let prevKbH = 0;

    const update = () => {
      // visualViewport.height shrinks when the keyboard opens.
      // window.innerHeight stays at the full layout-viewport height.
      const kbH = Math.max(0, Math.round(window.innerHeight - vv.height));
      if (kbH === prevKbH) return;
      prevKbH = kbH;

      root.style.setProperty('--kb-h', `${kbH}px`);

      const isOpen = kbH > KB_THRESHOLD;
      if (isOpen) {
        root.setAttribute('data-keyboard-open', '');
      } else {
        root.removeAttribute('data-keyboard-open');
      }

      // When the keyboard just opened, scroll the focused element into view
      // after a short delay to let the iOS keyboard animation settle.
      if (isOpen && document.activeElement && document.activeElement !== document.body) {
        requestAnimationFrame(() => {
          (document.activeElement as HTMLElement)?.scrollIntoView?.({
            block: 'center',
            behavior: 'smooth',
          });
        });
      }
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // Initial sync in case keyboard was already open (unlikely but safe).
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb-h');
      root.removeAttribute('data-keyboard-open');
    };
  }, []);
}

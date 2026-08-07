// compyle — Firebase auth state observer
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, IS_CONFIGURED } from '../lib/firebase';

const AUTH_STARTUP_TIMEOUT_MS = 8_000;

export function useAuth() {
  // If Firebase isn't configured, skip the loading state entirely (demo mode)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(IS_CONFIGURED);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!IS_CONFIGURED || !auth) {
      setLoading(false);
      return;
    }

    const startedAt = performance.now();
    console.info('[compyle] auth_started');
    setLoading(true);
    setError(null);

    const timeout = window.setTimeout(() => {
      console.warn('[compyle] auth_timeout', {
        elapsedMs: Math.round(performance.now() - startedAt),
        online: navigator.onLine,
        standalone: window.matchMedia('(display-mode: standalone)').matches,
      });
      setLoading(false);
      setError('Connection is taking longer than expected.');
    }, AUTH_STARTUP_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      window.clearTimeout(timeout);
      setUser(u);
      setLoading(false);
      setError(null);
      console.info('[compyle] auth_resolved', {
        elapsedMs: Math.round(performance.now() - startedAt),
        authenticated: Boolean(u),
      });
    }, (authError) => {
      window.clearTimeout(timeout);
      setLoading(false);
      setError('We could not restore your session.');
      console.warn('[compyle] auth_error', {
        code: (authError as Error & { code?: string }).code,
        elapsedMs: Math.round(performance.now() - startedAt),
        online: navigator.onLine,
      });
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [retryAttempt]);

  return { user, loading, error, retry: () => setRetryAttempt((attempt) => attempt + 1) };
}

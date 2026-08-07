// compyle — Firebase auth state observer
import { useState, useEffect, useRef } from 'react';
import { getAdditionalUserInfo, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, IS_CONFIGURED } from '../lib/firebase';

const AUTH_STARTUP_TIMEOUT_MS = 8_000;

export type GoogleSignInMode = 'in' | 'up';
export type GoogleSignInOutcome = 'signed-in' | 'new-user' | 'cancelled';

export function useAuth() {
  // If Firebase isn't configured, skip the loading state entirely (demo mode)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(IS_CONFIGURED);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [authTransition, setAuthTransition] = useState(false);
  const authTransitionRef = useRef(false);
  const googleOutcomeRef = useRef<GoogleSignInOutcome | null>(null);

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
      if (authTransitionRef.current) {
        // Do not release the UI gate until the Google operation has classified
        // the account and Firebase has reflected the resulting session.
        if (googleOutcomeRef.current === 'new-user' && !u) {
          authTransitionRef.current = false;
          googleOutcomeRef.current = null;
          setAuthTransition(false);
        } else if (googleOutcomeRef.current === 'signed-in' && u) {
          authTransitionRef.current = false;
          googleOutcomeRef.current = null;
          setAuthTransition(false);
        }
      }
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

  const googleSignIn = async (mode: GoogleSignInMode): Promise<GoogleSignInOutcome> => {
    if (!auth || authTransition) return 'cancelled';

    authTransitionRef.current = true;
    googleOutcomeRef.current = null;
    setAuthTransition(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (mode === 'in' && getAdditionalUserInfo(cred)?.isNewUser) {
        // Firebase creates a temporary Auth user during a first-time Google
        // popup. Remove it before releasing the auth transition so AppShell
        // can never render for an account that was rejected as unregistered.
        await cred.user.delete().catch((cleanupError: unknown) => {
          console.warn('[compyle] google_new_user_cleanup_error', {
            message: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        });
        await signOut(auth).catch(() => undefined);
        googleOutcomeRef.current = 'new-user';
        if (!auth.currentUser) {
          authTransitionRef.current = false;
          googleOutcomeRef.current = null;
          setAuthTransition(false);
        }
        return 'new-user';
      }

      googleOutcomeRef.current = 'signed-in';
      if (auth.currentUser) {
        authTransitionRef.current = false;
        googleOutcomeRef.current = null;
        setAuthTransition(false);
      }
      return 'signed-in';
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') return 'cancelled';
      throw err;
    } finally {
      if (googleOutcomeRef.current === null) {
        authTransitionRef.current = false;
        setAuthTransition(false);
      }
    }
  };

  return {
    user,
    loading,
    error,
    authTransition,
    googleSignIn,
    retry: () => setRetryAttempt((attempt) => attempt + 1),
  };
}

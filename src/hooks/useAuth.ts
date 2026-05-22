// compyle — Firebase auth state observer
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, IS_CONFIGURED } from '../lib/firebase';

export function useAuth() {
  // If Firebase isn't configured, skip the loading state entirely (demo mode)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(IS_CONFIGURED);

  useEffect(() => {
    if (!IS_CONFIGURED || !auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

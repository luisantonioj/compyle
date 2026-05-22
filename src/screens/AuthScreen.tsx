// compyle — sign-in / sign-up screen
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

type Mode = 'in' | 'up';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'up') {
        const cred = await createUserWithEmailAndPassword(auth!, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth!, email, password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen paper-grain">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-heart">♥</div>
          <h1 className="auth-title">compyle</h1>
          <p className="auth-tagline">your personal companion</p>
        </div>

        <div className="segment" style={{ marginBottom: 24 }}>
          <button className={mode === 'in' ? 'active' : ''} onClick={() => switchMode('in')}>Sign in</button>
          <button className={mode === 'up' ? 'active' : ''} onClick={() => switchMode('up')}>Sign up</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'up' && (
            <div className="auth-field">
              <label className="label">your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. yle"
                autoComplete="name"
                className="auth-input"
              />
            </div>
          )}
          <div className="auth-field">
            <label className="label">email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
              className="auth-input"
            />
          </div>
          <div className="auth-field">
            <label className="label">password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
              required
              className="auth-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '···' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', textAlign: 'center', marginTop: 28 }}>
          made with ♥ by Luis · for yle
        </p>
      </div>
    </div>
  );
}

function mapError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':        return 'Invalid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Email or password is incorrect.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password':        return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':    return 'Too many attempts — try again later.';
    case 'auth/network-request-failed': return 'Network error — check your connection.';
    default:                          return 'Something went wrong. Try again.';
  }
}

// compyle - sign-in / sign-up screen
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  getAdditionalUserInfo,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { TabIcons } from '../components/Icons';
import { useAppStore } from '../store/appStore';

type Mode = 'in' | 'up';

export function AuthScreen() {
  const flash = useAppStore((s) => s.flash);
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

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth!, googleProvider);
      if (mode === 'in' && getAdditionalUserInfo(cred)?.isNewUser) {
        await signOut(auth!);
        void cred.user.delete();
        switchMode('up');
        flash('No account found. Sign up to get started!');
        return;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') setError(mapError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen paper-grain">
      <div className="auth-layout fade-in">
        <section className="auth-story" aria-label="Compyle preview">
          <div className="auth-story-top">
            <div>
              <h2 className="auth-story-title">
                <em>Compyle</em> it all
                <span>Everything you need</span>
              </h2>
            </div>
            <img className="auth-story-mark" src="/compyle-logo.png" alt="" aria-hidden="true" />
          </div>

          <div className="auth-showcase" aria-hidden="true">
            <aside className="auth-mini-sidebar">
              <span className="active">{TabIcons.cal(true)}</span>
              <span>{TabIcons.habits(false)}</span>
              <span>{TabIcons.notes(false)}</span>
              <span>{TabIcons.links(false)}</span>
              <span>{TabIcons.focus(false)}</span>
              <span>{TabIcons.money(false)}</span>
            </aside>
            <div className="auth-mini-app">
              <div className="auth-page-line">
                <span>plan</span>
                <i></i>
              </div>
              <div className="auth-mini-heading">
                Daily <em>Schedule</em>
              </div>

              <div className="auth-calendar-strip">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div className={index === 6 ? 'today' : ''} key={`${day}-${index}`}>
                    <b>{day}</b>
                    <span>{index + 5}</span>
                  </div>
                ))}
              </div>

              <div className="auth-visual-grid">
                <div className="auth-visual-card focus-card">
                  <span className="label">focus</span>
                  <strong>25:00</strong>
                  <button type="button" tabIndex={-1}>start</button>
                </div>
                <div className="auth-visual-card habit-card-preview">
                  <span className="label">tracker</span>
                  <div className="auth-mini-month">
                    {Array.from({ length: 21 }, (_, index) => (
                      <i
                        className={
                          index === 10 ? 'hot' : index % 3 === 0 || index % 5 === 0 ? 'done' : ''
                        }
                        key={index}
                      />
                    ))}
                  </div>
                </div>
                <div className="auth-visual-card money-card-preview">
                  <span className="label">money</span>
                  <strong>P0.00</strong>
                  <small>net this month</small>
                </div>
                <div className="auth-visual-card notes-card-preview">
                  <span className="label">notes</span>
                  <p>online courses</p>
                  <p>coding dump</p>
                  <p>for yle</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-story-footer" aria-hidden="true">
            <span>offline-first</span>
            <span>personal or with partner</span>
            <span>compyle them all</span>
          </div>
        </section>

        <section className="auth-card" aria-label={mode === 'in' ? 'Sign in' : 'Sign up'}>
          <div className="auth-logo">
            <div className="auth-heart">♥</div>
            <h1 className="auth-title">compyle</h1>
            <p className="auth-tagline">your personal companion</p>
          </div>

          <div className="segment auth-segment">
            <button type="button" className={mode === 'in' ? 'active' : ''} onClick={() => switchMode('in')}>Sign in</button>
            <button type="button" className={mode === 'up' ? 'active' : ''} onClick={() => switchMode('up')}>Sign up</button>
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
              {loading ? '...' : mode === 'in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="auth-btn-google" onClick={signInWithGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mono auth-credit">
            made with ♥ by Luis · for yle
          </p>
        </section>
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
    case 'auth/too-many-requests':    return 'Too many attempts - try again later.';
    case 'auth/network-request-failed': return 'Network error - check your connection.';
    case 'auth/popup-blocked':        return 'Popup was blocked - allow popups for this site.';
    case 'auth/account-exists-with-different-credential': return 'An account already exists with this email.';
    case 'auth/operation-not-allowed':  return 'This sign-in method is not enabled.';
    case 'auth/unauthorized-domain':    return 'This domain is not authorized for sign-in.';
    default:                            return 'Something went wrong. Try again.';
  }
}

// compyle - sign-in / sign-up screen
import React, { useRef, useState } from 'react';
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

type FeatureId = 'cal' | 'notes' | 'links' | 'focus' | 'habits' | 'money';

const FEATURE_CARDS: {
  id: FeatureId;
  label: string;
  title: string;
  copy: string;
  accent: string;
}[] = [
  { id: 'cal', label: 'plan', title: 'Make room for what matters.', copy: 'Shape your day around the things worth doing.', accent: 'var(--ink)' },
  { id: 'notes', label: 'notes', title: 'Keep the good ideas close.', copy: 'A quiet notebook for thoughts, plans, and everything in between.', accent: 'var(--clay)' },
  { id: 'links', label: 'links', title: 'Save the things you’ll come back to.', copy: 'Turn scattered bookmarks into a collection you can actually find.', accent: 'var(--moss)' },
  { id: 'focus', label: 'focus', title: 'Give your attention a place to land.', copy: 'A simple timer for doing one meaningful thing at a time.', accent: 'var(--clay)' },
  { id: 'habits', label: 'track', title: 'Notice the small wins.', copy: 'Build momentum with a clear view of the habits you keep.', accent: 'var(--moss)' },
  { id: 'money', label: 'money', title: 'Know where your money goes.', copy: 'See your balances, spending, and plans without the noise.', accent: 'var(--amber)' },
];

const FEATURE_ORDER: FeatureId[] = FEATURE_CARDS.map((feature) => feature.id);

function FeaturePreview({ id }: { id: FeatureId }) {
  if (id === 'cal') return <div className="deck-preview plan-preview"><div className="preview-week"><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b><b>S</b><b>S</b></div><div className="preview-task is-done"><i />send the proposal<span>9:00</span></div><div className="preview-task"><i />make space for a walk<span>17:30</span></div><div className="preview-task"><i />check in with yle<span>20:00</span></div></div>;
  if (id === 'notes') return <div className="deck-preview notes-preview"><div className="preview-note is-featured"><span>today</span><strong>things I want to remember</strong><small>Somewhere between the ordinary and the important.</small></div><div className="preview-note"><span>ideas</span><strong>online courses</strong></div><div className="preview-note"><span>personal</span><strong>weekend plans</strong></div></div>;
  if (id === 'links') return <div className="deck-preview links-preview"><div className="preview-link"><i>↗</i><div><strong>designing a slower web</strong><small>read.cv · articles</small></div></div><div className="preview-link"><i>↗</i><div><strong>the tools I use</strong><small>nesslabs.com · resources</small></div></div><div className="preview-link"><i>↗</i><div><strong>learn something new</strong><small>youtube.com · learning</small></div></div></div>;
  if (id === 'focus') return <div className="deck-preview focus-preview"><span className="preview-timer-label">deep work</span><strong>25:00</strong><div className="preview-progress"><i /></div><small>one thing at a time</small></div>;
  if (id === 'habits') return <div className="deck-preview habits-preview"><div className="preview-streak"><strong>12</strong><span>day streak</span><b>↑ 4 this month</b></div><div className="preview-heatmap">{Array.from({ length: 28 }, (_, index) => <i className={index % 4 === 0 ? 'hot' : index % 3 === 0 ? 'done' : ''} key={index} />)}</div><small>keep showing up</small></div>;
  return <div className="deck-preview money-preview"><div className="preview-balance"><span>total balance</span><strong>₱24,680</strong><b>+ ₱3,240 this month</b></div><div className="preview-flow"><span>in <i /></span><span>out <i /></span><span>net <i /></span></div></div>;
}

function FeatureDeck() {
  const [order, setOrder] = useState<FeatureId[]>(FEATURE_ORDER);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const active = order[0];

  const bringForward = (id: FeatureId) => {
    setOrder((current) => [id, ...current.filter((item) => item !== id)]);
  };

  const cycle = (direction: 1 | -1) => {
    setOrder((current) => {
      const next = [...current];
      if (direction === 1) next.push(next.shift()!);
      else next.unshift(next.pop()!);
      return next;
    });
  };

  return (
    <div className="feature-deck" aria-label="Compyle features">
      <div className="feature-deck-stage">
        {order.map((id, index) => {
          const feature = FEATURE_CARDS.find((item) => item.id === id)!;
          return (
            <button
              type="button"
              className={`feature-card${index === 0 ? ' is-front' : ''}`}
              key={id}
              style={{ '--card-index': index, '--card-accent': feature.accent } as React.CSSProperties}
              aria-label={`${feature.label}: ${feature.title}`}
              aria-pressed={id === active}
              onClick={() => bringForward(id)}
              onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }}
              onPointerUp={(event) => {
                if (!pointerStart.current) return;
                const deltaX = event.clientX - pointerStart.current.x;
                pointerStart.current = null;
                if (Math.abs(deltaX) > 48) cycle(deltaX < 0 ? 1 : -1);
              }}
            >
              <div className="feature-card-head"><span className="label">{feature.label}</span>{TabIcons[id](index === 0)}</div>
              <div className="feature-card-copy"><h3>{feature.title}</h3><p>{feature.copy}</p></div>
              <FeaturePreview id={id} />
              <span className="feature-card-hint">tap to explore <b>↗</b></span>
            </button>
          );
        })}
      </div>
      <div className="feature-deck-controls">
        <button type="button" className="deck-arrow" onClick={() => cycle(-1)} aria-label="Previous feature">←</button>
        <div className="deck-dots" aria-label="Feature selection">
          {FEATURE_CARDS.map((feature) => <button type="button" key={feature.id} className={feature.id === active ? 'active' : ''} onClick={() => bringForward(feature.id)} aria-label={`Show ${feature.label}`} aria-pressed={feature.id === active} />)}
        </div>
        <button type="button" className="deck-arrow" onClick={() => cycle(1)} aria-label="Next feature">→</button>
      </div>
    </div>
  );
}

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

          <FeatureDeck />

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

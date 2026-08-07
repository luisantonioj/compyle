// compyle - root app component
import { useAppStore } from './store/appStore';
import { NotificationCenter } from './components/ui/NotificationCenter';
import { AuthScreen } from './screens/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { IS_CONFIGURED } from './lib/firebase';
import { AppShell } from './app/AppShell';

export default function App() {
  const { user, loading, error, authTransition, googleSignIn, retry } = useAuth();
  const store = useAppStore();

  if (loading) return <div className="auth-loading paper-grain" />;

  if (error && !user) {
    return (
      <main className="auth-loading paper-grain" role="alert">
        <div style={{ maxWidth: 360, margin: 'auto', padding: 24, textAlign: 'center' }}>
          <p className="auth-info">{error}</p>
          <button className="auth-btn" type="button" onClick={retry}>Retry connection</button>
        </div>
      </main>
    );
  }

  if (IS_CONFIGURED && (!user || authTransition)) {
    return (
      <>
        <AuthScreen onGoogleSignIn={googleSignIn} googleLoading={authTransition} />
        <NotificationCenter
          toast={store.toast}
          onToastDismiss={() => store.setToast(null)}
          onSyncRetry={() => window.location.reload()}
        />
      </>
    );
  }

  return <AppShell user={user} />;
}

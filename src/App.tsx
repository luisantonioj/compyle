// compyle - root app component
import { useAppStore } from './store/appStore';
import { NotificationCenter } from './components/ui/NotificationCenter';
import { AuthScreen } from './screens/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { IS_CONFIGURED } from './lib/firebase';
import { AppShell } from './app/AppShell';

export default function App() {
  const { user, loading } = useAuth();
  const store = useAppStore();

  if (loading) return <div className="auth-loading paper-grain" />;

  if (IS_CONFIGURED && !user) {
    return (
      <>
        <AuthScreen />
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

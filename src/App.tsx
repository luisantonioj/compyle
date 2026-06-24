// compyle - root app component
import { useAppStore } from './store/appStore';
import { Toast } from './components/ui/shared';
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
        {store.toast && (
          <Toast
            message={store.toast.message}
            action={store.toast.action}
            onAction={store.toast.onAction}
            onDismiss={() => store.setToast(null)}
          />
        )}
      </>
    );
  }

  return <AppShell user={user} />;
}

const APP_UPDATE_ACTIVATED = 'COMPYLE_APP_UPDATE_ACTIVATED';
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1_000;

/**
 * Registers the production service worker and checks it without consulting the
 * HTTP cache. Reloads replace only the app shell; localStorage, sessionStorage,
 * IndexedDB, cookies, and Firebase data are deliberately left intact.
 */
export function registerAppServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  let reloadStarted = false;
  const reloadLatestApp = () => {
    if (reloadStarted) return;
    reloadStarted = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== APP_UPDATE_ACTIVATED) return;

    // Acknowledge before reloading so the service worker does not also invoke
    // its legacy-client navigation fallback.
    event.ports[0]?.postMessage({ acknowledged: true });
    reloadLatestApp();
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Normally the activation message above reloads immediately. This covers
    // browsers that omit transferable message ports during worker activation.
    window.setTimeout(reloadLatestApp, 1_500);
  });

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    }).then((registration) => {
      const checkForUpdate = () => {
        if (navigator.onLine) void registration.update().catch(() => undefined);
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      window.addEventListener('online', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    }).catch(() => {
      // Offline first loads and browsers with disabled service workers should
      // continue using the app without turning registration into a fatal error.
    });
  }, { once: true });
}

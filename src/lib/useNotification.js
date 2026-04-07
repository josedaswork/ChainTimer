import { useCallback, useRef, useEffect } from 'react';

let _service = null;
let _attempted = false;

async function getService() {
  if (_service !== null) return _service;
  if (_attempted) return null;
  _attempted = true;
  try {
    if (typeof window === 'undefined' || !window.Capacitor?.isNativePlatform()) return null;
    const mod = await import('@capawesome-team/capacitor-foreground-service');
    _service = mod.ForegroundService;
    try { await _service.requestPermissions(); } catch {}
    return _service;
  } catch {
    return null;
  }
}

export default function useNotification() {
  const activeRef = useRef(false);
  const listenerRef = useRef(null);

  const startNotification = useCallback(async (title, body) => {
    if (activeRef.current) return;
    const svc = await getService();
    if (!svc) return;
    try {
      await svc.startForegroundService({
        id: 1,
        title,
        body,
        smallIcon: 'ic_launcher',
        buttons: [
          { id: 1, title: '⏯ Pausar/Reanudar' },
          { id: 2, title: '🔄 Reiniciar' },
        ],
      });
      activeRef.current = true;
    } catch (e) { console.warn('ForegroundService error:', e); }
  }, []);

  const updateNotification = useCallback(async (title, body) => {
    if (!activeRef.current) return;
    const svc = await getService();
    if (!svc) return;
    try {
      await svc.updateForegroundService({ title, body });
    } catch {}
  }, []);

  const stopNotification = useCallback(async () => {
    if (!activeRef.current) return;
    const svc = await getService();
    if (!svc) return;
    try {
      await svc.stopForegroundService();
      activeRef.current = false;
    } catch {}
  }, []);

  const addActionListener = useCallback(async (callback) => {
    const svc = await getService();
    if (!svc) return;
    try {
      if (listenerRef.current) await listenerRef.current.remove();
      listenerRef.current = await svc.addListener('buttonClicked', (event) => {
        callback(event.buttonId);
      });
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove().catch(() => {});
        listenerRef.current = null;
      }
      if (activeRef.current) {
        getService().then(svc => svc?.stopForegroundService()).catch(() => {});
        activeRef.current = false;
      }
    };
  }, []);

  return { startNotification, updateNotification, stopNotification, addActionListener };
}

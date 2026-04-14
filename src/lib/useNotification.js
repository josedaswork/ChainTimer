/**
 * @history
 * 2026-04-14 — Capacitor local notifications with web fallback
 */
import { useCallback, useRef, useEffect } from 'react';

const NOTIF_ID = 77001;
let _plugin = null;
let _attempted = false;

async function getPlugin() {
  if (_plugin !== null) return _plugin;
  if (_attempted) return null;
  _attempted = true;
  try {
    const mod = await import('@capacitor/local-notifications');
    _plugin = mod.LocalNotifications;
    const perm = await _plugin.requestPermissions();
    if (perm.display !== 'granted') { _plugin = null; return null; }
    // Create action types for buttons
    await _plugin.registerActionTypes({
      types: [{
        id: 'timer-actions',
        actions: [
          { id: 'pause-resume', title: '⏯ Pausar/Reanudar' },
          { id: 'reset', title: '🔄 Reiniciar' },
        ],
      }],
    });
    return _plugin;
  } catch {
    // Not in Capacitor — fallback to web
    return null;
  }
}

// ======== Web fallback using basic Notification API ========
function webNotify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, tag: 'chain-timer', silent: true, requireInteraction: true }); } catch {}
}

async function webRequestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export default function useNotification() {
  const wakeLockRef = useRef(null);
  const callbackRef = useRef(null);
  const listenerRef = useRef(null);
  const activeRef = useRef(false);

  const acquireWakeLock = useCallback(async () => {
    if (wakeLockRef.current) return;
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const startNotification = useCallback(async (title, body) => {
    acquireWakeLock();
    activeRef.current = true;
    const plugin = await getPlugin();
    if (plugin) {
      await plugin.schedule({
        notifications: [{
          id: NOTIF_ID,
          title,
          body,
          ongoing: true,
          autoCancel: false,
          actionTypeId: 'timer-actions',
          schedule: { at: new Date(Date.now() + 100) },
        }],
      });
    } else {
      await webRequestPermission();
      webNotify(title, body);
    }
  }, [acquireWakeLock]);

  const updateNotification = useCallback(async (title, body) => {
    if (!activeRef.current) return;
    const plugin = await getPlugin();
    if (plugin) {
      // Cancel and re-schedule to update content
      try { await plugin.cancel({ notifications: [{ id: NOTIF_ID }] }); } catch {}
      await plugin.schedule({
        notifications: [{
          id: NOTIF_ID,
          title,
          body,
          ongoing: true,
          autoCancel: false,
          actionTypeId: 'timer-actions',
          schedule: { at: new Date(Date.now() + 100) },
        }],
      });
    } else {
      webNotify(title, body);
    }
  }, []);

  const stopNotification = useCallback(async () => {
    activeRef.current = false;
    const plugin = await getPlugin();
    if (plugin) {
      try { await plugin.cancel({ notifications: [{ id: NOTIF_ID }] }); } catch {}
    }
    releaseWakeLock();
  }, [releaseWakeLock]);

  const addActionListener = useCallback(async (callback) => {
    callbackRef.current = callback;
    const plugin = await getPlugin();
    if (!plugin) return;
    try {
      if (listenerRef.current) await listenerRef.current.remove();
      listenerRef.current = await plugin.addListener('localNotificationActionPerformed', (event) => {
        const actionId = event.actionId;
        if (actionId === 'pause-resume' && callbackRef.current) callbackRef.current(1);
        else if (actionId === 'reset' && callbackRef.current) callbackRef.current(2);
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
        getPlugin().then(p => p?.cancel({ notifications: [{ id: NOTIF_ID }] })).catch(() => {});
        activeRef.current = false;
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return { startNotification, updateNotification, stopNotification, addActionListener };
}

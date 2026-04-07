import { useCallback, useRef, useEffect } from 'react';

// Request notification permission once
let _permissionGranted = false;
async function ensurePermission() {
  if (_permissionGranted) return true;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') { _permissionGranted = true; return true; }
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  _permissionGranted = result === 'granted';
  return _permissionGranted;
}

// Get the service worker registration (needed for action buttons)
let _swReg = null;
async function getSWRegistration() {
  if (_swReg) return _swReg;
  if (!('serviceWorker' in navigator)) return null;
  try {
    _swReg = await navigator.serviceWorker.getRegistration('/sw-timer.js');
    if (!_swReg) {
      _swReg = await navigator.serviceWorker.register('/sw-timer.js');
      await navigator.serviceWorker.ready;
    }
    return _swReg;
  } catch { return null; }
}

export default function useNotification() {
  const wakeLockRef = useRef(null);
  const callbackRef = useRef(null);

  // Acquire Wake Lock to keep the app alive when screen is on
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

  const showNotification = useCallback(async (title, body, renotify = false) => {
    const ok = await ensurePermission();
    if (!ok) return;
    const reg = await getSWRegistration();
    if (!reg) return;
    // Close existing notifications with same tag
    const existing = await reg.getNotifications({ tag: 'chain-timer' });
    existing.forEach(n => n.close());
    await reg.showNotification(title, {
      body,
      tag: 'chain-timer',
      renotify,
      silent: true,
      requireInteraction: true,
      actions: [
        { action: 'pause-resume', title: '⏯ Pausar/Reanudar' },
        { action: 'reset', title: '🔄 Reiniciar' },
      ],
    });
  }, []);

  const startNotification = useCallback(async (title, body) => {
    acquireWakeLock();
    await showNotification(title, body, true);
  }, [acquireWakeLock, showNotification]);

  const updateNotification = useCallback(async (title, body) => {
    await showNotification(title, body, false);
  }, [showNotification]);

  const stopNotification = useCallback(async () => {
    const reg = await getSWRegistration();
    if (reg) {
      const existing = await reg.getNotifications({ tag: 'chain-timer' });
      existing.forEach(n => n.close());
    }
    releaseWakeLock();
  }, [releaseWakeLock]);

  // Listen for action button clicks from the service worker
  const addActionListener = useCallback((callback) => {
    callbackRef.current = callback;
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'TIMER_ACTION' && callbackRef.current) {
        const action = event.data.action;
        if (action === 'pause-resume') callbackRef.current(1);
        else if (action === 'reset') callbackRef.current(2);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
      getSWRegistration().then(reg => {
        if (reg) reg.getNotifications({ tag: 'chain-timer' }).then(ns => ns.forEach(n => n.close()));
      }).catch(() => {});
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return { startNotification, updateNotification, stopNotification, addActionListener };
}

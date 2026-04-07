import { useCallback, useRef } from 'react';

export const ALARM_SOUNDS = [
  { id: 'beep', label: '🔔 Beep' },
  { id: 'bell', label: '🔕 Campana' },
  { id: 'chime', label: '🎵 Chime' },
  { id: 'buzzer', label: '📢 Buzzer' },
  { id: 'soft', label: '🌙 Suave' },
];

export default function useAlarm() {
  const audioCtxRef = useRef(null);

  const getCtx = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((ctx, freq, startTime, duration, type = 'sine', volume = 0.3) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const playAlarm = useCallback((soundId = 'beep') => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    switch (soundId) {
      case 'bell':
        playTone(ctx, 440, now, 0.6, 'sine', 0.25);
        playTone(ctx, 880, now, 0.4, 'sine', 0.15);
        break;
      case 'chime':
        playTone(ctx, 523, now, 0.15, 'sine', 0.25);
        playTone(ctx, 659, now + 0.15, 0.15, 'sine', 0.25);
        playTone(ctx, 784, now + 0.3, 0.15, 'sine', 0.25);
        playTone(ctx, 1047, now + 0.45, 0.3, 'sine', 0.2);
        break;
      case 'buzzer':
        playTone(ctx, 220, now, 0.2, 'square', 0.15);
        playTone(ctx, 220, now + 0.25, 0.2, 'square', 0.15);
        playTone(ctx, 220, now + 0.5, 0.3, 'square', 0.15);
        break;
      case 'soft':
        playTone(ctx, 600, now, 0.4, 'sine', 0.12);
        playTone(ctx, 800, now + 0.2, 0.5, 'sine', 0.08);
        break;
      case 'beep':
      default:
        playTone(ctx, 880, now, 0.15, 'sine', 0.3);
        playTone(ctx, 1100, now + 0.18, 0.15, 'sine', 0.3);
        playTone(ctx, 880, now + 0.36, 0.15, 'sine', 0.3);
        break;
    }
  }, [getCtx, playTone]);

  const vibrate = useCallback((pattern = [200, 100, 200]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  return { playAlarm, vibrate, ALARM_SOUNDS };
}

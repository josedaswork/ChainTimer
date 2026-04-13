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

  const compressorRef = useRef(null);

  const getCompressor = useCallback((ctx) => {
    if (!compressorRef.current) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -6;
      comp.knee.value = 3;
      comp.ratio.value = 12;
      comp.attack.value = 0;
      comp.release.value = 0.1;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 3.0;
      comp.connect(masterGain);
      masterGain.connect(ctx.destination);
      compressorRef.current = comp;
    }
    return compressorRef.current;
  }, []);

  const playTone = useCallback((ctx, freq, startTime, duration, type = 'sine', volume = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(getCompressor(ctx));
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, [getCompressor]);

  const playAlarm = useCallback((soundId = 'beep') => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    switch (soundId) {
      case 'bell':
        for (let r = 0; r < 3; r++) {
          const off = r * 0.7;
          playTone(ctx, 440, now + off, 0.6, 'sine', 1.0);
          playTone(ctx, 880, now + off, 0.4, 'sine', 0.8);
        }
        break;
      case 'chime':
        for (let r = 0; r < 3; r++) {
          const off = r * 0.7;
          playTone(ctx, 523, now + off, 0.15, 'sine', 1.0);
          playTone(ctx, 659, now + off + 0.15, 0.15, 'sine', 1.0);
          playTone(ctx, 784, now + off + 0.3, 0.15, 'sine', 1.0);
          playTone(ctx, 1047, now + off + 0.45, 0.3, 'sine', 0.9);
        }
        break;
      case 'buzzer':
        for (let r = 0; r < 4; r++) {
          const off = r * 0.55;
          playTone(ctx, 220, now + off, 0.2, 'square', 0.9);
          playTone(ctx, 220, now + off + 0.25, 0.2, 'square', 0.9);
        }
        break;
      case 'soft':
        for (let r = 0; r < 3; r++) {
          const off = r * 0.8;
          playTone(ctx, 600, now + off, 0.4, 'sine', 0.8);
          playTone(ctx, 800, now + off + 0.2, 0.5, 'sine', 0.7);
        }
        break;
      case 'beep':
      default:
        for (let r = 0; r < 3; r++) {
          const off = r * 0.6;
          playTone(ctx, 880, now + off, 0.15, 'sine', 1.0);
          playTone(ctx, 1100, now + off + 0.18, 0.15, 'sine', 1.0);
          playTone(ctx, 880, now + off + 0.36, 0.15, 'sine', 1.0);
        }
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

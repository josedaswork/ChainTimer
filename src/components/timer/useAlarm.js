/**
 * @history
 * 2026-04-15 — Remove single-iteration loops, remove ALARM_SOUNDS from hook return
 * 2026-04-15 — Reduce alarm repetitions by 2 (3→1, 4→2)
 * 2026-04-14 — volumeScale param in playAlarm for preview at 60%
 * 2026-04-14 — playStartSound (3-note ascending chime on timer start)
 * 2026-04-14 — vibrate uses @capacitor/haptics with navigator.vibrate fallback
 * 2026-04-14 — masterGain 3.0x + DynamicsCompressor for loud alarms
 * 2026-04-14 — 5 alarm sounds: beep, bell, chime, buzzer, soft
 */
import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

  const playTone = useCallback((ctx, freq, startTime, duration, type = 'sine', volume = 1.0, dest = null) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.connect(gain);
    gain.connect(dest || getCompressor(ctx));
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, [getCompressor]);

  const playAlarm = useCallback((soundId = 'beep', { volumeScale = 1.0 } = {}) => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Optional volume scaling (e.g. 0.6 for preview)
    let dest = getCompressor(ctx);
    if (volumeScale < 1.0) {
      const scaleGain = ctx.createGain();
      scaleGain.gain.value = volumeScale;
      scaleGain.connect(getCompressor(ctx));
      dest = scaleGain;
    }

    switch (soundId) {
      case 'bell':
        playTone(ctx, 440, now, 0.6, 'sine', 1.0, dest);
        playTone(ctx, 880, now, 0.4, 'sine', 0.8, dest);
        break;
      case 'chime':
        playTone(ctx, 523, now, 0.15, 'sine', 1.0, dest);
        playTone(ctx, 659, now + 0.15, 0.15, 'sine', 1.0, dest);
        playTone(ctx, 784, now + 0.3, 0.15, 'sine', 1.0, dest);
        playTone(ctx, 1047, now + 0.45, 0.3, 'sine', 0.9, dest);
        break;
      case 'buzzer':
        for (let r = 0; r < 2; r++) {
          const off = r * 0.55;
          playTone(ctx, 220, now + off, 0.2, 'square', 0.9, dest);
          playTone(ctx, 220, now + off + 0.25, 0.2, 'square', 0.9, dest);
        }
        break;
      case 'soft':
        playTone(ctx, 600, now, 0.4, 'sine', 0.8, dest);
        playTone(ctx, 800, now + 0.2, 0.5, 'sine', 0.7, dest);
        break;
      case 'beep':
      default:
        playTone(ctx, 880, now, 0.15, 'sine', 1.0, dest);
        playTone(ctx, 1100, now + 0.18, 0.15, 'sine', 1.0, dest);
        playTone(ctx, 880, now + 0.36, 0.15, 'sine', 1.0, dest);
        break;
    }
  }, [getCtx, getCompressor, playTone]);

  const vibrate = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(r => setTimeout(r, 200));
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(r => setTimeout(r, 100));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const playStartSound = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    playTone(ctx, 523, now, 0.1, 'sine', 0.7);
    playTone(ctx, 659, now + 0.1, 0.1, 'sine', 0.7);
    playTone(ctx, 784, now + 0.2, 0.15, 'sine', 0.8);
  }, [getCtx, playTone]);

  return { playAlarm, vibrate, playStartSound };
}

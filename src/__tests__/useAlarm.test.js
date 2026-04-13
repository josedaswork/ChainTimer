import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @capacitor/haptics — Haptics.impact always rejects to trigger fallback
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn(() => Promise.reject(new Error('no native'))) },
  ImpactStyle: { Heavy: 'HEAVY' },
}));

import useAlarm, { ALARM_SOUNDS } from '@/components/timer/useAlarm';

// Mock Web Audio API
class MockOscillator {
  connect() {}
  start() {}
  stop() {}
  type = 'sine';
  frequency = { value: 440 };
}

class MockGainNode {
  connect() {}
  gain = { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}

class MockDynamicsCompressor {
  connect() {}
  threshold = { value: 0 };
  knee = { value: 0 };
  ratio = { value: 0 };
  attack = { value: 0 };
  release = { value: 0 };
}

const mockCtx = {
  currentTime: 0,
  destination: {},
  createOscillator: () => new MockOscillator(),
  createGain: () => new MockGainNode(),
  createDynamicsCompressor: () => new MockDynamicsCompressor(),
};

beforeEach(() => {
  global.AudioContext = class {
    constructor() {
      Object.assign(this, mockCtx);
    }
  };
  global.webkitAudioContext = undefined;
});

describe('ALARM_SOUNDS', () => {
  it('exports a list of sounds', () => {
    expect(ALARM_SOUNDS.length).toBeGreaterThan(0);
    ALARM_SOUNDS.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('label');
    });
  });

  it('includes beep, bell, chime, buzzer, soft', () => {
    const ids = ALARM_SOUNDS.map(s => s.id);
    expect(ids).toContain('beep');
    expect(ids).toContain('bell');
    expect(ids).toContain('chime');
    expect(ids).toContain('buzzer');
    expect(ids).toContain('soft');
  });
});

describe('useAlarm', () => {
  it('returns playAlarm and vibrate', () => {
    const { result } = renderHook(() => useAlarm());
    expect(typeof result.current.playAlarm).toBe('function');
    expect(typeof result.current.vibrate).toBe('function');
  });

  it('playAlarm does not throw for each sound type', () => {
    const { result } = renderHook(() => useAlarm());
    ALARM_SOUNDS.forEach(s => {
      expect(() => {
        result.current.playAlarm(s.id);
      }).not.toThrow();
    });
  });

  it('playAlarm with no argument defaults to beep', () => {
    const { result } = renderHook(() => useAlarm());
    expect(() => {
      result.current.playAlarm();
    }).not.toThrow();
  });

  it('vibrate calls navigator.vibrate as fallback', async () => {
    navigator.vibrate = vi.fn();
    const { result } = renderHook(() => useAlarm());
    await act(async () => result.current.vibrate());
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it('vibrate does not throw when navigator.vibrate is unavailable', async () => {
    navigator.vibrate = undefined;
    const { result } = renderHook(() => useAlarm());
    await expect(async () => {
      await act(async () => result.current.vibrate());
    }).not.toThrow();
  });
});

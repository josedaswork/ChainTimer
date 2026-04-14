import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTimer from '@/components/timer/useTimer';

const intervals = [
  { id: 1, name: 'A', minutes: 0, seconds: 3 },
  { id: 2, name: 'B', minutes: 0, seconds: 2 },
  { id: 3, name: 'C', minutes: 0, seconds: 4 },
];

describe('useTimer — serial mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with correct defaults', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it('start sets hasStarted and isRunning', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    expect(result.current.hasStarted).toBe(true);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.secondsLeft).toBe(3);
  });

  it('counts down each second', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20)); // flush setTimeout
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(1);
  });

  it('moves to next interval when current finishes', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(intervals, onComplete, vi.fn(), 'serial'));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20));
    act(() => vi.advanceTimersByTime(3000));
    expect(onComplete).toHaveBeenCalledWith(0);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.secondsLeft).toBe(2);
  });

  it('calls onAllComplete after all intervals finish', () => {
    const onAll = vi.fn();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(intervals, onComplete, onAll, 'serial'));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20));
    act(() => vi.advanceTimersByTime(9000));
    expect(onAll).toHaveBeenCalled();
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.isRunning).toBe(false);
  });

  it('pause stops the timer', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    const frozen = result.current.secondsLeft;
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(frozen);
  });

  it('reset restores initial state', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.reset());
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('does not start with empty intervals', () => {
    const { result } = renderHook(() => useTimer([], vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    expect(result.current.hasStarted).toBe(false);
  });

  it('skipIndex marks an interval as skipped', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.skipIndex(1));
    expect(result.current.skippedIndices.has(1)).toBe(true);
  });

  it('start skips pre-skipped intervals', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.skipIndex(0));
    act(() => result.current.start());
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.secondsLeft).toBe(2);
  });

  it('skipIndex on active interval advances to next', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    expect(result.current.currentIndex).toBe(0);
    act(() => result.current.skipIndex(0));
    expect(result.current.currentIndex).toBe(1);
  });

  it('unskipIndex removes from skipped set', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.skipIndex(1));
    expect(result.current.skippedIndices.has(1)).toBe(true);
    act(() => result.current.unskipIndex(1));
    expect(result.current.skippedIndices.has(1)).toBe(false);
  });

  it('progress is computed correctly', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'serial'));
    act(() => result.current.start());
    expect(result.current.progress).toBe(0);
    act(() => vi.advanceTimersByTime(20));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.progress).toBeCloseTo(1 / 3, 1);
  });
});

describe('useTimer — parallel mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('startAllParallel starts all timers', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    expect(result.current.hasStarted).toBe(true);
    expect(result.current.parallelTimers.length).toBe(3);
    result.current.parallelTimers.forEach(t => {
      expect(t.running).toBe(true);
      expect(t.done).toBe(false);
    });
  });

  it('parallel timers count down independently', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    act(() => vi.advanceTimersByTime(2000));
    // B (2s) should be done, A (3s) should have 1s left, C (4s) should have 2s left
    expect(result.current.parallelTimers[1].done).toBe(true);
    expect(result.current.parallelTimers[0].secondsLeft).toBe(1);
    expect(result.current.parallelTimers[2].secondsLeft).toBe(2);
  });

  it('skipIndex in parallel marks timer as done', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    act(() => result.current.skipIndex(2));
    expect(result.current.parallelTimers[2].done).toBe(true);
    expect(result.current.parallelTimers[2].running).toBe(false);
  });

  it('unskipIndex in parallel resets a done timer', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    act(() => result.current.skipIndex(0));
    expect(result.current.parallelTimers[0].done).toBe(true);
    act(() => result.current.unskipIndex(0));
    expect(result.current.parallelTimers[0].done).toBe(false);
    expect(result.current.parallelTimers[0].secondsLeft).toBe(3);
  });

  it('pauseSingle pauses a single parallel timer', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    expect(result.current.parallelTimers[0].running).toBe(true);
    act(() => result.current.pauseSingle(0));
    expect(result.current.parallelTimers[0].running).toBe(false);
    // Others remain running
    expect(result.current.parallelTimers[1].running).toBe(true);
    expect(result.current.parallelTimers[2].running).toBe(true);
  });

  it('pauseSingle on all running timers stops the tick', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    act(() => result.current.startAllParallel());
    act(() => result.current.pauseSingle(0));
    act(() => result.current.pauseSingle(1));
    act(() => result.current.pauseSingle(2));
    expect(result.current.isRunning).toBe(false);
  });

  it('startSingle starts a single parallel timer', () => {
    const { result } = renderHook(() => useTimer(intervals, vi.fn(), vi.fn(), 'parallel'));
    // Don't start all — start one individually
    act(() => result.current.startSingle(1));
    expect(result.current.hasStarted).toBe(true);
    expect(result.current.parallelTimers[1].running).toBe(true);
    expect(result.current.parallelTimers[0].running).toBe(false);
    expect(result.current.parallelTimers[2].running).toBe(false);
  });
});

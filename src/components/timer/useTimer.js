import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer(intervals, onIntervalComplete, onAllComplete, mode = 'serial') {
  // --- Serial state ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // --- Parallel state ---
  const [parallelTimers, setParallelTimers] = useState([]);

  // --- Shared state ---
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const tickRef = useRef(null);
  const stateRef = useRef({ currentIndex: 0, secondsLeft: 0, parallelTimers: [] });

  stateRef.current = { currentIndex, secondsLeft, parallelTimers };

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  // ======================== SERIAL MODE ========================
  const startTickingSerial = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      const { currentIndex: ci, secondsLeft: sl } = stateRef.current;
      if (sl <= 1) {
        const nextIndex = ci + 1;
        if (nextIndex < intervals.length) {
          onIntervalComplete?.(ci);
          const nextTotal = intervals[nextIndex].minutes * 60 + (intervals[nextIndex].seconds || 0);
          setCurrentIndex(nextIndex);
          setSecondsLeft(nextTotal);
          stateRef.current = { ...stateRef.current, currentIndex: nextIndex, secondsLeft: nextTotal };
        } else {
          clearTick();
          onIntervalComplete?.(ci);
          onAllComplete?.();
          setSecondsLeft(0);
          setIsRunning(false);
          setHasStarted(false);
          stateRef.current = { ...stateRef.current, currentIndex: ci, secondsLeft: 0 };
        }
      } else {
        const next = sl - 1;
        setSecondsLeft(next);
        stateRef.current.secondsLeft = next;
      }
    }, 1000);
  }, [intervals, onIntervalComplete, onAllComplete]);

  // ======================== PARALLEL MODE ========================
  const startTickingParallel = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      const timers = stateRef.current.parallelTimers;
      let allDone = true;
      const updated = timers.map((t, i) => {
        if (t.done) return t;
        if (t.secondsLeft <= 1) {
          onIntervalComplete?.(i);
          return { ...t, secondsLeft: 0, done: true };
        }
        allDone = false;
        return { ...t, secondsLeft: t.secondsLeft - 1 };
      });

      const nowAllDone = updated.every(t => t.done);
      setParallelTimers(updated);
      stateRef.current.parallelTimers = updated;

      if (nowAllDone) {
        clearTick();
        onAllComplete?.();
        setIsRunning(false);
        setHasStarted(false);
      }
    }, 1000);
  }, [onIntervalComplete, onAllComplete]);

  // ======================== CONTROLS ========================
  const start = useCallback(() => {
    if (intervals.length === 0) return;

    if (mode === 'parallel') {
      if (!hasStarted) {
        const timers = intervals.map(i => ({
          secondsLeft: i.minutes * 60 + (i.seconds || 0),
          total: i.minutes * 60 + (i.seconds || 0),
          done: false,
        }));
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
        setHasStarted(true);
        setIsRunning(true);
        setTimeout(() => startTickingParallel(), 10);
      } else {
        setIsRunning(true);
        startTickingParallel();
      }
    } else {
      if (!hasStarted) {
        const total = intervals[0].minutes * 60 + (intervals[0].seconds || 0);
        setCurrentIndex(0); setSecondsLeft(total); setHasStarted(true); setIsRunning(true);
        stateRef.current = { ...stateRef.current, currentIndex: 0, secondsLeft: total };
        setTimeout(() => startTickingSerial(), 10);
      } else {
        setIsRunning(true);
        startTickingSerial();
      }
    }
  }, [intervals, hasStarted, mode, startTickingSerial, startTickingParallel]);

  const pause = useCallback(() => { clearTick(); setIsRunning(false); }, []);

  const reset = useCallback(() => {
    clearTick(); setIsRunning(false); setHasStarted(false);

    if (mode === 'parallel') {
      const timers = intervals.map(i => ({
        secondsLeft: i.minutes * 60 + (i.seconds || 0),
        total: i.minutes * 60 + (i.seconds || 0),
        done: false,
      }));
      setParallelTimers(timers);
      stateRef.current.parallelTimers = timers;
    } else {
      setCurrentIndex(0);
      const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
      setSecondsLeft(total);
      stateRef.current = { ...stateRef.current, currentIndex: 0, secondsLeft: total };
    }
  }, [intervals, mode]);

  useEffect(() => () => clearTick(), []);

  useEffect(() => {
    if (!hasStarted) {
      if (mode === 'parallel') {
        const timers = intervals.map(i => ({
          secondsLeft: i.minutes * 60 + (i.seconds || 0),
          total: i.minutes * 60 + (i.seconds || 0),
          done: false,
        }));
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
      } else {
        setCurrentIndex(0);
        const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
        setSecondsLeft(total);
        stateRef.current = { ...stateRef.current, currentIndex: 0, secondsLeft: total };
      }
    }
  }, [intervals, hasStarted, mode]);

  // ======================== COMPUTED ========================
  const totalSeconds = intervals[currentIndex] ? intervals[currentIndex].minutes * 60 + (intervals[currentIndex].seconds || 0) : 0;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  return { currentIndex, secondsLeft, isRunning, hasStarted, progress, parallelTimers, start, pause, reset };
}

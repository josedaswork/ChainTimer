import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer(intervals, onIntervalComplete, onAllComplete, mode = 'serial') {
  // --- Serial state ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // --- Parallel state: each timer has { secondsLeft, total, done, running } ---
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
  const ensureParallelTicking = useCallback(() => {
    if (tickRef.current) return; // already ticking
    tickRef.current = setInterval(() => {
      const timers = stateRef.current.parallelTimers;
      let anyRunning = false;
      const updated = timers.map((t, i) => {
        if (!t.running || t.done) return t;
        if (t.secondsLeft <= 1) {
          onIntervalComplete?.(i);
          return { ...t, secondsLeft: 0, done: true, running: false };
        }
        anyRunning = true;
        return { ...t, secondsLeft: t.secondsLeft - 1 };
      });

      setParallelTimers(updated);
      stateRef.current.parallelTimers = updated;

      const hasAnyRunning = updated.some(t => t.running && !t.done);
      const allFinishedOrIdle = updated.every(t => t.done || !t.running);
      const anyStartedEver = updated.some(t => t.done || t.running);

      if (!hasAnyRunning && anyStartedEver && allFinishedOrIdle && updated.filter(t => t.done).length === updated.length) {
        clearTick();
        onAllComplete?.();
        setIsRunning(false);
        setHasStarted(false);
      } else if (!hasAnyRunning) {
        clearTick();
        setIsRunning(false);
      }
    }, 1000);
  }, [onIntervalComplete, onAllComplete]);

  // Start ALL parallel timers at once
  const startAllParallel = useCallback(() => {
    const timers = intervals.map((iv, i) => {
      const existing = stateRef.current.parallelTimers[i];
      if (existing?.done) return existing; // already finished
      if (existing?.running) return existing; // already running
      const total = iv.minutes * 60 + (iv.seconds || 0);
      return { secondsLeft: existing?.secondsLeft ?? total, total, done: false, running: true };
    });
    setParallelTimers(timers);
    stateRef.current.parallelTimers = timers;
    setHasStarted(true);
    setIsRunning(true);
    ensureParallelTicking();
  }, [intervals, ensureParallelTicking]);

  // Start a SINGLE parallel timer by index
  const startSingle = useCallback((index) => {
    const timers = [...stateRef.current.parallelTimers];
    // Ensure the array is big enough (for newly added intervals)
    while (timers.length <= index) {
      const iv = intervals[timers.length];
      const total = iv ? iv.minutes * 60 + (iv.seconds || 0) : 0;
      timers.push({ secondsLeft: total, total, done: false, running: false });
    }
    if (timers[index].done) return;
    const iv = intervals[index];
    const total = iv.minutes * 60 + (iv.seconds || 0);
    timers[index] = { secondsLeft: timers[index].secondsLeft ?? total, total, done: false, running: true };
    setParallelTimers(timers);
    stateRef.current.parallelTimers = timers;
    setHasStarted(true);
    setIsRunning(true);
    ensureParallelTicking();
  }, [intervals, ensureParallelTicking]);

  // ======================== CONTROLS ========================
  const start = useCallback(() => {
    if (intervals.length === 0) return;

    if (mode === 'parallel') {
      if (!hasStarted) {
        startAllParallel();
      } else {
        // Resume: restart all that were running
        const timers = stateRef.current.parallelTimers.map(t => {
          if (t.done || t.secondsLeft <= 0) return t;
          return { ...t, running: true };
        });
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
        setIsRunning(true);
        ensureParallelTicking();
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
  }, [intervals, hasStarted, mode, startTickingSerial, startAllParallel, ensureParallelTicking]);

  const pause = useCallback(() => {
    clearTick();
    if (mode === 'parallel') {
      const timers = stateRef.current.parallelTimers.map(t => t.running ? { ...t, running: false } : t);
      setParallelTimers(timers);
      stateRef.current.parallelTimers = timers;
    }
    setIsRunning(false);
  }, [mode]);

  const reset = useCallback(() => {
    clearTick(); setIsRunning(false); setHasStarted(false);

    if (mode === 'parallel') {
      const timers = intervals.map(i => ({
        secondsLeft: i.minutes * 60 + (i.seconds || 0),
        total: i.minutes * 60 + (i.seconds || 0),
        done: false,
        running: false,
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

  // Sync parallel timers when intervals change (e.g. new interval added on the fly)
  useEffect(() => {
    if (mode === 'parallel') {
      setParallelTimers(prev => {
        const updated = intervals.map((iv, i) => {
          if (prev[i]) return prev[i]; // keep existing state
          const total = iv.minutes * 60 + (iv.seconds || 0);
          return { secondsLeft: total, total, done: false, running: false };
        });
        stateRef.current.parallelTimers = updated;
        return updated;
      });
    }
  }, [intervals, mode]);

  useEffect(() => {
    if (!hasStarted) {
      if (mode === 'parallel') {
        const timers = intervals.map(i => ({
          secondsLeft: i.minutes * 60 + (i.seconds || 0),
          total: i.minutes * 60 + (i.seconds || 0),
          done: false,
          running: false,
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

  return { currentIndex, secondsLeft, isRunning, hasStarted, progress, parallelTimers, start, startAllParallel, startSingle, pause, reset };
}

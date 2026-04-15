/**
 * @history
 * 2026-04-15 — Remove dead anyRunning var, extract initParallelTimers helper
 * 2026-04-14 — 3-second countdown before serial start, series repeat (x1–x5)
 * 2026-04-14 — pauseSingle / startSingle for individual parallel timer control
 * 2026-04-14 — unskipIndex in parallel resets done timer to full time
 * 2026-04-14 — skipIndex in parallel marks timer as done
 * 2026-04-14 — parallel mode: startAllParallel, independent countdowns
 * 2026-04-14 — serial mode: start, pause, reset, skip, unskip, progress
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer(intervals, onIntervalComplete, onAllComplete, mode = 'serial', seriesRepeat = 1) {
  // Helper: create fresh parallel timer state from intervals
  const initParallelTimers = useCallback(() =>
    intervals.map(iv => {
      const total = iv.minutes * 60 + (iv.seconds || 0);
      return { secondsLeft: total, total, done: false, running: false };
    }),
  [intervals]);

  // --- Serial state ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [skippedIndices, setSkippedIndices] = useState(new Set());
  const skippedRef = useRef(new Set());
  const [countdownLeft, setCountdownLeft] = useState(null);
  const [currentRepetition, setCurrentRepetition] = useState(1);

  // --- Parallel state: each timer has { secondsLeft, total, done, running } ---
  const [parallelTimers, setParallelTimers] = useState([]);

  // --- Shared state ---
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const tickRef = useRef(null);
  const stateRef = useRef({ currentIndex: 0, secondsLeft: 0, parallelTimers: [] });

  stateRef.current = { currentIndex, secondsLeft, parallelTimers, countdownLeft, currentRepetition, seriesRepeat };

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  // ======================== SERIAL MODE ========================
  const startTickingSerial = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      // --- Handle 3-second countdown ---
      if (stateRef.current.countdownLeft != null && stateRef.current.countdownLeft > 0) {
        const newCd = stateRef.current.countdownLeft - 1;
        stateRef.current.countdownLeft = newCd;
        setCountdownLeft(newCd > 0 ? newCd : null);
        return;
      }

      const { currentIndex: ci, secondsLeft: sl } = stateRef.current;
      if (sl <= 1) {
        onIntervalComplete?.(ci);
        let nextIndex = ci + 1;
        while (nextIndex < intervals.length && skippedRef.current.has(nextIndex)) {
          nextIndex++;
        }
        if (nextIndex < intervals.length) {
          const nextTotal = intervals[nextIndex].minutes * 60 + (intervals[nextIndex].seconds || 0);
          setCurrentIndex(nextIndex);
          setSecondsLeft(nextTotal);
          stateRef.current = { ...stateRef.current, currentIndex: nextIndex, secondsLeft: nextTotal };
        } else {
          // All intervals done — check for series repeat
          const rep = stateRef.current.currentRepetition;
          const maxRep = stateRef.current.seriesRepeat;
          if (rep < maxRep) {
            const newRep = rep + 1;
            stateRef.current.currentRepetition = newRep;
            setCurrentRepetition(newRep);
            let startIdx = 0;
            while (startIdx < intervals.length && skippedRef.current.has(startIdx)) startIdx++;
            if (startIdx < intervals.length) {
              const nextTotal = intervals[startIdx].minutes * 60 + (intervals[startIdx].seconds || 0);
              setCurrentIndex(startIdx);
              setSecondsLeft(nextTotal);
              stateRef.current = { ...stateRef.current, currentIndex: startIdx, secondsLeft: nextTotal };
            } else {
              clearTick();
              onAllComplete?.();
              setSecondsLeft(0);
              setIsRunning(false);
              setHasStarted(false);
            }
          } else {
            clearTick();
            onAllComplete?.();
            setSecondsLeft(0);
            setIsRunning(false);
            setHasStarted(false);
            stateRef.current = { ...stateRef.current, currentIndex: ci, secondsLeft: 0 };
          }
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
      const updated = timers.map((pt, i) => {
        if (!pt.running || pt.done) return pt;
        if (pt.secondsLeft <= 1) {
          onIntervalComplete?.(i);
          return { ...pt, secondsLeft: 0, done: true, running: false };
        }
        return { ...pt, secondsLeft: pt.secondsLeft - 1 };
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

  // Pause a SINGLE parallel timer by index
  const pauseSingle = useCallback((index) => {
    const timers = [...stateRef.current.parallelTimers];
    if (timers[index]?.running && !timers[index]?.done) {
      timers[index] = { ...timers[index], running: false };
      setParallelTimers(timers);
      stateRef.current.parallelTimers = timers;
      // If no timers are running anymore, stop the tick
      if (!timers.some(t => t.running && !t.done)) {
        clearTick();
        setIsRunning(false);
      }
    }
  }, []);

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
        let startIdx = 0;
        while (startIdx < intervals.length && skippedRef.current.has(startIdx)) {
          startIdx++;
        }
        if (startIdx >= intervals.length) return;
        const total = intervals[startIdx].minutes * 60 + (intervals[startIdx].seconds || 0);
        setCurrentIndex(startIdx); setSecondsLeft(total); setHasStarted(true); setIsRunning(true);
        setCountdownLeft(3); setCurrentRepetition(1);
        stateRef.current = { ...stateRef.current, currentIndex: startIdx, secondsLeft: total, countdownLeft: 3, currentRepetition: 1 };
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
    setSkippedIndices(new Set());
    skippedRef.current = new Set();
    setCountdownLeft(null); setCurrentRepetition(1);

    if (mode === 'parallel') {
      const timers = initParallelTimers();
      setParallelTimers(timers);
      stateRef.current.parallelTimers = timers;
    } else {
      setCurrentIndex(0);
      const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
      setSecondsLeft(total);
      stateRef.current = { ...stateRef.current, currentIndex: 0, secondsLeft: total };
    }
  }, [intervals, mode, initParallelTimers]);

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
        const timers = initParallelTimers();
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
      } else {
        setCurrentIndex(0);
        const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
        setSecondsLeft(total);
        stateRef.current = { ...stateRef.current, currentIndex: 0, secondsLeft: total };
      }
    }
  }, [intervals, hasStarted, mode, initParallelTimers]);

  // ======================== SKIP ========================
  const skipIndex = useCallback((index) => {
    if (mode === 'parallel') {
      const timers = [...stateRef.current.parallelTimers];
      if (timers[index] && !timers[index].done) {
        timers[index] = { ...timers[index], done: true, running: false, secondsLeft: 0 };
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
      }
      return;
    }

    // Serial mode
    const newSkipped = new Set(skippedRef.current);
    newSkipped.add(index);
    setSkippedIndices(newSkipped);
    skippedRef.current = newSkipped;

    if (hasStarted && index === stateRef.current.currentIndex) {
      let nextIndex = index + 1;
      while (nextIndex < intervals.length && newSkipped.has(nextIndex)) {
        nextIndex++;
      }
      if (nextIndex < intervals.length) {
        const nextTotal = intervals[nextIndex].minutes * 60 + (intervals[nextIndex].seconds || 0);
        setCurrentIndex(nextIndex);
        setSecondsLeft(nextTotal);
        stateRef.current = { ...stateRef.current, currentIndex: nextIndex, secondsLeft: nextTotal };
      } else {
        clearTick();
        onAllComplete?.();
        setSecondsLeft(0);
        setIsRunning(false);
        setHasStarted(false);
      }
    }
  }, [mode, hasStarted, intervals, onAllComplete]);

  // ======================== UNSKIP ========================
  const unskipIndex = useCallback((index) => {
    if (mode === 'parallel') {
      const timers = [...stateRef.current.parallelTimers];
      if (timers[index]?.done) {
        const iv = intervals[index];
        const total = iv.minutes * 60 + (iv.seconds || 0);
        timers[index] = { secondsLeft: total, total, done: false, running: false };
        setParallelTimers(timers);
        stateRef.current.parallelTimers = timers;
      }
      return;
    }

    // Serial mode
    const newSkipped = new Set(skippedRef.current);
    newSkipped.delete(index);
    setSkippedIndices(newSkipped);
    skippedRef.current = newSkipped;
  }, [mode, intervals]);

  // ======================== COMPUTED ========================
  const totalSeconds = intervals[currentIndex] ? intervals[currentIndex].minutes * 60 + (intervals[currentIndex].seconds || 0) : 0;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  return { currentIndex, secondsLeft, isRunning, hasStarted, progress, parallelTimers, start, startAllParallel, startSingle, pauseSingle, pause, reset, skipIndex, unskipIndex, skippedIndices, countdownLeft, currentRepetition };
}

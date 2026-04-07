import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer(intervals, onIntervalComplete, onAllComplete) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const tickRef = useRef(null);
  const stateRef = useRef({ currentIndex: 0, secondsLeft: 0 });

  stateRef.current = { currentIndex, secondsLeft };

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const startTicking = useCallback(() => {
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
          stateRef.current = { currentIndex: nextIndex, secondsLeft: nextTotal };
        } else {
          clearTick();
          onIntervalComplete?.(ci);
          onAllComplete?.();
          setSecondsLeft(0);
          setIsRunning(false);
          setHasStarted(false);
          stateRef.current = { currentIndex: ci, secondsLeft: 0 };
        }
      } else {
        const next = sl - 1;
        setSecondsLeft(next);
        stateRef.current.secondsLeft = next;
      }
    }, 1000);
  }, [intervals, onIntervalComplete, onAllComplete]);

  const start = useCallback(() => {
    if (intervals.length === 0) return;
    if (!hasStarted) {
      const total = intervals[0].minutes * 60 + (intervals[0].seconds || 0);
      setCurrentIndex(0); setSecondsLeft(total); setHasStarted(true); setIsRunning(true);
      stateRef.current = { currentIndex: 0, secondsLeft: total };
      setTimeout(() => startTicking(), 10);
    } else {
      setIsRunning(true);
      startTicking();
    }
  }, [intervals, hasStarted, startTicking]);

  const pause = useCallback(() => { clearTick(); setIsRunning(false); }, []);

  const reset = useCallback(() => {
    clearTick(); setIsRunning(false); setHasStarted(false); setCurrentIndex(0);
    const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
    setSecondsLeft(total);
    stateRef.current = { currentIndex: 0, secondsLeft: total };
  }, [intervals]);

  useEffect(() => () => clearTick(), []);

  useEffect(() => {
    if (!hasStarted) {
      setCurrentIndex(0);
      const total = intervals.length > 0 ? intervals[0].minutes * 60 + (intervals[0].seconds || 0) : 0;
      setSecondsLeft(total);
      stateRef.current = { currentIndex: 0, secondsLeft: total };
    }
  }, [intervals, hasStarted]);

  const totalSeconds = intervals[currentIndex] ? intervals[currentIndex].minutes * 60 + (intervals[currentIndex].seconds || 0) : 0;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  return { currentIndex, secondsLeft, isRunning, hasStarted, progress, start, pause, reset };
}

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronLeft, Plus, Layers, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TimerDisplay from '../components/timer/TimerDisplay';
import IntervalForm from '../components/timer/IntervalForm';
import DraggableIntervalList, { getIntervalColor } from '../components/timer/DraggableIntervalList';
import useTimer from '../components/timer/useTimer';
import useAlarm from '../components/timer/useAlarm';
import { useTasks } from '../lib/useTasks';
import useNotification from '../lib/useNotification';

export default function TaskTimer({ taskId, onBack }) {
  const { tasks, addInterval, updateInterval, deleteInterval, reorderIntervals } = useTasks();
  const task = tasks.find(t => t.id === taskId);
  const intervals = task?.intervals || [];
  const mode = task?.type || 'serial';
  const isParallel = mode === 'parallel';
  const [showForm, setShowForm] = useState(false);
  const [completedFlash, setCompletedFlash] = useState(false);
  const { playAlarm, vibrate } = useAlarm();

  const handleIntervalComplete = useCallback((index) => {
    const interval = intervals[index];
    playAlarm(interval?.sound || 'beep');
    if (interval?.vibration) vibrate();
    setCompletedFlash(true);
    setTimeout(() => setCompletedFlash(false), 600);
  }, [playAlarm, vibrate, intervals]);

  const handleAllComplete = useCallback(() => {
    toast.success(`¡${task?.name} completado! 🎉`);
  }, [task]);

  const { currentIndex, secondsLeft, isRunning, hasStarted, progress, parallelTimers, start, pause, reset } =
    useTimer(intervals, handleIntervalComplete, handleAllComplete, mode);

  // --- Persistent Android notification ---
  const { startNotification, updateNotification, stopNotification, addActionListener } = useNotification();
  const actionsRef = useRef({ start, pause, reset, isRunning });
  actionsRef.current = { start, pause, reset, isRunning };

  useEffect(() => {
    if (hasStarted) {
      startNotification(`${task?.emoji} ${task?.name}`, 'Iniciando...');
    } else {
      stopNotification();
    }
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let label, secs;
    if (isParallel && parallelTimers.length > 0) {
      const active = parallelTimers.map((t, i) => ({ ...t, i })).filter(t => !t.done);
      if (active.length === 0) return;
      const next = active.reduce((a, b) => a.secondsLeft < b.secondsLeft ? a : b);
      label = intervals[next.i]?.name || 'Timer';
      secs = next.secondsLeft;
    } else {
      label = intervals[currentIndex]?.name || 'Timer';
      secs = secondsLeft;
    }
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const status = isRunning ? '' : ' ⏸';
    updateNotification(`${task?.emoji} ${task?.name}`, `${label} — ${mm}:${ss}${status}`);
  }, [secondsLeft, isRunning, currentIndex, parallelTimers]);

  useEffect(() => {
    addActionListener((buttonId) => {
      const a = actionsRef.current;
      if (buttonId === 1) { a.isRunning ? a.pause() : a.start(); }
      else if (buttonId === 2) { a.reset(); }
    });
  }, [addActionListener]);

  if (!task) return null;

  const currentLabel = intervals[currentIndex]?.name || '';
  const currentColor = intervals.length > 0 ? getIntervalColor(currentIndex) : undefined;

  // For parallel mode: find the interval with least time remaining (that isn't done)
  const activeParallelIndex = isParallel && hasStarted && parallelTimers.length > 0
    ? parallelTimers.reduce((minIdx, t, i, arr) => {
        if (t.done) return minIdx;
        if (minIdx === -1) return i;
        return t.secondsLeft < arr[minIdx].secondsLeft ? i : minIdx;
      }, -1)
    : -1;

  const parallelSecondsLeft = activeParallelIndex >= 0 ? parallelTimers[activeParallelIndex].secondsLeft : 0;
  const parallelTotal = activeParallelIndex >= 0 ? parallelTimers[activeParallelIndex].total : 0;
  const parallelProgress = parallelTotal > 0 ? (parallelTotal - parallelSecondsLeft) / parallelTotal : 0;
  const parallelLabel = activeParallelIndex >= 0 ? intervals[activeParallelIndex]?.name : '';
  const parallelColor = activeParallelIndex >= 0 ? getIntervalColor(activeParallelIndex) : undefined;
  const allParallelDone = isParallel && hasStarted && parallelTimers.length > 0 && parallelTimers.every(t => t.done);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {completedFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-accent z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl -ml-1" onClick={() => { reset(); onBack(); }}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-2xl">{task.emoji}</span>
        <h1 className="text-xl font-bold text-foreground flex-1">{task.name}</h1>
        <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
          {isParallel ? <><Layers className="h-3 w-3" />Paralelo</> : <><ArrowRight className="h-3 w-3" />Serie</>}
        </span>
      </div>

      <div className="flex justify-center py-6">
        {isParallel ? (
          <TimerDisplay
            secondsLeft={hasStarted ? parallelSecondsLeft : (intervals.length > 0 ? Math.max(...intervals.map(i => i.minutes * 60 + (i.seconds || 0))) : 0)}
            progress={hasStarted ? parallelProgress : 0}
            label={hasStarted ? (allParallelDone ? '¡Completado!' : `Próximo: ${parallelLabel}`) : (intervals.length > 0 ? 'Todos a la vez' : '')}
            isRunning={isRunning}
            intervalColor={parallelColor}
          />
        ) : (
          <TimerDisplay secondsLeft={secondsLeft} progress={hasStarted ? progress : 0} label={hasStarted ? currentLabel : (intervals.length > 0 ? intervals[0].name : '')} isRunning={isRunning} intervalColor={currentColor} />
        )}
      </div>

      <div className="flex items-center justify-center gap-3 px-4 mb-6">
        {!isRunning ? (
          <Button onClick={start} disabled={intervals.length === 0} size="lg" className="rounded-full px-10 gap-2 text-base font-semibold h-14 shadow-lg shadow-primary/20">
            <Play className="h-5 w-5" />{hasStarted ? 'Reanudar' : 'Iniciar'}
          </Button>
        ) : (
          <Button onClick={pause} size="lg" variant="secondary" className="rounded-full px-10 gap-2 text-base font-semibold h-14">
            <Pause className="h-5 w-5" />Pausar
          </Button>
        )}
        {hasStarted && (
          <Button onClick={reset} size="lg" variant="outline" className="rounded-full h-14 px-6">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 px-4 overflow-y-auto pb-32">
        <DraggableIntervalList intervals={intervals} currentIndex={currentIndex} hasStarted={hasStarted} onRemove={(id) => deleteInterval(taskId, id)} onEdit={(id, data) => updateInterval(taskId, id, data)} onReorder={(newList) => reorderIntervals(taskId, newList)} mode={mode} parallelTimers={parallelTimers} />
      </div>

      {!hasStarted && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <AnimatePresence>
            {showForm ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="bg-card rounded-2xl border border-border p-4 shadow-xl">
                <IntervalForm onAdd={(i) => { addInterval(taskId, i); setShowForm(false); }} disabled={false} />
                <Button variant="ghost" className="w-full mt-2 text-muted-foreground" onClick={() => setShowForm(false)}>Cancelar</Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button variant="outline" className="w-full h-14 rounded-2xl text-base font-semibold gap-2 border-dashed" onClick={() => setShowForm(true)}>
                  <Plus className="h-5 w-5" />Añadir intervalo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

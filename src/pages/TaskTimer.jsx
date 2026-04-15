/**
 * @history
 * 2026-04-15 — Add overflow-visible to popup containers to prevent PieMenu clipping
 * 2026-04-15 — Add 'reps' label next to series repeat button for clarity
 * 2026-04-14 — Start sound plays after countdown, not before
 * 2026-04-14 — Series repeat multiplier (x1–x5 PieMenu), 3-second countdown
 * 2026-04-14 — i18n: all labels, buttons, toasts, notifications use t()
 * 2026-04-14 — Start sound on handleStart/handleStartAll
 * 2026-04-14 — Back button no longer resets timer; reports isRunning to parent
 * 2026-04-14 — Edit interval popup, serial/parallel mode controls
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronLeft, Plus, Layers, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TimerDisplay from '../components/timer/TimerDisplay';
import IntervalForm, { usePieMenu } from '../components/timer/IntervalForm';
import PieMenu from '../components/timer/PieMenu';
import DraggableIntervalList, { getIntervalColor } from '../components/timer/DraggableIntervalList';
import useTimer from '../components/timer/useTimer';
import useAlarm from '../components/timer/useAlarm';
import { useTasks } from '../lib/useTasks';
import { useI18n } from '../lib/i18n';
import useNotification from '../lib/useNotification';

export default function TaskTimer({ taskId, onBack, onRunningChange }) {
  const { tasks, addInterval, updateInterval, deleteInterval, duplicateInterval, reorderIntervals } = useTasks();
  const { t } = useI18n();
  const task = tasks.find(t => t.id === taskId);
  const intervals = task?.intervals || [];
  const mode = task?.type || 'serial';
  const isParallel = mode === 'parallel';
  const [completedFlash, setCompletedFlash] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInterval, setEditingInterval] = useState(null);
  const [seriesRepeat, setSeriesRepeat] = useState(1);
  const { playAlarm, vibrate, playStartSound } = useAlarm();

  const handleIntervalComplete = useCallback((index) => {
    const interval = intervals[index];
    playAlarm(interval?.sound || 'beep');
    if (interval?.vibration) vibrate();
    setCompletedFlash(true);
    setTimeout(() => setCompletedFlash(false), 600);
  }, [playAlarm, vibrate, intervals]);

  const handleAllComplete = useCallback(() => {
    toast.success(t('taskCompleted', { name: task?.name }));
  }, [task]);

  const { currentIndex, secondsLeft, isRunning, hasStarted, progress, parallelTimers, start, startAllParallel, startSingle, pauseSingle, pause, reset, skipIndex, unskipIndex, skippedIndices, countdownLeft, currentRepetition } =
    useTimer(intervals, handleIntervalComplete, handleAllComplete, mode, seriesRepeat);

  const handleStart = useCallback(() => { start(); }, [start]);
  const handleStartAll = useCallback(() => { playStartSound(); startAllParallel(); }, [playStartSound, startAllParallel]);

  // --- Series repeat PieMenu (serial mode only) ---
  const REPEAT_OPTIONS = ['x1', 'x2', 'x3', 'x4', 'x5'];
  const repeatPie = usePieMenu(REPEAT_OPTIONS, (val) => setSeriesRepeat(parseInt(val.replace('x', ''))), 'down');

  // Play start sound when countdown finishes
  const prevCountdownRef = useRef(null);
  useEffect(() => {
    if (prevCountdownRef.current != null && prevCountdownRef.current > 0 && countdownLeft == null) {
      playStartSound();
    }
    prevCountdownRef.current = countdownLeft;
  }, [countdownLeft, playStartSound]);

  // Report running state to parent for confirmation dialog
  useEffect(() => {
    onRunningChange?.(hasStarted && isRunning);
  }, [hasStarted, isRunning, onRunningChange]);

  // --- Persistent Android notification ---
  const { startNotification, updateNotification, stopNotification, addActionListener } = useNotification();
  const actionsRef = useRef({ start, pause, reset, isRunning });
  actionsRef.current = { start, pause, reset, isRunning };

  useEffect(() => {
    if (hasStarted) {
      startNotification(`${task?.emoji} ${task?.name}`, t('starting'));
    } else {
      stopNotification();
    }
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let label, secs;
    if (isParallel && parallelTimers.length > 0) {
      const active = parallelTimers.map((t, i) => ({ ...t, i })).filter(t => t.running && !t.done);
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

  // --- Computed display values ---
  const currentLabel = intervals[currentIndex]?.name || '';
  const currentColor = intervals.length > 0 ? getIntervalColor(currentIndex) : undefined;

  const activeRunning = isParallel ? parallelTimers.filter(t => t.running && !t.done) : [];
  const activeParallelIndex = activeRunning.length > 0
    ? parallelTimers.reduce((minIdx, t, i, arr) => {
        if (!t.running || t.done) return minIdx;
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
  const anyParallelRunning = parallelTimers.some(t => t.running && !t.done);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {completedFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-accent z-50 pointer-events-none" />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl -ml-1" onClick={() => { onBack(); }}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-2xl">{task.emoji}</span>
        <h1 className="text-xl font-bold text-foreground flex-1">{task.name}</h1>
        <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
          {isParallel ? <><Layers className="h-3 w-3" />{t('parallel')}</> : <><ArrowRight className="h-3 w-3" />{t('serial')}</>}
        </span>
      </div>

      {/* Timer Display */}
      <div className="flex justify-center py-4">
        {isParallel ? (
          <TimerDisplay
            secondsLeft={hasStarted ? parallelSecondsLeft : (intervals.length > 0 ? Math.max(...intervals.map(i => i.minutes * 60 + (i.seconds || 0))) : 0)}
            progress={hasStarted ? parallelProgress : 0}
            label={hasStarted ? (allParallelDone ? t('completed') : (activeRunning.length > 0 ? t('nextUp', { name: parallelLabel }) : t('waiting'))) : (intervals.length > 0 ? t('readyToStart') : '')}
            isRunning={anyParallelRunning}
            intervalColor={parallelColor}
          />
        ) : (() => {
          // Find first non-skipped interval for idle display
          const firstAvailable = intervals.findIndex((_, i) => !skippedIndices?.has(i));
          const idleLabel = firstAvailable >= 0 ? intervals[firstAvailable].name : '';
          const idleSeconds = firstAvailable >= 0 ? intervals[firstAvailable].minutes * 60 + (intervals[firstAvailable].seconds || 0) : 0;
          const isCountingDown = countdownLeft != null && countdownLeft > 0;
          const displayLabel = isCountingDown ? t('getReady')
            : hasStarted ? (seriesRepeat > 1 ? `${currentLabel} \u2014 ${t('seriesRound', { current: currentRepetition, total: seriesRepeat })}` : currentLabel)
            : idleLabel;
          return (
            <TimerDisplay
              secondsLeft={hasStarted ? secondsLeft : idleSeconds}
              progress={isCountingDown ? (3 - countdownLeft) / 3 : (hasStarted ? progress : 0)}
              label={displayLabel}
              isRunning={isRunning && !isCountingDown}
              intervalColor={isCountingDown ? undefined : currentColor}
              countdownValue={isCountingDown ? countdownLeft : undefined}
              dimTime={repeatPie.visible}
            >
              {!isParallel && !hasStarted && (
                <div
                  ref={repeatPie.wrapperRef}
                  onPointerDown={repeatPie.onPointerDown}
                  onContextMenu={e => e.preventDefault()}
                  className={`relative mt-2 ${repeatPie.visible ? 'z-20' : ''}`}
                  style={{ touchAction: 'none' }}
                >
                  <button className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors", seriesRepeat > 1 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                    x{seriesRepeat} {t('reps')}
                  </button>
                  <PieMenu options={REPEAT_OPTIONS} highlightedIndex={repeatPie.highlightedIndex} visible={repeatPie.visible} direction="down" />
                </div>
              )}
              {!isParallel && hasStarted && seriesRepeat > 1 && !isCountingDown && (
                <span className="mt-1 text-xs font-semibold text-primary/70">
                  {currentRepetition}/{seriesRepeat}
                </span>
              )}
            </TimerDisplay>
          );
        })()}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 mb-4">
        {isParallel ? (
          <>
            {/* Parallel: "Start All" or "Pause All" */}
            {!anyParallelRunning ? (
              <Button onClick={handleStartAll} disabled={intervals.length === 0} size="lg" className="rounded-full px-8 gap-2 text-base font-semibold h-12 shadow-lg shadow-primary/20">
                <Play className="h-5 w-5" />{hasStarted ? t('resumeAll') : t('startAll')}
              </Button>
            ) : (
              <Button onClick={pause} size="lg" variant="secondary" className="rounded-full px-8 gap-2 text-base font-semibold h-12">
                <Pause className="h-5 w-5" />{t('pauseAll')}
              </Button>
            )}
            {hasStarted && (
              <Button onClick={reset} size="lg" variant="outline" className="rounded-full h-12 px-5">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <>
            {!isRunning ? (
              <Button onClick={handleStart} disabled={intervals.length === 0} size="lg" className="rounded-full px-10 gap-2 text-base font-semibold h-14 shadow-lg shadow-primary/20">
                <Play className="h-5 w-5" />{hasStarted ? t('resume') : t('start')}
              </Button>
            ) : (
              <Button onClick={pause} size="lg" variant="secondary" className="rounded-full px-10 gap-2 text-base font-semibold h-14">
                <Pause className="h-5 w-5" />{t('pause')}
              </Button>
            )}
            {hasStarted && (
              <Button onClick={reset} size="lg" variant="outline" className="rounded-full h-14 px-6">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Interval list */}
      <div className={cn("flex-1 px-4 overflow-y-auto pb-24")}>
        <DraggableIntervalList
          intervals={intervals}
          currentIndex={currentIndex}
          hasStarted={hasStarted}
          onRemove={(id) => deleteInterval(taskId, id)}
          onEdit={(id, data) => updateInterval(taskId, id, data)}
          onReorder={(newList) => reorderIntervals(taskId, newList)}
          mode={mode}
          parallelTimers={parallelTimers}
          onStartSingle={startSingle}
          onPauseSingle={pauseSingle}
          onSkip={skipIndex}
          onUnskip={unskipIndex}
          onDuplicate={(id) => duplicateInterval(taskId, id)}
          skippedIndices={skippedIndices}
          onEditPopup={(interval) => setEditingInterval(interval)}
        />
      </div>

      {/* Floating Add Interval button */}
      <Button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 z-30"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Interval popup */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="bg-card rounded-t-2xl border-t border-border p-4 pb-8 w-full max-w-md overflow-visible"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('newInterval')}</h3>
              <IntervalForm onAdd={(i) => { addInterval(taskId, i); setShowAddForm(false); }} disabled={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Interval popup */}
      <AnimatePresence>
        {editingInterval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center"
            onClick={() => setEditingInterval(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="bg-card rounded-t-2xl border-t border-border p-4 pb-8 w-full max-w-md overflow-visible"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('editInterval')}</h3>
              <IntervalForm
                key={editingInterval.id}
                initialValues={editingInterval}
                onAdd={(data) => { updateInterval(taskId, editingInterval.id, data); setEditingInterval(null); }}
                disabled={false}
                submitLabel={t('save')}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @history
 * 2026-04-15 — Fix peek-bounce on Android: use pointerDown/Up for all platforms, nullify on dragStart
 * 2026-04-15 — Fix: swipe-menu buttons always behind card (z-0) so they hide when swiping back
 * 2026-04-15 — Fix: swipe-menu buttons use onPointerUp instead of onClick for reliable Android first-tap
 * 2026-04-14 — Fix: swipe-menu buttons z-index raised above card when revealed (Android first-tap fix)
 * 2026-04-14 — Fix: Android swipe-menu buttons now work on first tap (touch-action + stopPropagation)
 * 2026-04-14 — Fix: swipe-left while menu open closes menu instead of skip/unskip
 * 2026-04-14 — i18n: all strings use t()
 * 2026-04-14 — Play/Pause per parallel interval (before and after global start)
 * 2026-04-14 — Unskip works in parallel mode (checks parallelDone)
 * 2026-04-14 — Swipe threshold increased to 20%
 * 2026-04-14 — Duplicate interval button, glass-card effect, swipe gestures
 */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Trash2, Clock, Volume2, Smartphone, Play, Pause, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from '@/lib/i18n';
import { motion, useAnimation } from 'framer-motion';

export const COLORS = [
  'hsl(35, 90%, 55%)',
  'hsl(210, 70%, 50%)',
  'hsl(160, 55%, 42%)',
  'hsl(340, 70%, 55%)',
  'hsl(280, 55%, 55%)',
  'hsl(45, 85%, 60%)',
];
export function getIntervalColor(index) { return COLORS[index % COLORS.length]; }

function formatTime(minutes, seconds) {
  const s = seconds || 0;
  if (minutes > 0 && s > 0) return `${minutes}m ${s}s`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}

function formatCountdown(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function SwipeableRow({ interval, index, drag, snapshot, isActive, isDone, isSkipped, canDrag, canEdit, color, isParallel, pTimer, hasStarted, onStartSingle, onPauseSingle, onRemove, onEdit, onDuplicate, onSkip, onUnskip, revealedId, setRevealedId }) {
  const controls = useAnimation();
  const cardRef = React.useRef(null);
  const isRevealed = revealedId === interval.id;
  const parallelDone = isParallel && pTimer?.done;
  const finished = isDone || isSkipped || parallelDone;
  const tapStartRef = React.useRef(null);

  useEffect(() => {
    if (!isRevealed) {
      controls.start({ x: 0, transition: { duration: 0.15, ease: 'easeOut' } });
    }
  }, [isRevealed, controls]);

  const handleDragStart = () => {
    // Mark that a real drag happened, so pointerUp won't fire peek
    tapStartRef.current = null;
  };

  // Subtle peek-bounce animation
  const peekHint = async () => {
    if (isRevealed) return;
    await controls.start({ x: 28, transition: { duration: 0.12, ease: 'easeOut' } });
    controls.start({ x: 0, transition: { duration: 0.25, type: 'spring', stiffness: 400, damping: 20 } });
  };

  const handleCardPointerDown = () => {
    tapStartRef.current = Date.now();
  };

  const handleCardPointerUp = () => {
    if (!tapStartRef.current) return; // drag started → ignore
    const tapDuration = Date.now() - tapStartRef.current;
    tapStartRef.current = null;
    if (tapDuration < 200) peekHint();
  };

  const handleDragEnd = async (e, info) => {
    const w = cardRef.current?.offsetWidth || 300;
    const threshold = w * 0.15;

    if (info.offset.x < -threshold) {
      if (isRevealed) {
        // Menu is open — just close it, don't skip
        setRevealedId(null);
      } else if (isSkipped || parallelDone) {
        onUnskip(index);
      } else {
        onSkip(index);
      }
      controls.start({ x: 0, transition: { duration: 0.15, ease: 'easeOut' } });
    } else if (info.offset.x > threshold) {
      setRevealedId(interval.id);
      controls.start({ x: 140, transition: { duration: 0.15, ease: 'easeOut' } });
    } else {
      controls.start({ x: 0, transition: { duration: 0.12, ease: 'easeOut' } });
      if (isRevealed) setRevealedId(null);
    }
  };

  const closeMenu = () => {
    setRevealedId(null);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind the card (raised above card when revealed) */}
      <div
        className="absolute inset-y-0 left-0 flex items-center gap-1.5 pl-2 z-0"
        style={{ touchAction: 'manipulation' }}
      >
        <button
          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={e => e.stopPropagation()}
          onPointerUp={() => { closeMenu(); onEdit(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground bg-secondary hover:bg-secondary/80 active:bg-secondary/70"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={e => e.stopPropagation()}
          onPointerUp={() => { closeMenu(); onDuplicate(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground bg-secondary hover:bg-secondary/80 active:bg-secondary/70"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={e => e.stopPropagation()}
          onPointerUp={() => { closeMenu(); onRemove(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-destructive bg-secondary hover:bg-destructive/20 active:bg-destructive/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Swipeable card on top */}
      <motion.div
        ref={cardRef}
        animate={controls}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -150, right: 160 }}
        dragElastic={0.35}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handleCardPointerDown}
        onPointerUp={handleCardPointerUp}
        className={cn(
          "relative z-10 rounded-xl glass-card",
          snapshot?.isDragging && "shadow-lg",
          isActive && "shadow-md shadow-primary/10"
        )}
        style={{
          touchAction: 'none',
          borderColor: finished ? 'hsl(140, 55%, 45%)' : isActive ? 'hsla(35, 90%, 55%, 0.4)' : undefined,
        }}
      >
        <div className={cn("flex items-center gap-2 px-2 py-2.5", finished && "opacity-50")}>
          {/* Drag handle */}
          {canDrag && (
            <div {...drag?.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Play/Pause button for individual control in parallel mode */}
          {isParallel && pTimer && !pTimer.done && pTimer.running && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0" onClick={() => onPauseSingle?.(index)}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {isParallel && pTimer && !pTimer.running && !pTimer.done && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary shrink-0" onClick={() => onStartSingle?.(index)}>
              <Play className="h-4 w-4" />
            </Button>
          )}

          {/* Color dot */}
          {isActive ? (
            <motion.div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
          ) : (
            !finished && !(isParallel && pTimer && !pTimer.running && !pTimer.done) && (
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: finished ? 'hsl(140, 50%, 45%)' : color }} />
            )
          )}

          <span className={cn("flex-1 text-sm font-medium truncate", finished && "line-through text-muted-foreground/70")}>{interval.name}</span>

          {interval.sound && interval.sound !== 'beep' && <Volume2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
          {interval.vibration && <Smartphone className="h-3 w-3 text-muted-foreground/50 shrink-0" />}

          {/* Countdown or static time */}
          {isParallel && pTimer ? (() => {
            const paused = !pTimer.running && !pTimer.done && pTimer.secondsLeft < pTimer.total;
            return (
              <span className={cn("font-mono text-xs tabular-nums shrink-0 font-semibold", pTimer.done ? "text-green-500/70 line-through" : pTimer.running ? "text-foreground" : paused ? "text-primary/70" : "text-muted-foreground")}>
                {pTimer.done ? formatTime(interval.minutes, interval.seconds) : (pTimer.running || paused) ? formatCountdown(pTimer.secondsLeft) : formatTime(interval.minutes, interval.seconds)}
              </span>
            );
          })() : (
            <span className={cn("font-mono text-xs tabular-nums shrink-0", finished ? "text-green-500/70 line-through" : "text-muted-foreground")}>
              {formatTime(interval.minutes, interval.seconds)}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function DraggableIntervalList({ intervals, currentIndex, hasStarted, onRemove, onEdit, onReorder, mode, parallelTimers, onStartSingle, onPauseSingle, onSkip, onUnskip, onDuplicate, skippedIndices, onEditPopup }) {
  const [revealedId, setRevealedId] = useState(null);
  const { t } = useI18n();
  const isParallel = mode === 'parallel';

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(intervals);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder(items);
  };

  const totalTime = intervals.reduce((s, i) => s + i.minutes * 60 + (i.seconds || 0), 0);
  const totalMin = Math.floor(totalTime / 60), totalSec = totalTime % 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('intervals')} ({intervals.length})</span>
        {intervals.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalMin > 0 ? `${totalMin}m` : ''}{totalSec > 0 ? ` ${totalSec}s` : totalMin === 0 ? '0s' : ''}
          </span>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="intervals">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
              {intervals.map((interval, index) => {
                const pTimer = isParallel ? parallelTimers?.[index] : null;
                const isActive = hasStarted && (isParallel ? (pTimer?.running && !pTimer?.done) : index === currentIndex);
                const isDone = hasStarted && (isParallel ? pTimer?.done : index < currentIndex);
                const isSkipped = !isParallel && skippedIndices?.has(index);
                const canEdit = isParallel ? (!pTimer?.running && !pTimer?.done) : !hasStarted;
                const canDrag = isParallel ? !hasStarted : !hasStarted;
                const color = getIntervalColor(index);

                return (
                  <Draggable key={interval.id} draggableId={String(interval.id)} index={index} isDragDisabled={!canDrag}>
                    {(drag, snapshot) => (
                      <div ref={drag.innerRef} {...drag.draggableProps}>
                          <SwipeableRow
                            interval={interval}
                            index={index}
                            drag={drag}
                            snapshot={snapshot}
                            isActive={isActive}
                            isDone={isDone}
                            isSkipped={isSkipped}
                            canDrag={canDrag}
                            canEdit={canEdit}
                            color={color}
                            isParallel={isParallel}
                            pTimer={pTimer}
                            hasStarted={hasStarted}
                            onStartSingle={onStartSingle}
                            onPauseSingle={onPauseSingle}
                            onRemove={() => onRemove(interval.id)}
                            onEdit={() => onEditPopup?.(interval)}
                            onDuplicate={() => onDuplicate?.(interval.id)}
                            onSkip={onSkip}
                            onUnskip={onUnskip}
                            revealedId={revealedId}
                            setRevealedId={setRevealedId}
                          />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {intervals.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-25" />
          <p className="text-sm">{t('addIntervalsToStart')}</p>
        </div>
      )}
    </div>
  );
}

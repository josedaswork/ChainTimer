import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Trash2, Clock, Volume2, Smartphone, Play, CheckCircle2, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IntervalEditRow from './IntervalEditRow';
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

function SwipeableRow({ interval, index, drag, snapshot, isActive, isDone, isSkipped, canDrag, canEdit, color, isParallel, pTimer, hasStarted, onStartSingle, onRemove, onEdit, onDuplicate, onSkip, revealedId, setRevealedId }) {
  const controls = useAnimation();
  const isRevealed = revealedId === interval.id;

  useEffect(() => {
    if (!isRevealed) {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } });
    }
  }, [isRevealed, controls]);

  const handleDragEnd = async (e, info) => {
    if (info.offset.x < -80 && info.velocity.x <= 0) {
      await controls.start({ x: -300, opacity: 0, transition: { duration: 0.2 } });
      onSkip(index);
      controls.set({ x: 0, opacity: 1 });
    } else if (info.offset.x > 60) {
      setRevealedId(interval.id);
      controls.start({ x: 140, transition: { type: 'spring', stiffness: 400, damping: 35 } });
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 35 } });
      if (isRevealed) setRevealedId(null);
    }
  };

  const closeMenu = () => {
    setRevealedId(null);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind the card (revealed on swipe right) */}
      <div className="absolute inset-y-0 left-0 flex items-center gap-1.5 pl-2 z-0">
        <button
          onClick={() => { closeMenu(); onEdit(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: 'hsl(210, 70%, 45%)' }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { closeMenu(); onDuplicate(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: 'hsl(35, 90%, 50%)' }}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { closeMenu(); onRemove(); }}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: 'hsl(0, 65%, 50%)' }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Swipeable card on top */}
      <motion.div
        animate={controls}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -150, right: 160 }}
        dragElastic={0.35}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative z-10 rounded-xl border transition-colors",
          snapshot?.isDragging ? "shadow-lg border-primary/30 bg-card" : "bg-card/80 border-transparent",
          isActive && "border-primary/30 shadow-sm bg-card",
          (isDone || isSkipped) && "opacity-40"
        )}
      >
        <div className="flex items-center gap-2 px-2 py-2.5">
          {/* Drag handle */}
          {canDrag && (
            <div {...drag?.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Play button for individual start in parallel mode */}
          {isParallel && hasStarted && pTimer && !pTimer.running && !pTimer.done && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary shrink-0" onClick={() => onStartSingle?.(index)}>
              <Play className="h-4 w-4" />
            </Button>
          )}

          {/* Done check */}
          {(isDone || isSkipped) && <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />}

          {/* Running dot */}
          {isActive && (
            <motion.div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
          )}
          {!isActive && !isDone && !isSkipped && !(isParallel && hasStarted && pTimer && !pTimer.running && !pTimer.done) && (
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          )}

          <span className={cn("flex-1 text-sm font-medium truncate", (isDone || isSkipped) && "line-through text-muted-foreground")}>{interval.name}</span>

          {interval.sound && interval.sound !== 'beep' && <Volume2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
          {interval.vibration && <Smartphone className="h-3 w-3 text-muted-foreground/50 shrink-0" />}

          {/* Countdown or static time */}
          {isParallel && pTimer ? (
            <span className={cn("font-mono text-xs tabular-nums shrink-0 font-semibold", pTimer.done ? "text-muted-foreground" : pTimer.running ? "text-foreground" : "text-muted-foreground")}>
              {pTimer.done ? '✓' : pTimer.running ? formatCountdown(pTimer.secondsLeft) : formatTime(interval.minutes, interval.seconds)}
            </span>
          ) : (
            <span className={cn("font-mono text-xs tabular-nums shrink-0", isSkipped ? "text-muted-foreground line-through" : "text-muted-foreground")}>
              {isSkipped ? '✓' : formatTime(interval.minutes, interval.seconds)}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function DraggableIntervalList({ intervals, currentIndex, hasStarted, onRemove, onEdit, onReorder, mode, parallelTimers, onStartSingle, onSkip, onDuplicate, skippedIndices }) {
  const [editingId, setEditingId] = useState(null);
  const [revealedId, setRevealedId] = useState(null);
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
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intervalos ({intervals.length})</span>
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
                        {editingId === interval.id ? (
                          <div className="p-1">
                            <IntervalEditRow interval={interval} onSave={(data) => { onEdit(interval.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
                          </div>
                        ) : (
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
                            onRemove={() => onRemove(interval.id)}
                            onEdit={() => setEditingId(interval.id)}
                            onDuplicate={() => onDuplicate?.(interval.id)}
                            onSkip={onSkip}
                            revealedId={revealedId}
                            setRevealedId={setRevealedId}
                          />
                        )}
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
          <p className="text-sm">Agrega intervalos para empezar</p>
        </div>
      )}
    </div>
  );
}

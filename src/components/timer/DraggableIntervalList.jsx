import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Trash2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IntervalEditRow from './IntervalEditRow';

export const COLORS = ['hsl(245, 58%, 51%)', 'hsl(35, 95%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(340, 75%, 55%)', 'hsl(280, 65%, 60%)', 'hsl(200, 70%, 50%)'];
export function getIntervalColor(index) { return COLORS[index % COLORS.length]; }

function formatTime(minutes, seconds) {
  const s = seconds || 0;
  if (minutes > 0 && s > 0) return `${minutes}m ${s}s`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}

export default function DraggableIntervalList({ intervals, currentIndex, hasStarted, onRemove, onEdit, onReorder }) {
  const [editingId, setEditingId] = useState(null);

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
                const isActive = hasStarted && index === currentIndex;
                const isDone = hasStarted && index < currentIndex;
                const color = getIntervalColor(index);
                return (
                  <Draggable key={interval.id} draggableId={String(interval.id)} index={index} isDragDisabled={hasStarted}>
                    {(drag, snapshot) => (
                      <div ref={drag.innerRef} {...drag.draggableProps} className={cn("rounded-xl border transition-all", snapshot.isDragging ? "shadow-lg border-primary/30 bg-card" : "bg-card/80 border-transparent", isActive && "border-primary/30 shadow-sm bg-card")}>
                        {editingId === interval.id ? (
                          <div className="p-1">
                            <IntervalEditRow interval={interval} onSave={(data) => { onEdit(interval.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-2 py-2.5">
                            {!hasStarted && <div {...drag.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground"><GripVertical className="h-4 w-4" /></div>}
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className={cn("flex-1 text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>{interval.name}</span>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">{formatTime(interval.minutes, interval.seconds)}</span>
                            {!hasStarted && (
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditingId(interval.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(interval.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            )}
                          </div>
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

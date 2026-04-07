import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Zap, Clock, Trash2, Pencil, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from '../lib/useTasks';
import EmojiPicker from '../components/tasks/EmojiPicker';

export default function TaskList({ onSelectTask }) {
  const { tasks, createTask, updateTask, deleteTask, TASK_EMOJIS } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createTask(newName.trim(), newEmoji);
    setNewName(''); setNewEmoji('🎯'); setShowNew(false);
    onSelectTask(id);
  };

  const startEdit = (task) => {
    setEditingId(task.id); setEditName(task.name); setEditEmoji(task.emoji);
  };

  const confirmEdit = () => {
    if (!editName.trim()) return;
    updateTask(editingId, { name: editName.trim(), emoji: editEmoji });
    setEditingId(null);
  };

  const totalTime = (intervals) => {
    const secs = intervals.reduce((s, i) => s + i.minutes * 60 + (i.seconds || 0), 0);
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Chain Timer</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Mis Tareas</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecciona una tarea para empezar</p>
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto pb-32">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, i) => (
            <motion.div key={task.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ delay: i * 0.04 }}>
              {editingId === task.id ? (
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <EmojiPicker value={editEmoji} onChange={setEditEmoji} options={TASK_EMOJIS} />
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-11 text-base" autoFocus onKeyDown={e => e.key === 'Enter' && confirmEdit()} />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-11" onClick={confirmEdit}><Check className="h-4 w-4 mr-1" /> Guardar</Button>
                    <Button variant="outline" className="flex-1 h-11" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border active:scale-[0.98] transition-transform" onClick={() => onSelectTask(task.id)}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">{task.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-foreground truncate">{task.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.intervals.length} {task.intervals.length === 1 ? 'intervalo' : 'intervalos'}</span>
                        {task.intervals.length > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{totalTime(task.intervals)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={e => { e.stopPropagation(); startEdit(task); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}><Trash2 className="h-4 w-4" /></Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50 ml-1" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && !showNew && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">⏱️</div>
            <p className="font-medium">Aún no tienes tareas</p>
            <p className="text-sm mt-1">Crea una para empezar</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <AnimatePresence>
          {showNew ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} options={TASK_EMOJIS} />
                <Input placeholder="Nombre de la tarea" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 h-11 text-base" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 h-11" onClick={handleCreate} disabled={!newName.trim()}><Plus className="h-4 w-4 mr-1" /> Crear</Button>
                <Button variant="outline" className="flex-1 h-11" onClick={() => setShowNew(false)}>Cancelar</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 gap-2" onClick={() => setShowNew(true)}>
                <Plus className="h-5 w-5" /> Nueva tarea
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

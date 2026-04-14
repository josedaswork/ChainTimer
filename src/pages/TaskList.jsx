/**
 * @history
 * 2026-04-14 — i18n: all strings use t(), language switcher (Globe icon top-right)
 * 2026-04-14 — Delete task confirmation dialog
 * 2026-04-14 — Active task highlighted with primary border
 * 2026-04-14 — Floating add button, glass-card task items
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Zap, Clock, Trash2, Pencil, X, Check, Layers, ArrowRight, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTasks } from '../lib/useTasks';
import { useI18n, LANGUAGES } from '../lib/i18n';
import EmojiPicker from '../components/tasks/EmojiPicker';

export default function TaskList({ onSelectTask, activeTaskId, timerRunning }) {
  const { tasks, createTask, updateTask, deleteTask, TASK_EMOJIS } = useTasks();
  const { t, plural, lang, changeLang } = useI18n();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');
  const [newType, setNewType] = useState('serial');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editType, setEditType] = useState('serial');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showLang, setShowLang] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createTask(newName.trim(), newEmoji, newType);
    setNewName(''); setNewEmoji('🎯'); setNewType('serial'); setShowNew(false);
    onSelectTask(id);
  };

  const startEdit = (task) => {
    setEditingId(task.id); setEditName(task.name); setEditEmoji(task.emoji); setEditType(task.type || 'serial');
  };

  const confirmEdit = () => {
    if (!editName.trim()) return;
    updateTask(editingId, { name: editName.trim(), emoji: editEmoji, type: editType });
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Chain Timer</span>
          </div>
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setShowLang(!showLang)}>
              <Globe className="h-4 w-4" />
            </Button>
            {showLang && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLang(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-card rounded-xl border border-border shadow-xl p-1 min-w-[140px]">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { changeLang(l.code); setShowLang(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", lang === l.code ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted")}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t('myTasks')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('selectTaskToStart')}</p>
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
                    <button type="button" onClick={() => setEditType('serial')} className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-sm font-medium transition-colors ${editType === 'serial' ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
                      <ArrowRight className="h-3.5 w-3.5" /> {t('serial')}
                    </button>
                    <button type="button" onClick={() => setEditType('parallel')} className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-sm font-medium transition-colors ${editType === 'parallel' ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
                      <Layers className="h-3.5 w-3.5" /> {t('parallel')}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-11" onClick={confirmEdit}><Check className="h-4 w-4 mr-1" /> {t('save')}</Button>
                    <Button variant="outline" className="flex-1 h-11" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" /> {t('cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className={cn("bg-card rounded-2xl border active:scale-[0.98] transition-transform", activeTaskId === task.id && timerRunning ? "border-primary shadow-md shadow-primary/20" : "border-border")} onClick={() => onSelectTask(task.id)}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">{task.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-foreground truncate">{task.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.intervals.length} {plural('interval', task.intervals.length)}</span>
                        {task.intervals.length > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{totalTime(task.intervals)}</span>}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {(task.type || 'serial') === 'parallel' ? <><Layers className="h-3 w-3" />{t('parallel')}</> : <><ArrowRight className="h-3 w-3" />{t('serial')}</>}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={e => { e.stopPropagation(); startEdit(task); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteConfirmId(task.id); }}><Trash2 className="h-4 w-4" /></Button>
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
            <p className="font-medium">{t('noTasksYet')}</p>
            <p className="text-sm mt-1">{t('createToStart')}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <AnimatePresence>
          {showNew ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <EmojiPicker value={newEmoji} onChange={setNewEmoji} options={TASK_EMOJIS} />
                <Input placeholder={t('taskNamePlaceholder')} value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 h-11 text-base" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewType('serial')} className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-sm font-medium transition-colors ${newType === 'serial' ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
                  <ArrowRight className="h-3.5 w-3.5" /> {t('serial')}
                </button>
                <button type="button" onClick={() => setNewType('parallel')} className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-sm font-medium transition-colors ${newType === 'parallel' ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
                  <Layers className="h-3.5 w-3.5" /> {t('parallel')}
                </button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 h-11" onClick={handleCreate} disabled={!newName.trim()}><Plus className="h-4 w-4 mr-1" /> {t('create')}</Button>
                <Button variant="outline" className="flex-1 h-11" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 gap-2" onClick={() => setShowNew(true)}>
                <Plus className="h-5 w-5" /> {t('newTask')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">{t('deleteTask')}</h3>
            <p className="text-sm text-muted-foreground">{t('deleteTaskConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => { deleteTask(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm">{t('delete')}</button>
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-11 rounded-xl border border-border text-foreground font-semibold text-sm">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

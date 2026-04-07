import { useState, useCallback } from 'react';

const TASK_EMOJIS = ['🏃', '🍳', '🏠', '📚', '💪', '🎯', '🧘', '🛒', '💻', '🎵'];

const defaultTasks = [
  { id: 1, name: 'Entrenamiento', emoji: '💪', intervals: [
    { id: 101, name: 'Calentamiento', minutes: 5, seconds: 0 },
    { id: 102, name: 'Cardio', minutes: 20, seconds: 0 },
    { id: 103, name: 'Fuerza', minutes: 15, seconds: 0 },
    { id: 104, name: 'Estiramiento', minutes: 5, seconds: 0 },
  ]},
  { id: 2, name: 'Cocina', emoji: '🍳', intervals: [
    { id: 201, name: 'Sofreír cebolla', minutes: 3, seconds: 0 },
    { id: 202, name: 'Hervir pasta', minutes: 10, seconds: 0 },
    { id: 203, name: 'Reposar', minutes: 2, seconds: 0 },
  ]}
];

export function useTasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('chain-timer-tasks');
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch { return defaultTasks; }
  });

  const save = (updated) => {
    setTasks(updated);
    localStorage.setItem('chain-timer-tasks', JSON.stringify(updated));
  };

  const createTask = useCallback((name, emoji) => {
    const task = { id: Date.now(), name, emoji: emoji || '🎯', intervals: [] };
    save([...tasks, task]);
    return task.id;
  }, [tasks]);

  const updateTask = useCallback((id, data) => save(tasks.map(t => t.id === id ? { ...t, ...data } : t)), [tasks]);
  const deleteTask = useCallback((id) => save(tasks.filter(t => t.id !== id)), [tasks]);

  const addInterval = useCallback((taskId, interval) => {
    save(tasks.map(t => t.id === taskId ? { ...t, intervals: [...t.intervals, { ...interval, id: Date.now() }] } : t));
  }, [tasks]);

  const updateInterval = useCallback((taskId, intervalId, data) => {
    save(tasks.map(t => t.id === taskId ? { ...t, intervals: t.intervals.map(i => i.id === intervalId ? { ...i, ...data } : i) } : t));
  }, [tasks]);

  const deleteInterval = useCallback((taskId, intervalId) => {
    save(tasks.map(t => t.id === taskId ? { ...t, intervals: t.intervals.filter(i => i.id !== intervalId) } : t));
  }, [tasks]);

  const reorderIntervals = useCallback((taskId, newIntervals) => {
    save(tasks.map(t => t.id === taskId ? { ...t, intervals: newIntervals } : t));
  }, [tasks]);

  return { tasks, createTask, updateTask, deleteTask, addInterval, updateInterval, deleteInterval, reorderIntervals, TASK_EMOJIS };
}

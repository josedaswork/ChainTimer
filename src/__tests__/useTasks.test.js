import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/lib/useTasks';

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default tasks when localStorage is empty', () => {
    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks.length).toBe(2);
    expect(result.current.tasks[0].name).toBe('Entrenamiento');
    expect(result.current.tasks[1].name).toBe('Cocina');
  });

  it('createTask adds a new task', () => {
    const { result } = renderHook(() => useTasks());
    act(() => {
      result.current.createTask('Test Task', '🎯', 'serial');
    });
    expect(result.current.tasks.length).toBe(3);
    expect(result.current.tasks[2].name).toBe('Test Task');
    expect(result.current.tasks[2].emoji).toBe('🎯');
    expect(result.current.tasks[2].type).toBe('serial');
    expect(result.current.tasks[2].intervals).toEqual([]);
  });

  it('createTask uses defaults for emoji and type', () => {
    const { result } = renderHook(() => useTasks());
    act(() => {
      result.current.createTask('Minimal');
    });
    const task = result.current.tasks[2];
    expect(task.emoji).toBe('🎯');
    expect(task.type).toBe('serial');
  });

  it('updateTask modifies task properties', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    act(() => {
      result.current.updateTask(taskId, { name: 'Updated Name' });
    });
    expect(result.current.tasks.find(t => t.id === taskId).name).toBe('Updated Name');
  });

  it('deleteTask removes a task', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    act(() => {
      result.current.deleteTask(taskId);
    });
    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks.find(t => t.id === taskId)).toBeUndefined();
  });

  it('addInterval adds an interval to a task', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    const beforeCount = result.current.tasks[0].intervals.length;
    act(() => {
      result.current.addInterval(taskId, { name: 'New Interval', minutes: 3, seconds: 30, sound: 'beep', vibration: false });
    });
    const task = result.current.tasks.find(t => t.id === taskId);
    expect(task.intervals.length).toBe(beforeCount + 1);
    expect(task.intervals[task.intervals.length - 1].name).toBe('New Interval');
  });

  it('updateInterval modifies an interval', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    const intervalId = result.current.tasks[0].intervals[0].id;
    act(() => {
      result.current.updateInterval(taskId, intervalId, { name: 'Warm Up v2', minutes: 10 });
    });
    const interval = result.current.tasks.find(t => t.id === taskId).intervals.find(i => i.id === intervalId);
    expect(interval.name).toBe('Warm Up v2');
    expect(interval.minutes).toBe(10);
  });

  it('deleteInterval removes an interval', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    const intervalId = result.current.tasks[0].intervals[0].id;
    const beforeCount = result.current.tasks[0].intervals.length;
    act(() => {
      result.current.deleteInterval(taskId, intervalId);
    });
    const task = result.current.tasks.find(t => t.id === taskId);
    expect(task.intervals.length).toBe(beforeCount - 1);
    expect(task.intervals.find(i => i.id === intervalId)).toBeUndefined();
  });

  it('duplicateInterval copies an interval after the original', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    const intervalId = result.current.tasks[0].intervals[1].id;
    const beforeCount = result.current.tasks[0].intervals.length;
    act(() => {
      result.current.duplicateInterval(taskId, intervalId);
    });
    const task = result.current.tasks.find(t => t.id === taskId);
    expect(task.intervals.length).toBe(beforeCount + 1);
    // The copy should be right after index 1
    expect(task.intervals[2].name).toContain('(copia)');
    expect(task.intervals[2].minutes).toBe(task.intervals[1].minutes);
  });

  it('reorderIntervals replaces the intervals array', () => {
    const { result } = renderHook(() => useTasks());
    const taskId = result.current.tasks[0].id;
    const reversed = [...result.current.tasks[0].intervals].reverse();
    act(() => {
      result.current.reorderIntervals(taskId, reversed);
    });
    const task = result.current.tasks.find(t => t.id === taskId);
    expect(task.intervals[0].id).toBe(reversed[0].id);
    expect(task.intervals[task.intervals.length - 1].id).toBe(reversed[reversed.length - 1].id);
  });

  it('persists tasks to localStorage', () => {
    const { result } = renderHook(() => useTasks());
    act(() => {
      result.current.createTask('Persist Test', '🧪', 'serial');
    });
    const saved = JSON.parse(localStorage.getItem('chain-timer-tasks'));
    expect(saved.length).toBe(3);
    expect(saved[2].name).toBe('Persist Test');
  });
});

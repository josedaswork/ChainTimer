/**
 * @history
 * 2026-04-15 — Created: tests for ScrollPicker bug fixes (PieMenu sync, aggressive scroll, boundary snap)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScrollPicker from '@/components/timer/ScrollPicker';

const ITEM_H = 36; // Must match the constant in ScrollPicker

describe('ScrollPicker', () => {
  let rafQueue;
  let nextRafId;

  beforeEach(() => {
    rafQueue = new Map();
    nextRafId = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRafId++;
      rafQueue.set(id, cb);
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafQueue.delete(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Run all queued rAF callbacks until none remain (or maxIterations). */
  function flushRaf(maxIterations = 500) {
    for (let i = 0; i < maxIterations; i++) {
      if (rafQueue.size === 0) break;
      const entries = [...rafQueue.entries()];
      rafQueue.clear();
      entries.forEach(([, cb]) => cb());
    }
  }

  /**
   * Simulate a slow drag (near-zero velocity on release) that moves the picker
   * by `deltaY` pixels. Negative deltaY = drag upward = toward higher numbers.
   */
  function slowDrag(picker, deltaY) {
    const dateSpy = vi.spyOn(Date, 'now');

    dateSpy.mockReturnValue(1000);
    act(() => { fireEvent.pointerDown(picker, { clientY: 3000 }); });

    // Big move to desired position
    dateSpy.mockReturnValue(1100);
    act(() => { fireEvent.pointerMove(window, { clientY: 3000 + deltaY }); });

    // Zero-delta move 200ms later to kill velocity
    dateSpy.mockReturnValue(1300);
    act(() => { fireEvent.pointerMove(window, { clientY: 3000 + deltaY }); });

    // Release — vy ≈ 0 so snapAndEmit is called directly
    act(() => { fireEvent.pointerUp(window); });

    // Run snap animation to completion
    act(() => { flushRaf(); });

    dateSpy.mockRestore();
  }

  // -----------------------------------------------------------
  // Bug 1: PieMenu selection not reflected in ScrollPicker
  // -----------------------------------------------------------
  describe('external value sync (PieMenu → ScrollPicker)', () => {
    it('updates display immediately when value prop changes', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );
      expect(screen.getByText('00')).toBeInTheDocument();

      rerender(<ScrollPicker value={30} onChange={onChange} min={0} max={59} />);
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('syncs to boundary value 59', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );

      rerender(<ScrollPicker value={59} onChange={onChange} min={0} max={59} />);
      expect(screen.getByText('59')).toBeInTheDocument();
    });

    it('cancels in-flight animation when value prop changes', () => {
      const onChange = vi.fn();
      const { rerender, container } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );
      const picker = container.firstChild;

      // Start a drag and release to queue a snap animation
      act(() => { fireEvent.pointerDown(picker, { clientY: 500 }); });
      act(() => { fireEvent.pointerUp(window); });
      expect(rafQueue.size).toBeGreaterThan(0);

      // External value change should cancel animation and sync display
      act(() => {
        rerender(<ScrollPicker value={45} onChange={onChange} min={0} max={59} />);
      });
      expect(rafQueue.size).toBe(0);
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Bug 2: Aggressive scroll always snaps to ~50 range
  // -----------------------------------------------------------
  describe('aggressive scroll snap', () => {
    it('snaps to correct value after scrolling past one full cycle', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );

      // Drag upward 61 items (past one full 60-item cycle)
      // 61 * 36 = 2196px → idx 61 → wraps to 1
      slowDrag(container.firstChild, -2196);

      expect(onChange).toHaveBeenCalled();
      const finalValue = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      // Should be 1 (61 % 60), NOT ~50 (old bug)
      expect(finalValue).toBe(1);
      expect(screen.getByText('01')).toBeInTheDocument();
    });

    it('snaps correctly after scrolling past two full cycles', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );

      // 125 items upward: 125 * 36 = 4500px → idx 125 → wraps to 5
      slowDrag(container.firstChild, -4500);

      const finalValue = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(finalValue).toBe(5);
      expect(screen.getByText('05')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Bug 3: Boundary 59↔00 snaps to wrong value (49 or 10)
  // -----------------------------------------------------------
  describe('boundary snap 59 ↔ 00', () => {
    it('snaps to 00 when scrolling from 59 past the boundary', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScrollPicker value={59} onChange={onChange} min={0} max={59} />
      );

      // From value 59 (y=-2124), drag upward 20px → y=-2144
      // idx = round(2144/36) = round(59.56) = 60 → wraps to 0
      slowDrag(container.firstChild, -20);

      const finalValue = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      // Should snap to 0, NOT 49
      expect(finalValue).toBe(0);
      expect(screen.getByText('00')).toBeInTheDocument();
    });

    it('snaps to 59 when scrolling from 00 past the boundary', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScrollPicker value={0} onChange={onChange} min={0} max={59} />
      );

      // From value 0 (y=0), drag downward 20px → y=+20
      // idx = round(-20/36) = round(-0.556) = -1 → wraps to 59
      slowDrag(container.firstChild, 20);

      const finalValue = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      // Should snap to 59, NOT 10
      expect(finalValue).toBe(59);
      expect(screen.getByText('59')).toBeInTheDocument();
    });

    it('stays at 59 when drag does not cross the midpoint', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ScrollPicker value={59} onChange={onChange} min={0} max={59} />
      );

      // From value 59, drag upward only 8px (less than half an item)
      // idx = round(2132/36) = round(59.22) = 59 → stays at 59
      slowDrag(container.firstChild, -8);

      const finalValue = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(finalValue).toBe(59);
    });
  });
});

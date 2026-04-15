/**
 * @history
 * 2026-04-15 — Smooth animated snap (lerp) instead of instant teleport
 * 2026-04-15 — Wrap-around (circular), smooth continuous rendering, locked prop
 * 2026-04-15 — Created: vertical drag-scroll number picker with momentum/deceleration
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ITEM_H = 36;       // height of each number slot
const VISIBLE = 5;        // render 5 slots for smooth wrap
const DECEL = 0.94;       // momentum deceleration factor
const MIN_VEL = 0.3;      // stop threshold
const SNAP_SPEED = 0.18;  // lerp factor for smooth snap animation

export default function ScrollPicker({ value, onChange, min = 0, max = 59, disabled, locked, className }) {
  const count = max - min + 1;
  const containerRef = useRef(null);
  const r = useRef({ y: 0, vy: 0, dragging: false, lastY: 0, lastT: 0, raf: null });

  // Wrap a value into [0, count)
  const wrap = useCallback((idx) => ((idx % count) + count) % count, [count]);

  // Convert display index → offset (continuous, not clamped)
  const valToOffset = useCallback((v) => -(v - min) * ITEM_H, [min]);

  // Initialize offset from value (only on external value change, not during drag)
  useEffect(() => {
    if (!r.current.dragging && r.current.raf == null) {
      r.current.y = valToOffset(value ?? min);
    }
  }, [value, min, valToOffset]);

  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender(c => c + 1), []);

  const snapAnimate = useCallback(() => {
    let idx = Math.round(-r.current.y / ITEM_H);
    idx = wrap(idx);
    const target = -idx * ITEM_H;
    const diff = target - r.current.y;
    if (Math.abs(diff) < 0.5) {
      // Close enough — finalize
      r.current.y = target;
      r.current.raf = null;
      rerender();
      onChange(idx + min);
      return;
    }
    r.current.y += diff * SNAP_SPEED;
    rerender();
    r.current.raf = requestAnimationFrame(snapAnimate);
  }, [wrap, min, onChange, rerender]);

  const snapAndEmit = useCallback(() => {
    r.current.raf = requestAnimationFrame(snapAnimate);
  }, [snapAnimate]);

  const animate = useCallback(() => {
    if (r.current.dragging) return;
    r.current.vy *= DECEL;
    if (Math.abs(r.current.vy) < MIN_VEL) {
      r.current.vy = 0;
      snapAndEmit();
      return;
    }
    r.current.y += r.current.vy;
    rerender();
    r.current.raf = requestAnimationFrame(animate);
  }, [snapAndEmit, rerender]);

  // When locked becomes true (PieMenu activated), cancel any ongoing drag
  useEffect(() => {
    if (locked && r.current.dragging) {
      r.current.abort?.();
    }
  }, [locked]);

  const onPointerDown = useCallback((e) => {
    if (disabled || locked) return;
    e.preventDefault();
    if (r.current.raf) { cancelAnimationFrame(r.current.raf); r.current.raf = null; }
    r.current.dragging = true;
    r.current.lastY = e.clientY;
    r.current.lastT = Date.now();
    r.current.vy = 0;

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      r.current.dragging = false;
      r.current.abort = null;
    };

    const onMove = (ev) => {
      if (!r.current.dragging) return;
      const dy = ev.clientY - r.current.lastY;
      const now = Date.now();
      const dt = now - r.current.lastT || 1;
      r.current.vy = (dy / dt) * 16;
      r.current.lastY = ev.clientY;
      r.current.lastT = now;
      r.current.y += dy;
      rerender();
    };

    const onUp = () => {
      if (!r.current.dragging) { cleanup(); return; }
      cleanup();
      if (Math.abs(r.current.vy) > MIN_VEL) {
        r.current.raf = requestAnimationFrame(animate);
      } else {
        snapAndEmit();
      }
    };

    r.current.abort = () => { cleanup(); snapAndEmit(); };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [disabled, locked, animate, snapAndEmit, rerender]);

  // Continuous position in "index space"
  const floatIdx = -r.current.y / ITEM_H;
  const centerIdx = Math.round(floatIdx);
  const frac = floatIdx - centerIdx; // fractional offset from center slot

  const items = [];
  const half = Math.floor(VISIBLE / 2);
  for (let offset = -half; offset <= half; offset++) {
    const idx = wrap(centerIdx + offset);
    const num = idx + min;
    const pixelOff = (offset - frac) * ITEM_H;
    const absOff = Math.abs(pixelOff);
    const opacity = Math.max(0.15, 1 - absOff / (ITEM_H * 2));
    const scale = Math.max(0.75, 1 - absOff / (ITEM_H * 4));
    items.push(
      <div
        key={`${offset}`}
        className="absolute left-0 right-0 flex items-center justify-center font-mono font-bold select-none pointer-events-none"
        style={{
          height: ITEM_H,
          top: '50%',
          transform: `translateY(${pixelOff - ITEM_H / 2}px) scale(${scale})`,
          opacity,
        }}
      >
        {String(num).padStart(2, '0')}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onContextMenu={e => e.preventDefault()}
      className={cn(
        "relative cursor-ns-resize select-none",
        disabled && "opacity-40 pointer-events-none",
        className
      )}
      style={{
        height: ITEM_H * 3,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-1 z-[5] rounded-md border border-primary/30 bg-primary/5 pointer-events-none" style={{ top: ITEM_H, height: ITEM_H }} />
        {items}
      </div>
    </div>
  );
}

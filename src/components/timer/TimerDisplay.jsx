/**
 * @history
 * 2026-04-14 — Add dimTime prop to dim time while PieMenu is active
 * 2026-04-14 — Add children slot and countdownValue prop for countdown display
 * 2026-04-14 — Circular progress ring with framer-motion animation
 */
import React from 'react';
import { motion } from 'framer-motion';

const SIZE = 260, STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({ secondsLeft, progress, label, isRunning, intervalColor, children, countdownValue, dimTime }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={SIZE} height={SIZE} className="transform -rotate-90">
        <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth={STROKE} />
        <motion.circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke={intervalColor || "hsl(var(--primary))"} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 0.4, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`flex flex-col items-center transition-opacity duration-150 ${dimTime ? 'opacity-30' : 'opacity-100'}`}>
        {countdownValue != null ? (
          <motion.span key={countdownValue} initial={{ scale: 1.4, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="font-mono text-7xl font-bold text-primary">
            {countdownValue}
          </motion.span>
        ) : (
          <motion.span key={secondsLeft} initial={{ scale: 1.05, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="font-mono text-5xl font-bold tracking-tight text-foreground">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </motion.span>
        )}
        {label && <span className="mt-2 text-sm font-medium text-muted-foreground max-w-[180px] text-center truncate">{label}</span>}
        </div>
        {children}
        {isRunning && (
          <motion.div className="mt-3 h-1.5 w-1.5 rounded-full bg-accent" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
        )}
      </div>
    </div>
  );
}

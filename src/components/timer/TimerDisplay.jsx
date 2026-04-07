import React from 'react';
import { motion } from 'framer-motion';

const SIZE = 260, STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({ secondsLeft, progress, label, isRunning, intervalColor }) {
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
        <motion.span key={secondsLeft} initial={{ scale: 1.05, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }} className="font-mono text-5xl font-bold tracking-tight text-foreground">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </motion.span>
        {label && <span className="mt-2 text-sm font-medium text-muted-foreground max-w-[180px] text-center truncate">{label}</span>}
        {isRunning && (
          <motion.div className="mt-3 h-1.5 w-1.5 rounded-full bg-accent" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
        )}
      </div>
    </div>
  );
}

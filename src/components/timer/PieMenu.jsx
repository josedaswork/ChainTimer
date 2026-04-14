/**
 * @history
 * 2026-04-14 — Created: radial pie menu (58px radius, 38px circles, -155° to -25° arc)
 * 2026-04-14 — Container-level enter/exit animation (0.12s), pointer-events-none
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RADIUS = 58;

export function getOptionPositions(count) {
  const startAngle = -155, endAngle = -25;
  return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? -90 : startAngle + (endAngle - startAngle) * (i / (count - 1));
    const rad = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * RADIUS, y: Math.sin(rad) * RADIUS };
  });
}

export default function PieMenu({ options, highlightedIndex, visible }) {
  const positions = getOptionPositions(options.length);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{ left: '50%', bottom: '100%', marginBottom: 6 }}
        >
          {positions.map((pos, i) => (
            <motion.div
              key={options[i]}
              animate={{
                scale: highlightedIndex === i ? 1.2 : 1,
                x: pos.x,
                y: pos.y,
              }}
              transition={{ duration: 0.07, ease: 'easeOut' }}
              className={`absolute flex items-center justify-center rounded-full text-sm font-bold shadow-lg transition-colors duration-75 ${
                highlightedIndex === i
                  ? 'bg-primary text-primary-foreground shadow-primary/40'
                  : 'bg-card text-foreground border border-border/60'
              }`}
              style={{ width: 38, height: 38, marginLeft: -19, marginTop: -19 }}
            >
              {options[i]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

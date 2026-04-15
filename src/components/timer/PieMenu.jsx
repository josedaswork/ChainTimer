/**
 * @history
 * 2026-04-15 — Export ANCHOR_OFFSET_UP/DOWN constants shared with hit-detection
 * 2026-04-15 — Dynamic radius based on item count to prevent overlap, fix vertical offset
 * 2026-04-15 — Smaller circles (26px), tighter radius (40px), closer to trigger
 * 2026-04-14 — Fix down-direction arc order (x1→x5 left-to-right)
 * 2026-04-14 — Reduce circle size to 32px and radius to 52px
 * 2026-04-14 — Add direction prop (up/down) for menu placement
 * 2026-04-14 — Created: radial pie menu (58px radius, 38px circles, -155° to -25° arc)
 * 2026-04-14 — Container-level enter/exit animation (0.12s), pointer-events-none
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CIRCLE_SIZE = 26;
const MIN_GAP = 4;         // minimum gap between circles
const ARC_SPAN = 130;      // degrees of arc

// Anchor offsets: distance from parent edge to the PieMenu (0,0) origin
// These MUST match the CSS positioning below and the hit-detection in usePieMenu
export const ANCHOR_OFFSET_UP = -16;   // marginBottom (negative = into parent)
export const ANCHOR_OFFSET_DOWN = 4;   // marginTop

function getRadius(count) {
  if (count <= 1) return 38;
  const angleStep = ARC_SPAN / (count - 1);
  const minSpacing = (CIRCLE_SIZE + MIN_GAP) / 2;
  const needed = minSpacing / Math.sin((angleStep / 2) * Math.PI / 180);
  return Math.max(38, Math.ceil(needed));
}

export function getOptionPositions(count, direction = 'up') {
  const isDown = direction === 'down';
  const startAngle = isDown ? 155 : -155;
  const endAngle = isDown ? 25 : -25;
  const radius = getRadius(count);
  return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? (isDown ? 90 : -90) : startAngle + (endAngle - startAngle) * (i / (count - 1));
    const rad = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
  });
}

export default function PieMenu({ options, highlightedIndex, visible, direction = 'up' }) {
  const positions = getOptionPositions(options.length, direction);
  const isDown = direction === 'down';
  const half = CIRCLE_SIZE / 2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="absolute pointer-events-none z-50"
          style={isDown
            ? { left: '50%', top: '100%', marginTop: ANCHOR_OFFSET_DOWN }
            : { left: '50%', bottom: '100%', marginBottom: ANCHOR_OFFSET_UP }
          }
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
              className={`absolute flex items-center justify-center rounded-full text-xs font-bold shadow-lg transition-colors duration-75 ${
                highlightedIndex === i
                  ? 'bg-primary text-primary-foreground shadow-primary/40'
                  : 'bg-card text-foreground border border-border/60'
              }`}
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, marginLeft: -half, marginTop: -half }}
            >
              {options[i]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

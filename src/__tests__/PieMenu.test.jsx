import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PieMenu, { getOptionPositions } from '@/components/timer/PieMenu';

describe('getOptionPositions', () => {
  it('returns correct number of positions', () => {
    expect(getOptionPositions(4)).toHaveLength(4);
    expect(getOptionPositions(1)).toHaveLength(1);
    expect(getOptionPositions(6)).toHaveLength(6);
  });

  it('returns objects with x and y', () => {
    const positions = getOptionPositions(3);
    positions.forEach(p => {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    });
  });

  it('positions are within radius bounds', () => {
    const positions = getOptionPositions(5);
    // All positions should be at the same distance from center (the computed radius)
    const dist0 = Math.sqrt(positions[0].x ** 2 + positions[0].y ** 2);
    positions.forEach(p => {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(dist0, 0);
    });
  });

  it('single option is placed at -90 degrees (top)', () => {
    const [pos] = getOptionPositions(1);
    expect(pos.x).toBeCloseTo(0, 0);
    expect(pos.y).toBeLessThan(0); // above center
  });

  it('circles do not overlap for 5 options', () => {
    const CIRCLE_SIZE = 32;
    const positions = getOptionPositions(5);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.sqrt(
          (positions[i].x - positions[j].x) ** 2 +
          (positions[i].y - positions[j].y) ** 2
        );
        expect(dist).toBeGreaterThanOrEqual(CIRCLE_SIZE);
      }
    }
  });

  it('radius increases for more options to avoid overlap', () => {
    const pos4 = getOptionPositions(4);
    const pos5 = getOptionPositions(5);
    const r4 = Math.sqrt(pos4[0].x ** 2 + pos4[0].y ** 2);
    const r5 = Math.sqrt(pos5[0].x ** 2 + pos5[0].y ** 2);
    expect(r5).toBeGreaterThanOrEqual(r4);
  });

  it('down direction positions have positive y values', () => {
    const positions = getOptionPositions(4, 'down');
    positions.forEach(p => {
      expect(p.y).toBeGreaterThan(0);
    });
  });
});

describe('PieMenu', () => {
  it('renders options when visible', () => {
    render(<PieMenu options={[5, 10, 15]} highlightedIndex={-1} visible={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('does not render options when not visible', () => {
    render(<PieMenu options={[5, 10, 15]} highlightedIndex={-1} visible={false} />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('highlights the correct option', () => {
    render(<PieMenu options={[5, 10, 15]} highlightedIndex={1} visible={true} />);
    const highlighted = screen.getByText('10');
    // The highlighted option should have the primary class
    expect(highlighted.closest('div')).toHaveClass('bg-primary');
  });

  it('non-highlighted options have bg-card class', () => {
    render(<PieMenu options={[5, 10, 15]} highlightedIndex={1} visible={true} />);
    const notHighlighted = screen.getByText('5');
    expect(notHighlighted.closest('div')).toHaveClass('bg-card');
  });
});

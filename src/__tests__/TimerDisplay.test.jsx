import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimerDisplay from '@/components/timer/TimerDisplay';

describe('TimerDisplay', () => {
  it('renders time in mm:ss format', () => {
    render(<TimerDisplay secondsLeft={125} progress={0.5} label="Running" isRunning={false} />);
    expect(screen.getByText('02:05')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders countdown value when provided', () => {
    render(<TimerDisplay secondsLeft={30} progress={0.33} label="Get ready!" isRunning={false} countdownValue={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Get ready!')).toBeInTheDocument();
    // Should NOT show mm:ss
    expect(screen.queryByText('00:30')).not.toBeInTheDocument();
  });

  it('renders children inside the circle', () => {
    render(
      <TimerDisplay secondsLeft={60} progress={0} label="" isRunning={false}>
        <button data-testid="repeat-btn">x2</button>
      </TimerDisplay>
    );
    expect(screen.getByTestId('repeat-btn')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('shows running dot when isRunning', () => {
    const { container } = render(<TimerDisplay secondsLeft={60} progress={0.5} label="Test" isRunning={true} />);
    // Running dot is a motion.div with bg-accent
    const dots = container.querySelectorAll('.bg-accent');
    expect(dots.length).toBe(1);
  });

  it('does not show running dot when not running', () => {
    const { container } = render(<TimerDisplay secondsLeft={60} progress={0.5} label="Test" isRunning={false} />);
    const dots = container.querySelectorAll('.bg-accent');
    expect(dots.length).toBe(0);
  });
});

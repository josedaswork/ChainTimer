import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntervalForm from '@/components/timer/IntervalForm';

describe('IntervalForm', () => {
  it('renders name, minutes and seconds inputs', () => {
    render(<IntervalForm onAdd={vi.fn()} disabled={false} />);
    expect(screen.getByPlaceholderText('Nombre del intervalo')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('0').length).toBe(2);
  });

  it('does not call onAdd when minutes and seconds are both 0', async () => {
    const onAdd = vi.fn();
    render(<IntervalForm onAdd={onAdd} disabled={false} />);
    const form = screen.getByPlaceholderText('Nombre del intervalo').closest('form');
    fireEvent.submit(form);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onAdd with correct data on valid submit', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<IntervalForm onAdd={onAdd} disabled={false} />);

    await user.type(screen.getByPlaceholderText('Nombre del intervalo'), 'Test');

    // Find minute and second inputs by their placeholder
    const numberInputs = screen.getAllByPlaceholderText('0');
    await user.type(numberInputs[0], '5');
    await user.type(numberInputs[1], '30');

    const form = screen.getByPlaceholderText('Nombre del intervalo').closest('form');
    fireEvent.submit(form);

    expect(onAdd).toHaveBeenCalledTimes(1);
    const arg = onAdd.mock.calls[0][0];
    expect(arg.name).toBe('Test');
    expect(arg.minutes).toBe(5);
    expect(arg.seconds).toBe(30);
    expect(arg.sound).toBe('beep');
    expect(arg.vibration).toBe(false);
  });

  it('uses "Intervalo" as default name when empty', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<IntervalForm onAdd={onAdd} disabled={false} />);

    const numberInputs = screen.getAllByPlaceholderText('0');
    await user.type(numberInputs[0], '1');

    const form = screen.getByPlaceholderText('Nombre del intervalo').closest('form');
    fireEvent.submit(form);

    expect(onAdd.mock.calls[0][0].name).toBe('Intervalo');
  });

  it('clamps seconds to max 59', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<IntervalForm onAdd={onAdd} disabled={false} />);

    const numberInputs = screen.getAllByPlaceholderText('0');
    await user.type(numberInputs[1], '99');

    // Need at least some time
    await user.type(numberInputs[0], '1');

    const form = screen.getByPlaceholderText('Nombre del intervalo').closest('form');
    fireEvent.submit(form);

    expect(onAdd.mock.calls[0][0].seconds).toBeLessThanOrEqual(59);
  });

  it('clears inputs after successful submit', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<IntervalForm onAdd={onAdd} disabled={false} />);

    const nameInput = screen.getByPlaceholderText('Nombre del intervalo');
    const numberInputs = screen.getAllByPlaceholderText('0');

    await user.type(nameInput, 'Clear Test');
    await user.type(numberInputs[0], '2');

    const form = nameInput.closest('form');
    fireEvent.submit(form);

    expect(nameInput.value).toBe('');
    expect(numberInputs[0].value).toBe('');
  });

  it('disables inputs when disabled prop is true', () => {
    render(<IntervalForm onAdd={vi.fn()} disabled={true} />);
    expect(screen.getByPlaceholderText('Nombre del intervalo')).toBeDisabled();
  });
});

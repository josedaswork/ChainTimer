/**
 * @history
 * 2026-04-14 — Inline edit row for intervals (name, time, sound, vibration)
 */
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Volume2, Smartphone } from 'lucide-react';
import { ALARM_SOUNDS } from './useAlarm';

export default function IntervalEditRow({ interval, onSave, onCancel }) {
  const [name, setName] = useState(interval.name);
  const [minutes, setMinutes] = useState(String(interval.minutes));
  const [seconds, setSeconds] = useState(String(interval.seconds || 0));
  const [sound, setSound] = useState(interval.sound || 'beep');
  const [vibration, setVibration] = useState(interval.vibration || false);

  const handleSave = () => {
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onSave({ name: name.trim() || interval.name, minutes: m, seconds: s, sound, vibration });
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-3 bg-primary/5 rounded-xl border border-primary/20">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="h-10 text-sm bg-card" autoFocus />
      <div className="flex gap-2 items-center">
        <div className="flex gap-1 items-center flex-1">
          <Input type="number" min="0" max="999" value={minutes} onChange={e => setMinutes(e.target.value)} className="h-10 w-20 text-center font-mono text-sm bg-card" placeholder="min" />
          <span className="text-muted-foreground text-xs font-medium">m</span>
          <Input type="number" min="0" max="59" value={seconds} onChange={e => setSeconds(e.target.value)} className="h-10 w-20 text-center font-mono text-sm bg-card" placeholder="seg" />
          <span className="text-muted-foreground text-xs font-medium">s</span>
        </div>
        <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSave}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-1">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select value={sound} onChange={e => setSound(e.target.value)} className="flex-1 h-8 rounded-md border border-input bg-card px-2 text-xs">
            {ALARM_SOUNDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setVibration(!vibration)} className={`flex items-center gap-1 h-8 px-2.5 rounded-md border text-xs transition-colors ${vibration ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
          <Smartphone className="h-3 w-3" />
          Vibrar
        </button>
      </div>
    </div>
  );
}

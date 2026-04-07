import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Volume2, Smartphone } from "lucide-react";
import { ALARM_SOUNDS } from './useAlarm';

export default function IntervalForm({ onAdd, disabled }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [sound, setSound] = useState('beep');
  const [vibration, setVibration] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onAdd({ name: name.trim() || 'Intervalo', minutes: m, seconds: s, sound, vibration, id: Date.now() });
    setName(''); setMinutes(''); setSeconds(''); setSound('beep'); setVibration(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input placeholder="Nombre del intervalo" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="h-11 text-base bg-card" />
      <div className="flex gap-2">
        <div className="flex items-center gap-1 flex-1">
          <Input type="number" min="0" max="999" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled} className="h-11 text-center font-mono text-base bg-card" />
          <span className="text-sm text-muted-foreground font-medium shrink-0">min</span>
        </div>
        <div className="flex items-center gap-1 flex-1">
          <Input type="number" min="0" max="59" placeholder="0" value={seconds} onChange={(e) => setSeconds(e.target.value)} disabled={disabled} className="h-11 text-center font-mono text-base bg-card" />
          <span className="text-sm text-muted-foreground font-medium shrink-0">seg</span>
        </div>
        <Button type="submit" disabled={disabled} className="h-11 px-4 shrink-0"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-1">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select value={sound} onChange={e => setSound(e.target.value)} disabled={disabled} className="flex-1 h-9 rounded-md border border-input bg-card px-2 text-sm">
            {ALARM_SOUNDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setVibration(!vibration)} disabled={disabled} className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors ${vibration ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
          <Smartphone className="h-3.5 w-3.5" />
          Vibrar
        </button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Volume2, Smartphone, Check } from "lucide-react";
import useAlarm, { ALARM_SOUNDS } from './useAlarm';

export default function IntervalForm({ onAdd, disabled, compact = false, initialValues = null, submitLabel = null }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [minutes, setMinutes] = useState(initialValues ? String(initialValues.minutes) : '');
  const [seconds, setSeconds] = useState(initialValues ? String(initialValues.seconds || 0) : '');
  const [sound, setSound] = useState(initialValues?.sound || 'beep');
  const [vibration, setVibration] = useState(initialValues?.vibration || false);
  const { playAlarm } = useAlarm();

  const handleSoundChange = (e) => {
    const val = e.target.value;
    setSound(val);
    playAlarm(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onAdd({ name: name.trim() || 'Intervalo', minutes: m, seconds: s, sound, vibration, id: initialValues?.id || Date.now() });
    if (!initialValues) { setName(''); setMinutes(''); setSeconds(''); setSound('beep'); setVibration(false); }
  };

  const [showOptions, setShowOptions] = useState(false);

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="h-10 text-sm bg-transparent flex-1" />
          <Input type="number" min="0" max="999" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled} className="h-10 w-14 text-center font-mono text-sm bg-transparent" />
          <span className="text-xs text-muted-foreground self-center">m</span>
          <Input type="number" min="0" max="59" placeholder="0" value={seconds} onChange={(e) => setSeconds(e.target.value)} disabled={disabled} className="h-10 w-14 text-center font-mono text-sm bg-transparent" />
          <span className="text-xs text-muted-foreground self-center">s</span>
          <Button type="submit" disabled={disabled} size="sm" className="h-10 px-3 shrink-0"><Plus className="h-4 w-4" /></Button>
        </div>
        {showOptions ? (
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 flex-1">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select value={sound} onChange={handleSoundChange} disabled={disabled} className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                {ALARM_SOUNDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setVibration(!vibration)} disabled={disabled} className={`flex items-center gap-1 h-8 px-2 rounded-md border text-xs transition-colors ${vibration ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'}`}>
              <Smartphone className="h-3 w-3" />Vibrar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowOptions(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sonido y vibración ▸
          </button>
        )}
      </form>
    );
  }

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
        <Button type="submit" disabled={disabled} className="h-11 px-4 shrink-0">{submitLabel ? <><Check className="h-4 w-4 mr-1" />{submitLabel}</> : <Plus className="h-4 w-4" />}</Button>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-1">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select value={sound} onChange={handleSoundChange} disabled={disabled} className="flex-1 h-9 rounded-md border border-input bg-card px-2 text-sm">
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

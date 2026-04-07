import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function IntervalForm({ onAdd, disabled }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onAdd({ name: name.trim() || 'Intervalo', minutes: m, seconds: s, id: Date.now() });
    setName(''); setMinutes(''); setSeconds('');
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
    </form>
  );
}

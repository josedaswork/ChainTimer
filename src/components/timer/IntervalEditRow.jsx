import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from 'lucide-react';

export default function IntervalEditRow({ interval, onSave, onCancel }) {
  const [name, setName] = useState(interval.name);
  const [minutes, setMinutes] = useState(String(interval.minutes));
  const [seconds, setSeconds] = useState(String(interval.seconds || 0));

  const handleSave = () => {
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onSave({ name: name.trim() || interval.name, minutes: m, seconds: s });
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
    </div>
  );
}

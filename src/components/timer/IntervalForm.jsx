/**
 * @history
 * 2026-04-15 — Fix: PieMenu preventDefault on pointerDown to block Android text selection on long-press
 * 2026-04-14 — Blur input on long-press to prevent Android keyboard during PieMenu
 * 2026-04-14 — Export usePieMenu hook for reuse
 * 2026-04-14 — i18n: all strings use t(), sound labels via soundLabels map
 * 2026-04-14 — PieMenu integration (long-press min/sec → radial presets)
 * 2026-04-14 — Sound preview at 60% volume (volumeScale: 0.6)
 * 2026-04-14 — Compact + full form variants, edit mode via initialValues
 * 2026-04-14 — Submit icon changed from + to checkmark
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Volume2, Smartphone, Check } from "lucide-react";
import useAlarm, { ALARM_SOUNDS } from './useAlarm';
import PieMenu, { getOptionPositions } from './PieMenu';
import { useI18n } from '@/lib/i18n';

const MINUTE_PRESETS = [5, 10, 30, 60];
const SECOND_PRESETS = [10, 15, 30, 45];

export function usePieMenu(options, onSelect, direction = 'up') {
  const [visible, setVisible] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const r = useRef({});
  r.current.options = options;
  r.current.onSelect = onSelect;

  // Create stable handlers once (useState setters are stable across renders)
  const handlersRef = useRef(null);
  if (!handlersRef.current) {
    const THRESHOLD = 40;

    const detach = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    const move = (e) => {
      if (!r.current.vis) {
        if (r.current.timer && Math.hypot(e.clientX - r.current.sx, e.clientY - r.current.sy) > 10) {
          clearTimeout(r.current.timer);
          r.current.timer = null;
          detach();
        }
        return;
      }
      const sp = r.current.sp;
      let minD = Infinity, near = -1;
      for (let i = 0; i < sp.length; i++) {
        const d = Math.hypot(e.clientX - sp[i].x, e.clientY - sp[i].y);
        if (d < minD) { minD = d; near = i; }
      }
      const idx = minD <= THRESHOLD ? near : -1;
      if (idx !== r.current.hi) {
        r.current.hi = idx;
        setHighlightedIndex(idx);
      }
    };

    const up = () => {
      detach();
      if (r.current.timer) { clearTimeout(r.current.timer); r.current.timer = null; }
      if (r.current.vis && r.current.hi >= 0) {
        r.current.onSelect(String(r.current.options[r.current.hi]));
      } else if (!r.current.vis && r.current.target) {
        // Short tap — manually focus the input since we called preventDefault
        r.current.target.focus();
      }
      r.current.vis = false;
      r.current.hi = -1;
      setVisible(false);
      setHighlightedIndex(-1);
    };

    handlersRef.current = { move, up, detach };
  }

  useEffect(() => () => {
    handlersRef.current.detach();
    if (r.current.timer) clearTimeout(r.current.timer);
  }, []);

  const onPointerDown = useCallback((e) => {
    e.preventDefault(); // Prevent Android text selection / keyboard on long-press
    r.current.sx = e.clientX;
    r.current.sy = e.clientY;
    r.current.target = e.target;
    window.addEventListener('pointermove', handlersRef.current.move);
    window.addEventListener('pointerup', handlersRef.current.up);
    window.addEventListener('pointercancel', handlersRef.current.up);

    r.current.timer = setTimeout(() => {
      r.current.timer = null;
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = direction === 'down' ? rect.bottom + 6 : rect.top - 6;
        const pos = getOptionPositions(r.current.options.length, direction);
        r.current.sp = pos.map(p => ({ x: cx + p.x, y: cy + p.y }));
      }
      r.current.vis = true;
      r.current.hi = -1;
      // Blur input to prevent Android keyboard from popping up on long press
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      setVisible(true);
      setHighlightedIndex(-1);
    }, 350);
  }, []);

  return { visible, highlightedIndex, wrapperRef, onPointerDown };
}

export default function IntervalForm({ onAdd, disabled, compact = false, initialValues = null, submitLabel = null }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [minutes, setMinutes] = useState(initialValues ? String(initialValues.minutes) : '');
  const [seconds, setSeconds] = useState(initialValues ? String(initialValues.seconds || 0) : '');
  const [sound, setSound] = useState(initialValues?.sound || 'beep');
  const [vibration, setVibration] = useState(initialValues?.vibration || false);
  const { playAlarm } = useAlarm();
  const { t } = useI18n();
  const soundLabels = { beep: t('soundBeep'), bell: t('soundBell'), chime: t('soundChime'), buzzer: t('soundBuzzer'), soft: t('soundSoft') };
  const minutesPie = usePieMenu(MINUTE_PRESETS, (v) => setMinutes(v));
  const secondsPie = usePieMenu(SECOND_PRESETS, (v) => setSeconds(v));
  const pieActive = minutesPie.visible || secondsPie.visible;

  const handleSoundChange = (e) => {
    const val = e.target.value;
    setSound(val);
    playAlarm(val, { volumeScale: 0.6 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = Math.max(0, parseInt(minutes) || 0);
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    if (m === 0 && s === 0) return;
    onAdd({ name: name.trim() || t('defaultIntervalName'), minutes: m, seconds: s, sound, vibration, id: initialValues?.id || Date.now() });
    if (!initialValues) { setName(''); setMinutes(''); setSeconds(''); setSound('beep'); setVibration(false); }
  };

  const [showOptions, setShowOptions] = useState(false);

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2 relative">
        {pieActive && <div className="absolute -inset-3 bg-black/40 z-10 rounded-2xl pointer-events-none" />}
        <div className="flex gap-2">
          <Input placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="h-10 text-sm bg-transparent flex-1" />
          <div ref={minutesPie.wrapperRef} onPointerDown={minutesPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`relative flex items-center ${minutesPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
            <Input type="number" min="0" max="999" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled} className="h-10 w-14 text-center font-mono text-sm bg-transparent" />
            <PieMenu options={MINUTE_PRESETS} highlightedIndex={minutesPie.highlightedIndex} visible={minutesPie.visible} />
          </div>
          <span className="text-xs text-muted-foreground self-center">m</span>
          <div ref={secondsPie.wrapperRef} onPointerDown={secondsPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`relative flex items-center ${secondsPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
            <Input type="number" min="0" max="59" placeholder="0" value={seconds} onChange={(e) => setSeconds(e.target.value)} disabled={disabled} className="h-10 w-14 text-center font-mono text-sm bg-transparent" />
            <PieMenu options={SECOND_PRESETS} highlightedIndex={secondsPie.highlightedIndex} visible={secondsPie.visible} />
          </div>
          <span className="text-xs text-muted-foreground self-center">s</span>
          <Button type="submit" disabled={disabled} size="sm" className="h-10 px-3 shrink-0"><Plus className="h-4 w-4" /></Button>
        </div>
        {showOptions ? (
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 flex-1">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select value={sound} onChange={handleSoundChange} disabled={disabled} className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                {ALARM_SOUNDS.map(s => <option key={s.id} value={s.id}>{soundLabels[s.id]}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setVibration(!vibration)} disabled={disabled} className={`flex items-center gap-1 h-8 px-2 rounded-md border text-xs transition-colors ${vibration ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'}`}>
              <Smartphone className="h-3 w-3" />{t('vibrate')}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowOptions(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t('soundAndVibration')}
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 relative">
      {pieActive && <div className="absolute -inset-3 bg-black/40 z-10 rounded-2xl pointer-events-none" />}
      <Input placeholder={t('intervalNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="h-11 text-base bg-card" />
      <div className="flex gap-2">
        <div ref={minutesPie.wrapperRef} onPointerDown={minutesPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`flex items-center gap-1 flex-1 relative ${minutesPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
          <Input type="number" min="0" max="999" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled} className="h-11 text-center font-mono text-base bg-card" />
          <span className="text-sm text-muted-foreground font-medium shrink-0">{t('min')}</span>
          <PieMenu options={MINUTE_PRESETS} highlightedIndex={minutesPie.highlightedIndex} visible={minutesPie.visible} />
        </div>
        <div ref={secondsPie.wrapperRef} onPointerDown={secondsPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`flex items-center gap-1 flex-1 relative ${secondsPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
          <Input type="number" min="0" max="59" placeholder="0" value={seconds} onChange={(e) => setSeconds(e.target.value)} disabled={disabled} className="h-11 text-center font-mono text-base bg-card" />
          <span className="text-sm text-muted-foreground font-medium shrink-0">{t('sec')}</span>
          <PieMenu options={SECOND_PRESETS} highlightedIndex={secondsPie.highlightedIndex} visible={secondsPie.visible} />
        </div>
        <Button type="submit" disabled={disabled} className="h-11 px-4 shrink-0">{submitLabel ? <><Check className="h-4 w-4 mr-1" />{submitLabel}</> : <Check className="h-4 w-4" />}</Button>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-1">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select value={sound} onChange={handleSoundChange} disabled={disabled} className="flex-1 h-9 rounded-md border border-input bg-card px-2 text-sm">
            {ALARM_SOUNDS.map(s => <option key={s.id} value={s.id}>{soundLabels[s.id]}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setVibration(!vibration)} disabled={disabled} className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors ${vibration ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card text-muted-foreground'}`}>
          <Smartphone className="h-3.5 w-3.5" />
          {t('vibrate')}
        </button>
      </div>
    </form>
  );
}

/**
 * @history
 * 2026-04-15 — PieMenu: no highlight when pointer drags to wrong side (below for up, above for down)
 * 2026-04-15 — Replace number inputs with ScrollPicker (vertical drag-scroll)
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
import ScrollPicker from './ScrollPicker';
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
    const detach = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    // Find highlighted option using center→finger line intersection with arc
    const findHighlight = (fingerX, fingerY) => {
      const sp = r.current.sp;
      const cx = r.current.cx;
      const cy = r.current.cy;
      const dir = r.current.dir;
      if (!sp || sp.length === 0) return -1;

      // If user drags to the wrong side (below center for 'up', above for 'down'), deselect
      if (dir === 'up' && fingerY > cy) return -1;
      if (dir === 'down' && fingerY < cy) return -1;

      // Angle from center to finger
      const fingerAngle = Math.atan2(fingerY - cy, fingerX - cx);

      // Angle of each option from center
      const angles = sp.map(p => Math.atan2(p.y - cy, p.x - cx));

      // Find closest option by angle
      let bestIdx = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < angles.length; i++) {
        let diff = Math.abs(fingerAngle - angles[i]);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      }

      return bestIdx;
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
      const idx = findHighlight(e.clientX, e.clientY);
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
        r.current.cx = cx;
        r.current.cy = cy;
        r.current.dir = direction;
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
  const [minutes, setMinutes] = useState(initialValues ? (parseInt(initialValues.minutes) || 0) : 0);
  const [seconds, setSeconds] = useState(initialValues ? (parseInt(initialValues.seconds) || 0) : 0);
  const [sound, setSound] = useState(initialValues?.sound || 'beep');
  const [vibration, setVibration] = useState(initialValues?.vibration || false);
  const { playAlarm } = useAlarm();
  const { t } = useI18n();
  const soundLabels = { beep: t('soundBeep'), bell: t('soundBell'), chime: t('soundChime'), buzzer: t('soundBuzzer'), soft: t('soundSoft') };
  const minutesPie = usePieMenu(MINUTE_PRESETS, (v) => setMinutes(parseInt(v)));
  const secondsPie = usePieMenu(SECOND_PRESETS, (v) => setSeconds(parseInt(v)));
  const pieActive = minutesPie.visible || secondsPie.visible;

  const handleSoundChange = (e) => {
    const val = e.target.value;
    setSound(val);
    playAlarm(val, { volumeScale: 0.6 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = Math.max(0, minutes);
    const s = Math.max(0, Math.min(59, seconds));
    if (m === 0 && s === 0) return;
    onAdd({ name: name.trim() || t('defaultIntervalName'), minutes: m, seconds: s, sound, vibration, id: initialValues?.id || Date.now() });
    if (!initialValues) { setName(''); setMinutes(0); setSeconds(0); setSound('beep'); setVibration(false); }
  };

  const [showOptions, setShowOptions] = useState(false);

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2 relative">
        {pieActive && <div className="absolute -inset-3 bg-black/40 z-10 rounded-2xl pointer-events-none" />}
        <div className="flex gap-2">
          <Input placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="h-10 text-sm bg-transparent flex-1" />
          <div ref={minutesPie.wrapperRef} onPointerDown={minutesPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`relative flex items-center ${minutesPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
            <div className="relative w-14">
              <ScrollPicker value={minutes} onChange={setMinutes} min={0} max={120} disabled={disabled} locked={minutesPie.visible} className="text-sm" />
              <PieMenu options={MINUTE_PRESETS} highlightedIndex={minutesPie.highlightedIndex} visible={minutesPie.visible} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground self-center">m</span>
          <div ref={secondsPie.wrapperRef} onPointerDown={secondsPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`relative flex items-center ${secondsPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
            <div className="relative w-14">
              <ScrollPicker value={seconds} onChange={setSeconds} min={0} max={59} disabled={disabled} locked={secondsPie.visible} className="text-sm" />
              <PieMenu options={SECOND_PRESETS} highlightedIndex={secondsPie.highlightedIndex} visible={secondsPie.visible} />
            </div>
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
        <div ref={minutesPie.wrapperRef} onPointerDown={minutesPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`flex items-center gap-1 flex-1 ${minutesPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
          <div className="relative flex-1">
            <ScrollPicker value={minutes} onChange={setMinutes} min={0} max={59} disabled={disabled} locked={minutesPie.visible} className="text-base" />
            <PieMenu options={MINUTE_PRESETS} highlightedIndex={minutesPie.highlightedIndex} visible={minutesPie.visible} />
          </div>
          <span className="text-sm text-muted-foreground font-medium shrink-0">{t('min')}</span>
        </div>
        <div ref={secondsPie.wrapperRef} onPointerDown={secondsPie.onPointerDown} onContextMenu={e => e.preventDefault()} className={`flex items-center gap-1 flex-1 ${secondsPie.visible ? 'z-20' : ''}`} style={{ touchAction: 'none' }}>
          <div className="relative flex-1">
            <ScrollPicker value={seconds} onChange={setSeconds} min={0} max={59} disabled={disabled} locked={secondsPie.visible} className="text-base" />
            <PieMenu options={SECOND_PRESETS} highlightedIndex={secondsPie.highlightedIndex} visible={secondsPie.visible} />
          </div>
          <span className="text-sm text-muted-foreground font-medium shrink-0">{t('sec')}</span>
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

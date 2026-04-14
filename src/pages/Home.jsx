/**
 * @history
 * 2026-04-14 — Smooth page transitions (fade+slide) between list and timer views
 * 2026-04-14 — i18n: confirmation dialog strings use t()
 * 2026-04-14 — Timer persistence: display:none/contents keeps TaskTimer mounted
 * 2026-04-14 — Android back button via @capacitor/app
 * 2026-04-14 — Confirmation dialog when switching tasks with active timer
 */
import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { motion, useAnimation } from 'framer-motion';
import TaskList from './TaskList';
import TaskTimer from './TaskTimer';
import { useI18n } from '../lib/i18n';

export default function Home() {
  const { t } = useI18n();
  const [activeTaskId, setActiveTaskId] = useState(null);   // task with timer mounted
  const [viewingTimer, setViewingTimer] = useState(false);   // true = showing timer, false = showing list
  const [timerRunning, setTimerRunning] = useState(false);   // tracked from TaskTimer
  const [confirmTarget, setConfirmTarget] = useState(null);  // task id pending confirmation

  const handleSelectTask = useCallback((id) => {
    if (activeTaskId !== null && activeTaskId !== id && timerRunning) {
      setConfirmTarget(id);
      return;
    }
    setActiveTaskId(id);
    setViewingTimer(true);
  }, [activeTaskId, timerRunning]);

  const handleConfirmSwitch = useCallback(() => {
    setActiveTaskId(confirmTarget);
    setViewingTimer(true);
    setConfirmTarget(null);
    setTimerRunning(false);
  }, [confirmTarget]);

  const handleBack = useCallback(() => {
    setViewingTimer(false);
  }, []);

  // Android hardware back button
  useEffect(() => {
    let handler;
    try {
      handler = CapApp.addListener('backButton', () => {
        if (viewingTimer) {
          setViewingTimer(false);
        } else {
          CapApp.exitApp();
        }
      });
    } catch { /* web fallback — no native back button */ }
    return () => { handler?.remove?.(); };
  }, [viewingTimer]);

  // Page transition animations
  const listControls = useAnimation();
  const timerControls = useAnimation();

  useLayoutEffect(() => {
    if (viewingTimer) {
      // Entering timer: fade + slide up
      timerControls.set({ opacity: 0, y: 12 });
      timerControls.start({ opacity: 1, y: 0, transition: { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] } });
    } else {
      // Returning to list: quicker, subtle fade + slight slide down
      listControls.set({ opacity: 0, y: -6 });
      listControls.start({ opacity: 1, y: 0, transition: { duration: 0.07, ease: [0.25, 0.1, 0.25, 1] } });
    }
  }, [viewingTimer]);

  return (
    <>
      {/* TaskList — always mounted, hidden when viewing timer */}
      <motion.div
        animate={listControls}
        style={{ display: viewingTimer ? 'none' : undefined }}
      >
        <TaskList
          onSelectTask={handleSelectTask}
          activeTaskId={activeTaskId}
          timerRunning={timerRunning}
        />
      </motion.div>

      {/* TaskTimer — mounted when activeTaskId set, hidden when viewing list */}
      {activeTaskId !== null && (
        <motion.div
          animate={timerControls}
          style={{ display: viewingTimer ? undefined : 'none' }}
        >
          <TaskTimer
            key={activeTaskId}
            taskId={activeTaskId}
            onBack={handleBack}
            onRunningChange={setTimerRunning}
          />
        </motion.div>
      )}

      {/* Confirmation dialog */}
      {confirmTarget !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setConfirmTarget(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">{t('taskInProgress')}</h3>
            <p className="text-sm text-muted-foreground">{t('switchTaskConfirm')}</p>
            <div className="flex gap-3">
              <button onClick={handleConfirmSwitch} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">{t('yesSwitch')}</button>
              <button onClick={() => setConfirmTarget(null)} className="flex-1 h-11 rounded-xl border border-border text-foreground font-semibold text-sm">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import TaskList from './TaskList';
import TaskTimer from './TaskTimer';

export default function Home() {
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

  return (
    <>
      {/* TaskList — always mounted, hidden when viewing timer */}
      <div style={{ display: viewingTimer ? 'none' : 'contents' }}>
        <TaskList
          onSelectTask={handleSelectTask}
          activeTaskId={activeTaskId}
          timerRunning={timerRunning}
        />
      </div>

      {/* TaskTimer — mounted when activeTaskId set, hidden when viewing list */}
      {activeTaskId !== null && (
        <div style={{ display: viewingTimer ? 'contents' : 'none' }}>
          <TaskTimer
            key={activeTaskId}
            taskId={activeTaskId}
            onBack={handleBack}
            onRunningChange={setTimerRunning}
          />
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmTarget !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setConfirmTarget(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">Tarea en curso</h3>
            <p className="text-sm text-muted-foreground">Tienes una tarea con el timer activo. ¿Quieres abandonarla y empezar una nueva?</p>
            <div className="flex gap-3">
              <button onClick={handleConfirmSwitch} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Sí, cambiar</button>
              <button onClick={() => setConfirmTarget(null)} className="flex-1 h-11 rounded-xl border border-border text-foreground font-semibold text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

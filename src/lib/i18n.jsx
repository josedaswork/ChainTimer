/**
 * @history
 * 2026-04-15 — Add 'reps' key for series repeat button label
 * 2026-04-14 — Add getReady, seriesRound keys for countdown and repeat
 * 2026-04-14 — Removed flag emojis from LANGUAGES labels
 * 2026-04-14 — Created: i18n system with 5 languages (es/en/fr/ca/pt)
 * 2026-04-14 — I18nProvider + useI18n hook, t() with {param} interpolation
 * 2026-04-14 — plural() with _one/_other suffixes, LANGUAGES export
 * 2026-04-14 — localStorage persistence (key: chain-timer-lang)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  es: {
    // TaskList
    myTasks: 'Mis Tareas',
    selectTaskToStart: 'Selecciona una tarea para empezar',
    serial: 'Serie',
    parallel: 'Paralelo',
    save: 'Guardar',
    cancel: 'Cancelar',
    interval_one: 'intervalo',
    interval_other: 'intervalos',
    noTasksYet: 'Aún no tienes tareas',
    createToStart: 'Crea una para empezar',
    taskNamePlaceholder: 'Nombre de la tarea',
    create: 'Crear',
    newTask: 'Nueva tarea',
    deleteTask: 'Eliminar tarea',
    deleteTaskConfirm: '¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.',
    delete: 'Eliminar',

    // TaskTimer
    taskCompleted: '¡{name} completado! 🎉',
    starting: 'Iniciando...',
    completed: '¡Completado!',
    nextUp: 'Próximo: {name}',
    waiting: 'Esperando...',
    readyToStart: 'Listo para empezar',
    resumeAll: 'Reanudar todos',
    startAll: 'Iniciar todos',
    pauseAll: 'Pausar todos',
    resume: 'Reanudar',
    start: 'Iniciar',
    pause: 'Pausar',
    newInterval: 'Nuevo intervalo',
    editInterval: 'Editar intervalo',
    getReady: '¡Prepárate!',
    seriesRound: 'Ronda {current}/{total}',
    reps: 'reps',

    // Home
    taskInProgress: 'Tarea en curso',
    switchTaskConfirm: 'Tienes una tarea con el timer activo. ¿Quieres abandonarla y empezar una nueva?',
    yesSwitch: 'Sí, cambiar',

    // DraggableIntervalList
    intervals: 'Intervalos',
    addIntervalsToStart: 'Agrega intervalos para empezar',

    // IntervalForm
    defaultIntervalName: 'Intervalo',
    namePlaceholder: 'Nombre',
    intervalNamePlaceholder: 'Nombre del intervalo',
    vibrate: 'Vibrar',
    soundAndVibration: 'Sonido y vibración ▸',
    min: 'min',
    sec: 'seg',

    // Alarm sounds
    soundBeep: '🔔 Beep',
    soundBell: '🔕 Campana',
    soundChime: '🎵 Chime',
    soundBuzzer: '📢 Buzzer',
    soundSoft: '🌙 Suave',

    // Language
    language: 'Idioma',
  },
  en: {
    myTasks: 'My Tasks',
    selectTaskToStart: 'Select a task to begin',
    serial: 'Serial',
    parallel: 'Parallel',
    save: 'Save',
    cancel: 'Cancel',
    interval_one: 'interval',
    interval_other: 'intervals',
    noTasksYet: 'No tasks yet',
    createToStart: 'Create one to get started',
    taskNamePlaceholder: 'Task name',
    create: 'Create',
    newTask: 'New task',
    deleteTask: 'Delete task',
    deleteTaskConfirm: 'Are you sure you want to delete this task? This action cannot be undone.',
    delete: 'Delete',
    taskCompleted: '{name} completed! 🎉',
    starting: 'Starting...',
    completed: 'Completed!',
    nextUp: 'Next: {name}',
    waiting: 'Waiting...',
    readyToStart: 'Ready to start',
    resumeAll: 'Resume all',
    startAll: 'Start all',
    pauseAll: 'Pause all',
    resume: 'Resume',
    start: 'Start',
    pause: 'Pause',
    newInterval: 'New interval',
    editInterval: 'Edit interval',
    getReady: 'Get ready!',
    seriesRound: 'Round {current}/{total}',
    reps: 'reps',
    taskInProgress: 'Task in progress',
    switchTaskConfirm: 'You have an active timer. Do you want to stop it and start a new one?',
    yesSwitch: 'Yes, switch',
    intervals: 'Intervals',
    addIntervalsToStart: 'Add intervals to begin',
    defaultIntervalName: 'Interval',
    namePlaceholder: 'Name',
    intervalNamePlaceholder: 'Interval name',
    vibrate: 'Vibrate',
    soundAndVibration: 'Sound & vibration ▸',
    min: 'min',
    sec: 'sec',
    soundBeep: '🔔 Beep',
    soundBell: '🔕 Bell',
    soundChime: '🎵 Chime',
    soundBuzzer: '📢 Buzzer',
    soundSoft: '🌙 Soft',
    language: 'Language',
  },
  fr: {
    myTasks: 'Mes Tâches',
    selectTaskToStart: 'Sélectionnez une tâche pour commencer',
    serial: 'Série',
    parallel: 'Parallèle',
    save: 'Enregistrer',
    cancel: 'Annuler',
    interval_one: 'intervalle',
    interval_other: 'intervalles',
    noTasksYet: 'Aucune tâche pour le moment',
    createToStart: 'Créez-en une pour commencer',
    taskNamePlaceholder: 'Nom de la tâche',
    create: 'Créer',
    newTask: 'Nouvelle tâche',
    deleteTask: 'Supprimer la tâche',
    deleteTaskConfirm: 'Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.',
    delete: 'Supprimer',
    taskCompleted: '{name} terminé ! 🎉',
    starting: 'Démarrage...',
    completed: 'Terminé !',
    nextUp: 'Suivant : {name}',
    waiting: 'En attente...',
    readyToStart: 'Prêt à démarrer',
    resumeAll: 'Reprendre tous',
    startAll: 'Démarrer tous',
    pauseAll: 'Mettre en pause',
    resume: 'Reprendre',
    start: 'Démarrer',
    pause: 'Pause',
    newInterval: 'Nouvel intervalle',
    editInterval: 'Modifier l\'intervalle',
    getReady: 'Préparez-vous !',
    seriesRound: 'Tour {current}/{total}',
    reps: 'reps',
    taskInProgress: 'Tâche en cours',
    switchTaskConfirm: 'Vous avez un minuteur actif. Voulez-vous l\'arrêter et en démarrer un nouveau ?',
    yesSwitch: 'Oui, changer',
    intervals: 'Intervalles',
    addIntervalsToStart: 'Ajoutez des intervalles pour commencer',
    defaultIntervalName: 'Intervalle',
    namePlaceholder: 'Nom',
    intervalNamePlaceholder: 'Nom de l\'intervalle',
    vibrate: 'Vibrer',
    soundAndVibration: 'Son et vibration ▸',
    min: 'min',
    sec: 'sec',
    soundBeep: '🔔 Bip',
    soundBell: '🔕 Cloche',
    soundChime: '🎵 Carillon',
    soundBuzzer: '📢 Sonnerie',
    soundSoft: '🌙 Doux',
    language: 'Langue',
  },
  ca: {
    myTasks: 'Les Meves Tasques',
    selectTaskToStart: 'Selecciona una tasca per començar',
    serial: 'Sèrie',
    parallel: 'Paral·lel',
    save: 'Desar',
    cancel: 'Cancel·lar',
    interval_one: 'interval',
    interval_other: 'intervals',
    noTasksYet: 'Encara no tens tasques',
    createToStart: 'Crea\'n una per començar',
    taskNamePlaceholder: 'Nom de la tasca',
    create: 'Crear',
    newTask: 'Nova tasca',
    deleteTask: 'Eliminar tasca',
    deleteTaskConfirm: 'Estàs segur que vols eliminar aquesta tasca? Aquesta acció no es pot desfer.',
    delete: 'Eliminar',
    taskCompleted: '{name} completat! 🎉',
    starting: 'Iniciant...',
    completed: 'Completat!',
    nextUp: 'Següent: {name}',
    waiting: 'Esperant...',
    readyToStart: 'Llest per començar',
    resumeAll: 'Reprendre tots',
    startAll: 'Iniciar tots',
    pauseAll: 'Pausar tots',
    resume: 'Reprendre',
    start: 'Iniciar',
    pause: 'Pausa',
    newInterval: 'Nou interval',
    editInterval: 'Editar interval',
    getReady: 'Prepara\'t!',
    seriesRound: 'Ronda {current}/{total}',
    reps: 'reps',
    taskInProgress: 'Tasca en curs',
    switchTaskConfirm: 'Tens una tasca amb el temporitzador actiu. Vols abandonar-la i començar-ne una de nova?',
    yesSwitch: 'Sí, canviar',
    intervals: 'Intervals',
    addIntervalsToStart: 'Afegeix intervals per començar',
    defaultIntervalName: 'Interval',
    namePlaceholder: 'Nom',
    intervalNamePlaceholder: 'Nom de l\'interval',
    vibrate: 'Vibrar',
    soundAndVibration: 'So i vibració ▸',
    min: 'min',
    sec: 'seg',
    soundBeep: '🔔 Beep',
    soundBell: '🔕 Campana',
    soundChime: '🎵 Carillon',
    soundBuzzer: '📢 Brunzidor',
    soundSoft: '🌙 Suau',
    language: 'Idioma',
  },
  pt: {
    myTasks: 'Minhas Tarefas',
    selectTaskToStart: 'Selecione uma tarefa para começar',
    serial: 'Série',
    parallel: 'Paralelo',
    save: 'Salvar',
    cancel: 'Cancelar',
    interval_one: 'intervalo',
    interval_other: 'intervalos',
    noTasksYet: 'Ainda não tem tarefas',
    createToStart: 'Crie uma para começar',
    taskNamePlaceholder: 'Nome da tarefa',
    create: 'Criar',
    newTask: 'Nova tarefa',
    deleteTask: 'Excluir tarefa',
    deleteTaskConfirm: 'Tem certeza de que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
    delete: 'Excluir',
    taskCompleted: '{name} concluído! 🎉',
    starting: 'Iniciando...',
    completed: 'Concluído!',
    nextUp: 'Próximo: {name}',
    waiting: 'Aguardando...',
    readyToStart: 'Pronto para começar',
    resumeAll: 'Retomar todos',
    startAll: 'Iniciar todos',
    pauseAll: 'Pausar todos',
    resume: 'Retomar',
    start: 'Iniciar',
    pause: 'Pausar',
    newInterval: 'Novo intervalo',
    editInterval: 'Editar intervalo',
    getReady: 'Prepare-se!',
    seriesRound: 'Rodada {current}/{total}',
    reps: 'reps',
    taskInProgress: 'Tarefa em andamento',
    switchTaskConfirm: 'Você tem um temporizador ativo. Deseja parar e iniciar um novo?',
    yesSwitch: 'Sim, trocar',
    intervals: 'Intervalos',
    addIntervalsToStart: 'Adicione intervalos para começar',
    defaultIntervalName: 'Intervalo',
    namePlaceholder: 'Nome',
    intervalNamePlaceholder: 'Nome do intervalo',
    vibrate: 'Vibrar',
    soundAndVibration: 'Som e vibração ▸',
    min: 'min',
    sec: 'seg',
    soundBeep: '🔔 Beep',
    soundBell: '🔕 Sino',
    soundChime: '🎵 Carrilhão',
    soundBuzzer: '📢 Buzina',
    soundSoft: '🌙 Suave',
    language: 'Idioma',
  },
};

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ca', label: 'Català' },
  { code: 'pt', label: 'Português' },
];

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('chain-timer-lang') || 'es');

  const changeLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem('chain-timer-lang', code);
  }, []);

  const t = useCallback((key, params) => {
    const str = translations[lang]?.[key] || translations.es[key] || key;
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }, [lang]);

  const plural = useCallback((key, count) => {
    const suffix = count === 1 ? '_one' : '_other';
    return translations[lang]?.[key + suffix] || translations.es[key + suffix] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, changeLang, t, plural }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { translations };

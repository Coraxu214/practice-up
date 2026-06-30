import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadState, saveState } from './storage.js';
import { todayKey, isYesterday } from './date.js';
import { scheduleWeek } from './scheduler.js';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addNote = useCallback((note) => {
    setState((s) => {
      const next = { ...s, notes: [...s.notes, { ...note, id: crypto.randomUUID(), createdAt: Date.now() }] };
      next.schedule = scheduleWeek(next.notes, next.schedule);
      return next;
    });
  }, []);

  const removeNote = useCallback((id) => {
    setState((s) => {
      const notes = s.notes.filter((n) => n.id !== id);
      return { ...s, notes, schedule: scheduleWeek(notes, {}) };
    });
  }, []);

  const reshuffle = useCallback(() => {
    setState((s) => ({ ...s, schedule: scheduleWeek(s.notes, {}) }));
  }, []);

  const toggleAction = useCallback((dateKey, actionIdx) => {
    setState((s) => {
      const day = s.schedule[dateKey];
      if (!day || !day.noteId) return s;
      const done = new Set(day.doneActions || []);
      if (done.has(actionIdx)) done.delete(actionIdx);
      else done.add(actionIdx);
      return {
        ...s,
        schedule: {
          ...s.schedule,
          [dateKey]: { ...day, doneActions: [...done] },
        },
      };
    });
  }, []);

  const checkIn = useCallback((dateKey) => {
    setState((s) => {
      const day = s.schedule[dateKey];
      if (!day || day.checkedIn) return s;

      let { count, lastDate } = s.streak;
      if (lastDate === dateKey) {
        // already
      } else if (lastDate && isYesterday(lastDate)) {
        count += 1;
      } else if (!lastDate) {
        count = 1;
      } else {
        count = 1; // 断签重计
      }

      const note = s.notes.find((n) => n.id === day.noteId);
      const historyEntry = {
        date: dateKey,
        noteTitle: note?.title || '今日训练',
        bodyPart: day.bodyPart,
        duration: day.duration,
        exercises: note?.exercises?.length || 0,
        streak: count,
      };

      return {
        ...s,
        schedule: {
          ...s.schedule,
          [dateKey]: { ...day, checkedIn: true, checkedAt: Date.now() },
        },
        streak: { count, lastDate: dateKey },
        history: [historyEntry, ...s.history].slice(0, 50),
      };
    });
  }, []);

  const value = useMemo(
    () => ({ state, addNote, removeNote, reshuffle, toggleAction, checkIn }),
    [state, addNote, removeNote, reshuffle, toggleAction, checkIn],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export { todayKey };

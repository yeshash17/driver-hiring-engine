import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppDB } from '../models/app.model';
import type { WeekData, EmployeeMeta } from '../models/week.model';

interface AppState {
  db: AppDB;
  wk: string | null;
  villa: string | null;
  managerFilter: string;

  // Week CRUD
  setWeek: (key: string, data: WeekData) => void;
  deleteWeek: (key: string) => void;
  clearAll: () => void;

  // Navigation
  setActiveWeek: (key: string | null) => void;
  setVilla: (villa: string | null) => void;
  setManagerFilter: (manager: string) => void;

  // Edits
  applyShiftEdit: (wkKey: string, rowId: number, newId: string) => void;
  clearShiftEdit: (wkKey: string, rowId: number) => void;
  applyWeekEdit: (wkKey: string, empId: string, newId: string) => void;
  clearWeekEdit: (wkKey: string, empId: string) => void;
  applyCarDriverEdit: (wkKey: string, rowId: number, newId: string) => void;
  clearCarDriverEdit: (wkKey: string, rowId: number) => void;

  // Meta
  updateMeta: (wkKey: string, empId: string, field: keyof EmployeeMeta, value: unknown) => void;
  ensureMeta: (wkKey: string, empId: string, defaults?: Partial<EmployeeMeta>) => void;
  updateManagerMap: (wkKey: string, branch: string, manager: string) => void;

  // Lock
  toggleLock: (wkKey: string) => void;
}

const DEFAULT_META = (id: string): EmployeeMeta => ({
  id, name: '', canDrive: false, experience: 'Mid', manager: '', homeBranch: '',
});

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      db: { weeks: {} },
      wk: null,
      villa: null,
      managerFilter: '',

      setWeek: (key, data) =>
        set((s) => ({ db: { ...s.db, weeks: { ...s.db.weeks, [key]: data } } })),

      deleteWeek: (key) =>
        set((s) => {
          const weeks = { ...s.db.weeks };
          delete weeks[key];
          const keys = Object.keys(weeks);
          const newWk = s.wk === key ? (keys[keys.length - 1] ?? null) : s.wk;
          return { db: { ...s.db, weeks }, wk: newWk, villa: s.wk === key ? null : s.villa };
        }),

      clearAll: () => set({ db: { weeks: {} }, wk: null, villa: null, managerFilter: '' }),

      setActiveWeek: (key) => set({ wk: key }),
      setVilla: (villa) => set({ villa }),
      setManagerFilter: (managerFilter) => set({ managerFilter }),

      applyShiftEdit: (wkKey, rowId, newId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const shift = { ...wk.edits.shift, [rowId]: newId };
          const shiftMeta = { ...wk.edits.shiftMeta };
          delete shiftMeta[rowId];
          const meta = { ...wk.meta };
          if (!meta[newId]) meta[newId] = DEFAULT_META(newId);
          return {
            db: {
              ...s.db,
              weeks: {
                ...s.db.weeks,
                [wkKey]: { ...wk, meta, edits: { ...wk.edits, shift, shiftMeta } },
              },
            },
          };
        }),

      clearShiftEdit: (wkKey, rowId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const shift = { ...wk.edits.shift };
          const shiftMeta = { ...wk.edits.shiftMeta };
          delete shift[rowId];
          delete shiftMeta[rowId];
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, edits: { ...wk.edits, shift, shiftMeta } } },
            },
          };
        }),

      applyWeekEdit: (wkKey, empId, newId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const weeklyShift = { ...wk.edits.weeklyShift, [empId]: newId };
          const meta = { ...wk.meta };
          if (!meta[newId]) meta[newId] = DEFAULT_META(newId);
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, meta, edits: { ...wk.edits, weeklyShift } } },
            },
          };
        }),

      clearWeekEdit: (wkKey, empId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const weeklyShift = { ...wk.edits.weeklyShift };
          delete weeklyShift[empId];
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, edits: { ...wk.edits, weeklyShift } } },
            },
          };
        }),

      applyCarDriverEdit: (wkKey, rowId, newId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const carDriver = { ...wk.edits.carDriver, [rowId]: newId };
          const meta = { ...wk.meta };
          if (!meta[newId]) meta[newId] = { ...DEFAULT_META(newId), canDrive: true };
          meta[newId].canDrive = true;
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, meta, edits: { ...wk.edits, carDriver } } },
            },
          };
        }),

      clearCarDriverEdit: (wkKey, rowId) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          const carDriver = { ...wk.edits.carDriver };
          delete carDriver[rowId];
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, edits: { ...wk.edits, carDriver } } },
            },
          };
        }),

      updateMeta: (wkKey, empId, field, value) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk || wk.locked) return s;
          const prev = wk.meta[empId] || DEFAULT_META(empId);
          const meta = { ...wk.meta, [empId]: { ...prev, [field]: value } };
          return { db: { ...s.db, weeks: { ...s.db.weeks, [wkKey]: { ...wk, meta } } } };
        }),

      ensureMeta: (wkKey, empId, defaults) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk || wk.meta[empId]) return s;
          const meta = { ...wk.meta, [empId]: { ...DEFAULT_META(empId), ...defaults } };
          return { db: { ...s.db, weeks: { ...s.db.weeks, [wkKey]: { ...wk, meta } } } };
        }),

      updateManagerMap: (wkKey, branch, manager) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk || wk.locked) return s;
          const managerMap = { ...wk.managerMap, [branch]: manager };
          return { db: { ...s.db, weeks: { ...s.db.weeks, [wkKey]: { ...wk, managerMap } } } };
        }),

      toggleLock: (wkKey) =>
        set((s) => {
          const wk = s.db.weeks[wkKey];
          if (!wk) return s;
          return {
            db: {
              ...s.db,
              weeks: { ...s.db.weeks, [wkKey]: { ...wk, locked: !wk.locked } },
            },
          };
        }),
    }),
    { name: 'shifthq-review-v1' }
  )
);

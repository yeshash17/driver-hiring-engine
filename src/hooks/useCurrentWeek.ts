import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getEffectiveWeek, filteredData, getVillas } from '../utils/schedule.utils';
import type { WeekData, EffectiveWeek } from '../models/week.model';

export function useCurrentWeek(): WeekData | null {
  const { db, wk } = useAppStore();
  return wk ? (db.weeks[wk] ?? null) : null;
}

export function useEffectiveWeek(): EffectiveWeek | null {
  const wk = useCurrentWeek();
  return useMemo(() => (wk ? getEffectiveWeek(wk) : null), [wk]);
}

export function useFilteredData(): EffectiveWeek | null {
  const wk = useCurrentWeek();
  const { villa, managerFilter } = useAppStore();
  return useMemo(
    () => (wk ? filteredData(wk, villa, managerFilter) : null),
    [wk, villa, managerFilter]
  );
}

export function useVillas(): string[] {
  const wk = useCurrentWeek();
  return useMemo(() => (wk ? getVillas(wk) : []), [wk]);
}

export function useManagers(): string[] {
  const wk = useCurrentWeek();
  return useMemo(
    () =>
      wk
        ? [...new Set(Object.values(wk.managerMap || {}).filter(Boolean))].sort()
        : [],
    [wk]
  );
}

export function useWeekKeys(): string[] {
  const { db } = useAppStore();
  return useMemo(() => Object.keys(db.weeks).sort(), [db.weeks]);
}

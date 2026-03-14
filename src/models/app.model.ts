import type { WeekData } from './week.model';

export interface AppDB {
  weeks: Record<string, WeekData>;
}

export interface AppSession {
  wk: string | null;
  villa: string | null;
}

export type { WeekData };

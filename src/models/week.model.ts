export type TimeValue = number | string | null;
export type Experience = 'Junior' | 'Mid' | 'Senior';

export interface EmpRow {
  rowId: number;
  v: string;
  id: string;
  br: string;
  tIn: TimeValue;
  tOut: TimeValue;
  dayIn: string;
  hIn: TimeValue;
  cIn: string;
  tripInStart: TimeValue;
  tripInDur: TimeValue;
  tripInDurTot: TimeValue;
  dayOut: string;
  hOut: TimeValue;
  cOut: string;
  tripOutStart: TimeValue;
  tripOutDur: TimeValue;
  tripOutDurTot: TimeValue;
  shH: number;
  shC: number;
}

export interface CarRow {
  rowId: number;
  v: string;
  plate: string;
  type: string;
  pType: string;
  pathId: string;
  driver: string;
  tStart: TimeValue;
  day: string;
  hStart: TimeValue;
  nEmp: number;
  pax: string;
  dist: number;
  trvl: TimeValue;
  fuel: number;
}

export interface BranchRow {
  rowId: number;
  v: string;
  br: string;
  time: TimeValue;
  day: string;
  hour: TimeValue;
  req: number;
  reqAdj: number;
  allN: number;
  allIds: string;
  carN: number;
  carIds: string;
}

export interface EmployeeMeta {
  id: string;
  name: string;
  canDrive: boolean;
  experience: Experience;
  manager: string;
  homeBranch: string;
}

export interface WeekEdits {
  shift: Record<number, string>;
  shiftMeta: Record<number, unknown>;
  weeklyShift: Record<string, string>;
  carDriver: Record<number, string>;
}

export interface WeekBase {
  emp: EmpRow[];
  car: CarRow[];
  br: BranchRow[];
}

export interface WeekData {
  label: string;
  uploadDate: string;
  locked: boolean;
  base: WeekBase;
  meta: Record<string, EmployeeMeta>;
  managerMap: Record<string, string>;
  edits: WeekEdits;
  notes: string;
}

export interface EffectiveWeek {
  emp: EmpRow[];
  car: CarRow[];
  br: BranchRow[];
  meta: Record<string, EmployeeMeta>;
  managerMap: Record<string, string>;
}

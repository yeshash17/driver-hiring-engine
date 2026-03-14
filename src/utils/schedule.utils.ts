import { DAYS } from '../config/schedule.config';
import type { EmpRow, CarRow, EffectiveWeek, EmployeeMeta, WeekData } from '../models/week.model';
import { timeToFrac, fmtHr } from './time.utils';
import { parsePax, parseList, isDummyId, clone } from './parse.utils';

// ── Shift helpers ──────────────────────────────────────────────

export function shiftEnd(row: EmpRow): unknown {
  return row.tripOutStart != null && row.tripOutStart !== ''
    ? row.tripOutStart
    : row.hOut;
}

export function scheduleLabel(row: EmpRow): string {
  return `${fmtHr(row.hIn)} → ${fmtHr(shiftEnd(row) as import('../models/week.model').TimeValue)}`;
}

export function shiftDurationHours(row: EmpRow): number {
  const s = timeToFrac(row.hIn);
  const e = timeToFrac(shiftEnd(row) as import('../models/week.model').TimeValue);
  if (s == null || e == null) return row.shH || 0;
  let d = (e - s) * 24;
  if (d < 0) d += 24;
  return Math.round(d * 10) / 10;
}

export function shiftKey(row: EmpRow): string {
  return `${row.id}|${row.dayIn}|${row.br}|${fmtHr(row.hIn)}|${fmtHr(shiftEnd(row) as import('../models/week.model').TimeValue)}`;
}

export function overlaps(a: EmpRow, b: EmpRow): boolean {
  if (a.dayIn !== b.dayIn) return false;
  const s1 = timeToFrac(a.hIn) ?? 0;
  const e1 = timeToFrac(a.hOut) ?? 0;
  const s2 = timeToFrac(b.hIn) ?? 0;
  const e2 = timeToFrac(b.hOut) ?? 0;
  return s1 < e2 && s2 < e1;
}

// ── Employee analysis ──────────────────────────────────────────

export function getEmployeeWeekRows(empRows: EmpRow[], id: string): EmpRow[] {
  return empRows
    .filter((r) => r.id === id)
    .sort(
      (a, b) =>
        DAYS.indexOf(a.dayIn as typeof DAYS[number]) - DAYS.indexOf(b.dayIn as typeof DAYS[number]) ||
        (timeToFrac(a.hIn) ?? 0) - (timeToFrac(b.hIn) ?? 0)
    );
}

export interface EmployeeSummary {
  rows: EmpRow[];
  branches: string[];
  totalH: number;
}

export function employeeSummary(empRows: EmpRow[], id: string): EmployeeSummary {
  const rows = getEmployeeWeekRows(empRows, id);
  const branches = [...new Set(rows.map((r) => r.br))];
  return {
    rows,
    branches,
    totalH: rows.reduce((s, r) => s + shiftDurationHours(r), 0),
  };
}

export function employeeBranches(emp: EmpRow[], id: string): string[] {
  return [...new Set(emp.filter((x) => x.id === id).map((x) => x.br))];
}

export function employeeManagers(emp: EmpRow[], id: string, managerMap: Record<string, string>): string[] {
  return [
    ...new Set(
      employeeBranches(emp, id)
        .map((b) => managerMap[b])
        .filter(Boolean)
    ),
  ];
}

export function isFloater(emp: EmpRow[], id: string): boolean {
  return employeeBranches(emp, id).length > 1;
}

export function isCrossManagerFloater(emp: EmpRow[], id: string, managerMap: Record<string, string>): boolean {
  return employeeManagers(emp, id, managerMap).length > 1;
}

// ── Driver / car helpers ───────────────────────────────────────

export function needsLicensedReplacement(row: EmpRow, carRows: CarRow[]): boolean {
  return carRows.some(
    (c) =>
      c.day === row.dayIn &&
      (c.plate === row.cIn || c.plate === row.cOut) &&
      c.driver === row.id
  );
}

export function rowSwapType(row: EmpRow, eff: EffectiveWeek, meta: Record<string, EmployeeMeta>): 'driver' | 'employee' {
  const m = meta[row.id] || {};
  const driver = needsLicensedReplacement(row, eff.car) || !!m.canDrive;
  return driver ? 'driver' : 'employee';
}

export function employeeSwapType(id: string, eff: EffectiveWeek, meta: Record<string, EmployeeMeta>): 'driver' | 'employee' {
  const m = meta[id] || {};
  const rows = getEmployeeWeekRows(eff.emp, id);
  const driver = rows.some((r) => needsLicensedReplacement(r, eff.car)) || !!m.canDrive;
  return driver ? 'driver' : 'employee';
}

// ── Issue detection ────────────────────────────────────────────

export function rowIssues(row: EmpRow, eff: EffectiveWeek, managerMap: Record<string, string>): string[] {
  const issues: string[] = [];
  if (isDummyId(row.id)) issues.push('Dummy / vacant ID');
  if (isFloater(eff.emp, row.id)) issues.push('Floater');
  if (isCrossManagerFloater(eff.emp, row.id, managerMap)) issues.push('Cross-manager floater');
  if (needsLicensedReplacement(row, eff.car)) issues.push('Driver-linked shift');
  return issues;
}

// ── Candidate / scoring ────────────────────────────────────────

export function findSwapRows(row: EmpRow, newId: string, empRows: EmpRow[]): EmpRow[] {
  return empRows.filter(
    (x) =>
      x.id === newId &&
      x.rowId !== row.rowId &&
      x.dayIn === row.dayIn &&
      overlaps(row, x)
  );
}

export function scoreCandidate(
  id: string,
  row: EmpRow,
  eff: EffectiveWeek,
  wk: WeekData
): number {
  const meta = wk.meta[id] || {};
  let s = 0;
  if ((meta.homeBranch || '') === row.br) s -= 10;
  if ((wk.managerMap[row.br] || '') && meta.manager === wk.managerMap[row.br]) s -= 6;
  if ((meta.experience || '').toLowerCase().includes('jun')) s -= 3;
  if (meta.canDrive) s -= 1;
  s += employeeBranches(eff.emp, id).length;
  return s;
}

export function getCandidates(row: EmpRow, eff: EffectiveWeek, wk: WeekData): string[] {
  const ids = [
    ...new Set(
      eff.emp
        .filter((x) => x.v === row.v)
        .map((x) => x.id)
        .concat(Object.keys(wk.meta || {}))
    ),
  ].filter(Boolean);
  const sourceType = rowSwapType(row, eff, wk.meta);
  return ids.filter((id) => {
    if (id === row.id) return false;
    return employeeSwapType(id, eff, wk.meta) === sourceType;
  });
}

export function getWeeklyCandidates(id: string, eff: EffectiveWeek, wk: WeekData): string[] {
  const sample = eff.emp.find((r) => r.id === id) || { v: '', br: '', rowId: -1, id } as EmpRow;
  const ids = [
    ...new Set(
      eff.emp
        .filter((x) => !sample.v || x.v === sample.v)
        .map((x) => x.id)
        .concat(Object.keys(wk.meta || {}))
    ),
  ].filter(Boolean);
  const sourceType = employeeSwapType(id, eff, wk.meta);
  return ids.filter((cid) => {
    if (cid === id) return false;
    return employeeSwapType(cid, eff, wk.meta) === sourceType;
  });
}

export function carRowsForShift(row: EmpRow, carRows: CarRow[]): CarRow[] {
  return carRows.filter(
    (c) =>
      c.day === row.dayIn &&
      (c.plate === row.cIn ||
        c.plate === row.cOut ||
        parsePax(c.pax).some((p) => p.id === row.id))
  );
}

// ── Effective week computation ─────────────────────────────────

export function propagateEmployeeSwap(
  eff: EffectiveWeek,
  row: EmpRow,
  oldId: string,
  newId: string
): void {
  eff.car.forEach((c) => {
    if (
      (c.plate === row.cIn && c.day === row.dayIn) ||
      (c.plate === row.cOut && c.day === row.dayOut)
    ) {
      const pax = parsePax(c.pax).map((p) =>
        p.id === oldId ? `${newId} - ${p.stop}` : `${p.id} - ${p.stop}`
      );
      c.pax = JSON.stringify(pax);
      if (c.driver === oldId) c.driver = newId;
    }
  });
  eff.br.forEach((b) => {
    if (b.br === row.br && b.day === row.dayIn) {
      const ids = parseList(b.allIds).map((x) => (x === oldId ? newId : x));
      b.allIds = JSON.stringify(ids);
    }
  });
}

export function getEffectiveWeek(wk: WeekData): EffectiveWeek {
  const eff: EffectiveWeek = {
    emp: clone(wk.base.emp),
    car: clone(wk.base.car),
    br: clone(wk.base.br),
    meta: wk.meta,
    managerMap: wk.managerMap,
  };

  const processedWeekSwaps = new Set<string>();
  Object.entries(wk.edits.weeklyShift || {}).forEach(([oldId, newId]) => {
    if (!newId || processedWeekSwaps.has(oldId) || processedWeekSwaps.has(newId)) return;
    eff.emp.forEach((row) => {
      if (row.id === oldId) {
        row.id = newId;
        propagateEmployeeSwap(eff, row, oldId, newId);
      } else if (row.id === newId) {
        row.id = oldId;
        propagateEmployeeSwap(eff, row, newId, oldId);
      }
    });
    processedWeekSwaps.add(oldId);
    processedWeekSwaps.add(newId);
  });

  const processedSwapTargets = new Set<number>();
  Object.entries(wk.edits.shift || {}).forEach(([rowIdStr, newId]) => {
    const rowId = Number(rowIdStr);
    const row = eff.emp[rowId];
    if (!row || !newId || processedSwapTargets.has(rowId)) return;
    const oldId = row.id;
    const swapRows = findSwapRows(row, newId, eff.emp);
    row.id = newId;
    propagateEmployeeSwap(eff, row, oldId, newId);
    swapRows.forEach((swapRow) => {
      processedSwapTargets.add(swapRow.rowId);
      swapRow.id = oldId;
      propagateEmployeeSwap(eff, swapRow, newId, oldId);
    });
  });

  Object.entries(wk.edits.carDriver || {}).forEach(([rowIdStr, newId]) => {
    const rowId = Number(rowIdStr);
    const row = eff.car[rowId];
    if (row && newId) row.driver = newId;
  });

  return eff;
}

export function filteredData(
  wk: WeekData,
  villa: string | null,
  managerFilter: string
): EffectiveWeek {
  const eff = getEffectiveWeek(wk);
  let { emp, car, br } = eff;

  if (villa) {
    emp = emp.filter((x) => x.v === villa);
    car = car.filter((x) => x.v === villa);
    br  = br.filter((x) => x.v === villa);
  }

  if (managerFilter) {
    const allowed = new Set(
      Object.entries(eff.managerMap)
        .filter(([, m]) => m === managerFilter)
        .map(([b]) => b)
    );
    emp = emp.filter((x) => allowed.has(x.br));
    br  = br.filter((x) => allowed.has(x.br));
    car = car.filter((c) => {
      const pax = parsePax(c.pax);
      return (
        pax.some((p) => allowed.has(p.stop)) ||
        allowed.has((c.pathId || '').split(' -> ').find((x) => allowed.has(x)) ?? '')
      );
    });
  }

  return { ...eff, emp, car, br };
}

// ── Label helpers ──────────────────────────────────────────────

export function empLabel(id: string, meta: Record<string, EmployeeMeta>): string {
  const m = meta[id] || {};
  const name = m.name || '';
  const extra = [name, m.canDrive ? 'DL' : '', m.homeBranch || '']
    .filter(Boolean)
    .join(' · ');
  return extra ? `${id} — ${extra}` : id;
}

export function employeeName(id: string, meta: Record<string, EmployeeMeta>): string {
  return (meta[id] || {}).name || '';
}

export function getVillas(wk: WeekData): string[] {
  return [
    ...new Set(
      [
        ...wk.base.emp.map((x) => x.v),
        ...wk.base.br.map((x) => x.v),
      ].filter(Boolean)
    ),
  ].sort();
}

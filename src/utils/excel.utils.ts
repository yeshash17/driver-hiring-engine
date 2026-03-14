import type { WorkBook } from 'xlsx';
import type { WeekData, EmpRow, CarRow, BranchRow, EmployeeMeta } from '../models/week.model';
import { findCol, toBool } from './parse.utils';
import { shiftDurationHours } from './schedule.utils';
import {
  EMP_EXPORT_HEADERS,
  CAR_EXPORT_HEADERS,
  BR_EXPORT_HEADERS,
  EDIT_EXPORT_HEADERS,
  META_EXPORT_HEADERS,
  MGR_EXPORT_HEADERS,
} from '../config/export.config';

// ── Header finder ──────────────────────────────────────────────

function hi(rows: unknown[][], col: string): number {
  return rows.findIndex(
    (r) => r && r.some((c) => String(c || '').toLowerCase().includes(col))
  );
}

// ── Week shell ─────────────────────────────────────────────────

export function newWeekShell(label: string): WeekData {
  return {
    label,
    uploadDate: new Date().toISOString(),
    locked: false,
    base: { emp: [], car: [], br: [] },
    meta: {},
    managerMap: {},
    edits: { shift: {}, shiftMeta: {}, weeklyShift: {}, carDriver: {} },
    notes: '',
  };
}

// ── Parsers ────────────────────────────────────────────────────

export function parseEmp(rows: unknown[][], wk: WeekData): void {
  let h = hi(rows, 'employee id');
  if (h === -1) h = 0;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!r || !r[1]) continue;
    wk.base.emp.push({
      rowId: wk.base.emp.length,
      v:    String(r[0] || '').trim(),
      id:   String(r[1]).trim(),
      br:   String(r[2] || '').trim(),
      tIn:  r[3] as EmpRow['tIn'],
      tOut: r[4] as EmpRow['tOut'],
      dayIn: String(r[5] || '').trim(),
      hIn:  r[6] as EmpRow['hIn'],
      cIn:  String(r[7] || '').trim(),
      tripInStart:   r[8]  as EmpRow['tripInStart'],
      tripInDur:     r[9]  as EmpRow['tripInDur'],
      tripInDurTot:  r[10] as EmpRow['tripInDurTot'],
      dayOut: String(r[11] || '').trim(),
      hOut:  r[12] as EmpRow['hOut'],
      cOut:  String(r[13] || '').trim(),
      tripOutStart:   r[14] as EmpRow['tripOutStart'],
      tripOutDur:     r[15] as EmpRow['tripOutDur'],
      tripOutDurTot:  r[16] as EmpRow['tripOutDurTot'],
      shH: Number(r[17] || 0),
      shC: Number(r[18] || 0),
    });
  }
}

export function parseCar(rows: unknown[][], wk: WeekData): void {
  let h = hi(rows, 'car plate');
  if (h === -1) h = 0;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!r || !r[1]) continue;
    wk.base.car.push({
      rowId: wk.base.car.length,
      v:      String(r[0] || '').trim(),
      plate:  String(r[1]).trim(),
      type:   String(r[2] || ''),
      pType:  String(r[3] || ''),
      pathId: String(r[4] || ''),
      driver: String(r[5] || '').trim(),
      tStart: r[6] as CarRow['tStart'],
      day:    String(r[7] || '').trim(),
      hStart: r[8] as CarRow['hStart'],
      nEmp:   Number(r[9] || 0),
      pax:    String(r[10] || '[]'),
      dist:   Number(r[11] || 0),
      trvl:   r[12] as CarRow['trvl'],
      fuel:   Number(r[13] || 0),
    });
  }
}

export function parseBr(rows: unknown[][], wk: WeekData): void {
  let h = hi(rows, 'emp req');
  if (h === -1) h = 0;
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!r || !r[1]) continue;
    wk.base.br.push({
      rowId:  wk.base.br.length,
      v:      String(r[0] || '').trim(),
      br:     String(r[1] || '').trim(),
      time:   r[2] as BranchRow['time'],
      day:    String(r[3] || '').trim(),
      hour:   r[4] as BranchRow['hour'],
      req:    Number(r[5] || 0),
      reqAdj: Number(r[6] || 0),
      allN:   Number(r[7] || 0),
      allIds: String(r[10] || '[]'),
      carN:   Number(r[13] || 0),
      carIds: String(r[14] || '[]'),
    });
  }
}

export function parseEmployeeMaster(rows: unknown[][], wk: WeekData): void {
  const header = (rows[0] || []) as unknown[];
  const idx = {
    id:      findCol(header, ['employee id', 'id']),
    name:    findCol(header, ['name', 'employee name']),
    drive:   findCol(header, ['can drive', 'driving license', 'license']),
    exp:     findCol(header, ['experience', 'level']),
    manager: findCol(header, ['area manager', 'manager']),
    home:    findCol(header, ['home branch', 'default branch']),
  };
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!r || !r[idx.id]) continue;
    const id = String(r[idx.id]).trim();
    const exp = String(r[idx.exp] || 'Mid').trim() || 'Mid';
    wk.meta[id] = {
      ...(wk.meta[id] || {}),
      id,
      name:       String(r[idx.name] || '').trim(),
      canDrive:   toBool(r[idx.drive]),
      experience: (['Junior', 'Mid', 'Senior'].includes(exp) ? exp : 'Mid') as EmployeeMeta['experience'],
      manager:    String(r[idx.manager] || '').trim(),
      homeBranch: String(r[idx.home] || '').trim(),
    };
  }
}

export function parseManagerMap(rows: unknown[][], wk: WeekData): void {
  const header = (rows[0] || []) as unknown[];
  const ib = findCol(header, ['branch']);
  const im = findCol(header, ['area manager', 'manager']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    if (!r || !r[ib]) continue;
    wk.managerMap[String(r[ib]).trim()] = String(r[im] || '').trim();
  }
}

export function seedMetaAndManagers(wk: WeekData): void {
  wk.base.emp.forEach((e) => {
    if (!wk.meta[e.id]) {
      wk.meta[e.id] = {
        id: e.id, name: '', canDrive: false,
        experience: 'Mid', manager: '', homeBranch: e.br,
      };
    }
  });
  const byBranch: Record<string, boolean> = {};
  wk.base.emp.forEach((e) => { byBranch[e.br] = true; });
  Object.keys(byBranch).forEach((br) => {
    if (!wk.managerMap[br]) wk.managerMap[br] = '';
  });
  wk.base.car.forEach((c) => {
    if (c.driver && !wk.meta[c.driver]) {
      wk.meta[c.driver] = {
        id: c.driver, name: '', canDrive: true,
        experience: 'Mid', manager: '', homeBranch: '',
      };
    }
    if (c.driver) wk.meta[c.driver].canDrive = true;
  });
}

// ── Parse schedule file ────────────────────────────────────────

export async function parseScheduleWorkbook(
  file: File,
  label: string,
  year: string
): Promise<{ wk: WeekData; key: string }> {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb: WorkBook = XLSX.read(e.target!.result, { type: 'array' });
        const key = `${label}-${year}`;
        const wk = newWeekShell(`${label} (${year})`);
        wb.SheetNames.forEach((sn) => {
          const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], {
            header: 1, defval: null, raw: true,
          });
          const low = sn.toLowerCase();
          if (low.includes('employeemaster'))      parseEmployeeMaster(rows as unknown[][], wk);
          else if (low.includes('employee'))       parseEmp(rows as unknown[][], wk);
          else if (low.includes('car'))            parseCar(rows as unknown[][], wk);
          else if (low.includes('branch'))         parseBr(rows as unknown[][], wk);
          if (low.includes('managermap'))          parseManagerMap(rows as unknown[][], wk);
        });
        seedMetaAndManagers(wk);
        resolve({ wk, key });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function looksLikeEmployeeMaster(rows: unknown[][]): boolean {
  const header = ((rows[0] || []) as unknown[]).map((x) => String(x || '').toLowerCase());
  return header.some((h) => h.includes('employee id') || h.includes('emp id') || (h.includes('employee') && header.some((h2) => h2.includes('name'))));
}

function looksLikeManagerMap(rows: unknown[][]): boolean {
  const header = ((rows[0] || []) as unknown[]).map((x) => String(x || '').toLowerCase());
  return header.some((h) => h.includes('branch')) && header.some((h) => h.includes('manager'));
}

export async function parseMasterWorkbook(file: File, wk: WeekData): Promise<void> {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb: WorkBook = XLSX.read(e.target!.result, { type: 'array' });
        let parsedEmp = false;
        let parsedMgr = false;
        // First pass: match by sheet name
        wb.SheetNames.forEach((sn) => {
          const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], {
            header: 1, defval: null, raw: true,
          }) as unknown[][];
          const low = sn.toLowerCase();
          if (low.includes('employeemaster') || low.replace(/\s/g,'').includes('employeemaster')) {
            parseEmployeeMaster(rows, wk); parsedEmp = true;
          }
          if (low.includes('managermap') || low.replace(/\s/g,'').includes('managermap')) {
            parseManagerMap(rows, wk); parsedMgr = true;
          }
        });
        // Second pass: match by column headers for any sheet not yet parsed
        if (!parsedEmp || !parsedMgr) {
          wb.SheetNames.forEach((sn) => {
            const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], {
              header: 1, defval: null, raw: true,
            }) as unknown[][];
            if (!parsedEmp && looksLikeEmployeeMaster(rows)) {
              parseEmployeeMaster(rows, wk); parsedEmp = true;
            } else if (!parsedMgr && looksLikeManagerMap(rows)) {
              parseManagerMap(rows, wk); parsedMgr = true;
            }
          });
        }
        seedMetaAndManagers(wk);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ── Export ─────────────────────────────────────────────────────

export async function exportReviewedWorkbook(
  wk: WeekData,
  data: { emp: EmpRow[]; car: CarRow[]; br: BranchRow[] },
  branchScope: string[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const empRows = [
    [...EMP_EXPORT_HEADERS],
    ...data.emp.map((r) => [
      r.v, r.id, r.br, r.tIn, r.tOut, r.dayIn, r.hIn, r.cIn,
      r.tripInStart, r.tripInDur, r.tripInDurTot ?? r.tripInDur,
      r.dayOut, r.hOut, r.cOut, r.tripOutStart, r.tripOutDur, r.tripOutDurTot ?? r.tripOutDur,
      shiftDurationHours(r), r.shC,
    ]),
  ];

  const carRows = [
    [...CAR_EXPORT_HEADERS],
    ...data.car.map((r) => [
      r.v, r.plate, r.type, r.pType, r.pathId, r.driver,
      r.tStart, r.day, r.hStart, r.nEmp, r.pax, r.dist, r.trvl, r.fuel,
    ]),
  ];

  const brRows = [
    [...BR_EXPORT_HEADERS],
    ...data.br.map((r) => [
      r.v, r.br, r.time, r.day, r.hour, r.req, r.reqAdj,
      r.allN, '', '', r.allIds, '', '', r.carN, r.carIds,
    ]),
  ];

  const editRows = [
    [...EDIT_EXPORT_HEADERS],
    ...Object.entries(wk.edits.weeklyShift || {}).map(([oldId, nid]) => ['Weekly Employee', oldId, oldId, nid]),
    ...Object.entries(wk.edits.shift || {}).map(([rid, nid]) => ['Shift Employee', rid, wk.base.emp[Number(rid)]?.id || '', nid]),
    ...Object.entries(wk.edits.carDriver || {}).map(([rid, nid]) => ['Car Driver', rid, wk.base.car[Number(rid)]?.driver || '', nid]),
  ];

  const metaRows = [
    [...META_EXPORT_HEADERS],
    ...Object.values(wk.meta || {})
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((m) => [m.id, m.name || '', m.canDrive ? 'Yes' : 'No', m.experience || '', m.homeBranch || '', m.manager || '']),
  ];

  const mgrRows = [
    [...MGR_EXPORT_HEADERS],
    ...Object.entries(wk.managerMap || {})
      .filter(([br]) => !branchScope.length || branchScope.includes(br))
      .sort((a, b) => a[0].localeCompare(b[0])),
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(empRows), 'Employees');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(carRows), 'Cars');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(brRows),  'Branch');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(editRows),'Review_Changes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaRows),'EmployeeMaster');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mgrRows), 'ManagerMap');

  const suffix = branchScope.length ? `_${branchScope.length}_branches` : '';
  XLSX.writeFile(wb, `ShiftHQ_reviewed_${wk.label.replace(/[^A-Za-z0-9]+/g, '_')}${suffix}.xlsx`);
}

export async function exportScheduleMatrix(
  wk: WeekData,
  eff: { emp: EmpRow[] }
): Promise<void> {
  const XLSX = await import('xlsx');
  const { getEmployeeWeekRows } = await import('./schedule.utils');
  const { DAYS } = await import('../config/schedule.config');
  const { fmtHr } = await import('./time.utils');

  const wb2 = XLSX.utils.book_new();
  const empHeader = ['Employee ID', 'Name', 'Branches', 'Total Hours', ...DAYS];
  const ids = [...new Set(eff.emp.map((x) => x.id))].sort();

  const empData = [
    empHeader,
    ...ids.map((id) => {
      const empRows = getEmployeeWeekRows(eff.emp, id);
      const m = wk.meta[id] || {};
      const brs = [...new Set(empRows.map((r) => r.br))].join(', ');
      const totalH = empRows.reduce((s, r) => s + shiftDurationHours(r), 0).toFixed(1);
      const dayMap: Record<string, EmpRow[]> = {};
      DAYS.forEach((d) => { dayMap[d] = []; });
      empRows.forEach((r) => { if (dayMap[r.dayIn]) dayMap[r.dayIn].push(r); });
      return [
        id, m.name || '', brs, totalH,
        ...DAYS.map((d) => {
          const shifts = dayMap[d];
          if (!shifts.length) return '—';
          return shifts.map((r) => `${fmtHr(r.hIn)}-${fmtHr(r.hOut)} @ ${r.br} [in:${r.cIn || '—'} out:${r.cOut || '—'}]`).join(' | ');
        }),
      ];
    }),
  ];
  XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet(empData), 'Employee Schedule');
  XLSX.writeFile(wb2, `ScheduleMatrix_${wk.label.replace(/[^A-Za-z0-9]+/g, '_')}.xlsx`);
}

export function parseList(str: string | null | undefined): string[] {
  if (!str || str === '[]') return [];
  try {
    return JSON.parse(String(str).replace(/'/g, '"'));
  } catch {
    return [];
  }
}

export interface PaxItem {
  id: string;
  stop: string;
}

export function parsePax(str: string | null | undefined): PaxItem[] {
  return parseList(str).map((x) => {
    const p = String(x).split(' - ');
    return { id: (p[0] || '').trim(), stop: (p[1] || '').trim() };
  });
}

export function pathStops(pathId: string, villa: string): Array<{ label: string; isVilla: boolean }> {
  if (!pathId) return [];
  return String(pathId)
    .split(' -> ')
    .map((s) => ({
      label: s.trim(),
      isVilla: s.includes('VILLA') || s.trim() === villa,
    }));
}

export function isDummyId(id: string | null | undefined): boolean {
  const s = String(id || '').toUpperCase();
  return !s || /DUMMY|TEMP|TEST|VACANT|OPEN|TBD|XXX|NEW/.test(s);
}

export function findCol(header: unknown[], alts: string[]): number {
  const low = header.map((x) => String(x || '').toLowerCase());
  for (const a of alts) {
    const idx = low.findIndex((x) => x.includes(a));
    if (idx > -1) return idx;
  }
  return -1;
}

export function toBool(v: unknown): boolean {
  const s = String(v || '').trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'licensed', 'drive'].includes(s);
}

export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

import type { TimeValue } from '../models/week.model';

export function timeToFrac(v: TimeValue): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{1,2}:\d{2}/.test(s)) {
      const [h, m] = s.split(':').map(Number);
      return (h * 60 + m) / (24 * 60);
    }
    return Number(s) || null;
  }
  if (typeof v === 'object' && v !== null && 'hours' in (v as object)) {
    const obj = v as { hours: number; minutes: number; seconds: number };
    return (obj.hours * 3600 + obj.minutes * 60 + obj.seconds) / (24 * 3600);
  }
  return null;
}

export function fmtHr(v: TimeValue): string {
  const f = timeToFrac(v);
  if (f == null || Number.isNaN(f)) return '—';
  const mins = Math.round(f * 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function tdDur(v: TimeValue): string {
  const f = timeToFrac(v);
  if (f == null || !f) return '—';
  const total = Math.round(f * 86400);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

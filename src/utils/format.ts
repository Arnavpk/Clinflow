import type { Visit } from '../types';

export const pad2 = (n: number | string) => String(n).padStart(2, '0');
export const pad3 = (n: number | string) => String(n).padStart(3, '0');

export function iso(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
export const todayISO = () => iso(new Date());
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
export const daysAhead = (n: number) => daysAgo(-n);
export const nowTime = () => {
  const d = new Date();
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
};

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parses an ISO yyyy-mm-dd date as a local date (no timezone shift). */
export function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

/** en-GB "22 Oct 2026" (matches toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})). */
export function fmtDate(s?: string | null): string {
  const d = s ? parseISO(s) : null;
  if (!d) return '—';
  return pad2(d.getDate()) + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}

/** en-GB "Thursday 22 October 2026". */
export function fmtLong(s: string): string {
  const d = parseISO(s);
  if (!d) return '—';
  return WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getFullYear();
}

export const dayPart = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

export const tokNum = (v: Visit) => parseInt(String(v.token).split('-')[1], 10) || 0;

export const initials = (name: string) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const plural = (n: number, word: string) => n + ' ' + word + (n === 1 ? '' : 's');

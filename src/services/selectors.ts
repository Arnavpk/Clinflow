import type { Db, Patient, Prescription, Visit } from '../types';
import { tokNum, todayISO } from '../utils/format';

export const patientById = (db: Db, id?: string | null): Patient | undefined => db.patients.find((p) => p.id === id);
export const patientName = (db: Db, id?: string | null) => patientById(db, id)?.name || 'Unknown';
export const rxById = (db: Db, id?: string | null): Prescription | undefined => db.prescriptions.find((r) => r.id === id);
export const visitById = (db: Db, id?: string | null): Visit | undefined => db.visits.find((v) => v.id === id);
export const todaysVisits = (db: Db) =>
  db.visits.filter((v) => v.date === todayISO()).sort((a, b) => tokNum(a) - tokNum(b));
export const lastVisitOf = (db: Db, pid: string): Visit | null =>
  db.visits.filter((v) => v.patientId === pid).sort((a, b) => b.date.localeCompare(a.date))[0] || null;

/** Today's open visit for a patient (in-consultation first) — used by the prescription builder. */
export const openVisitToday = (db: Db, pid: string | null | undefined) =>
  db.visits
    .filter((v) => v.patientId === pid && v.date === todayISO() && (v.status === 'in_consultation' || v.status === 'waiting'))
    .sort((a, b) => Number(b.status === 'in_consultation') - Number(a.status === 'in_consultation'))[0];

export function dateInRange(date: string, mode: string, start: string, end: string): boolean {
  const t = todayISO();
  if (mode === 'today') return date === t;
  if (mode === 'week') {
    const d = new Date();
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    const monday = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return date >= monday && date <= t;
  }
  if (mode === 'custom') return (!start || date >= start) && (!end || date <= end);
  return date.slice(0, 7) === t.slice(0, 7);
}

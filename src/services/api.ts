/**
 * Service layer. Every function maps to a future FastAPI endpoint and operates on a draft copy
 * of the in-memory database (see `mutate` in the store). Swap the bodies for fetch() calls later.
 */
import type { BusinessPrefs, Clinic, Db, Patient, Prescription, Staff, Visit, VisitOptions } from '../types';
import { nowTime, pad3, todayISO } from '../utils/format';

type PatientData = Omit<Patient, 'id' | 'registeredOn'>;

/** POST /patients */
export function apiCreatePatient(db: Db, d: PatientData): Patient {
  const p: Patient = { id: 'PAT' + pad3(db.seq.patient), ...d, registeredOn: todayISO() };
  db.patients.push(p);
  db.seq.patient++;
  return p;
}

/** PATCH /patients/{id} */
export function apiUpdatePatient(db: Db, id: string, patch: Partial<Patient>) {
  const p = db.patients.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
}

/** POST /visits — creates the visit and applies consultation/billing options. */
export function apiCreateVisit(
  db: Db,
  pid: string,
  biz: BusinessPrefs,
  opts?: Partial<VisitOptions> & { fee?: number; paymentMethod?: string; paid?: boolean },
): Visit {
  const visitType = opts?.visitType || 'offline';
  const v: Visit = {
    id: 'V-' + db.seq.visit,
    token: 'A-' + pad3(db.seq.token),
    patientId: pid,
    date: todayISO(),
    time: nowTime(),
    status: 'waiting',
    visitType,
    platform: visitType === 'online' ? opts?.platform || 'whatsapp' : '',
    meetingLink: opts?.meetingLink || '',
    fee: opts?.fee != null ? Math.max(0, Number(opts.fee) || 0) : Number(visitType === 'online' ? biz.onlineFee : biz.offlineFee) || 0,
    paymentStatus: opts?.paid ? 'paid' : 'unpaid',
    paymentMethod: opts?.paymentMethod || '',
    investigations: [],
    messagingContact: biz.messagingNumber,
  };
  db.visits.push(v);
  db.seq.token++;
  db.seq.visit++;
  return v;
}

/** POST /visits/{id}/start */
export function apiStartConsultation(db: Db, vid: string, patientName: (id: string) => string): { ok?: true; error?: string } {
  const active = db.visits.find((v) => v.status === 'in_consultation' && v.date === todayISO());
  if (active && active.id !== vid)
    return { error: active.token + ' — ' + patientName(active.patientId) + ' is already in consultation. Complete it first.' };
  const v = db.visits.find((x) => x.id === vid);
  if (v) v.status = 'in_consultation';
  return { ok: true };
}

/** POST /visits/{id}/complete */
export function apiCompleteVisit(db: Db, vid: string) {
  const v = db.visits.find((x) => x.id === vid);
  if (v) v.status = 'completed';
}

/** POST /visits/{id}/cancel */
export function apiCancelVisit(db: Db, vid: string) {
  const v = db.visits.find((x) => x.id === vid);
  if (v) v.status = 'cancelled';
}

/** PATCH /visits/{id} (billing, meeting link, investigations) */
export function apiUpdateVisit(db: Db, vid: string, patch: Partial<Visit>) {
  const v = db.visits.find((x) => x.id === vid);
  if (v) Object.assign(v, patch);
}

export interface RxPayload {
  visitId: string | null;
  patientId: string;
  symptoms: string;
  diagnosis: string;
  medicines: Prescription['medicines'];
  advice: string;
  followUp: string | null;
}

/** POST /prescriptions (new) or PUT /prescriptions/{id} (existing for this visit) */
export function apiSavePrescription(db: Db, payload: RxPayload, complete: boolean, doctor: string): { rx: Prescription; created: boolean } {
  const existing = payload.visitId ? db.prescriptions.find((r) => r.visitId === payload.visitId) : undefined;
  const v = payload.visitId ? db.visits.find((x) => x.id === payload.visitId) : undefined;
  if (existing) {
    Object.assign(existing, payload);
    if (v) {
      v.symptoms = payload.symptoms;
      v.diagnosis = payload.diagnosis;
      if (complete) v.status = 'completed';
    }
    return { rx: existing, created: false };
  }
  const rx: Prescription = { id: 'RX-' + db.seq.rx, date: todayISO(), doctor, ...payload };
  db.prescriptions.unshift(rx);
  db.seq.rx++;
  if (v) {
    v.symptoms = payload.symptoms;
    v.diagnosis = payload.diagnosis;
    v.prescriptionId = rx.id;
    if (complete) v.status = 'completed';
    else if (v.status === 'waiting') v.status = 'in_consultation';
  }
  return { rx, created: true };
}

/** POST /staff */
export function apiAddStaff(db: Db, s: Pick<Staff, 'name' | 'designation' | 'email' | 'mobile'>): Staff {
  const st: Staff = { id: 'U-' + db.seq.staff, ...s, role: 'reception', status: 'active' };
  db.staff.push(st);
  db.seq.staff++;
  return st;
}

/** PATCH /staff/{id} */
export function apiUpdateStaff(db: Db, id: string, patch: Partial<Staff>) {
  const s = db.staff.find((x) => x.id === id);
  if (s) Object.assign(s, patch);
}

/** PUT /clinic */
export function apiUpdateClinic(db: Db, patch: Partial<Clinic>) {
  Object.assign(db.clinic, patch);
}
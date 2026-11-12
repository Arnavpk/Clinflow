import type { Patient } from '../types';

export interface PatientForm {
  name: string;
  bloodGroup: string;
  age: string;
  gender: string;
  mobile: string;
  email: string;
}
export interface StaffForm {
  name: string;
  designation: string;
  email: string;
  mobile: string;
}
export type Errors<T> = Partial<Record<keyof T, string>>;

export const emptyPatientForm = (): PatientForm => ({ name: '', age: '', gender: '', bloodGroup: '', mobile: '', email: '' });

export function validatePatient(f: PatientForm): Errors<PatientForm> {
  const e: Errors<PatientForm> = {};
  if (!f.name.trim()) e.name = 'Full name is required';
  if (f.age === '') e.age = 'Age is required';
  else if (!(+f.age >= 0 && +f.age <= 120)) e.age = 'Enter a valid age (0–120)';
  if (!f.gender) e.gender = 'Select a gender';
  if (!/^\d{10}$/.test(f.mobile.trim())) e.mobile = 'Enter a 10-digit mobile number';
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  return e;
}

export function validateStaff(f: StaffForm): Errors<StaffForm> {
  const e: Errors<StaffForm> = {};
  if (!f.name.trim()) e.name = 'Name is required';
  if (!f.designation) e.designation = 'Select a designation';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email';
  if (!/^\d{10}$/.test(f.mobile.trim())) e.mobile = 'Enter a 10-digit mobile number';
  return e;
}

export const hasErrors = (e: object) => Object.keys(e).length > 0;

export type SearchField = 'all' | 'id' | 'name' | 'mobile';
export function searchPatients(list: Patient[], q: string, field: SearchField = 'all'): Patient[] {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return list;
  return list.filter((p) => {
    if (field === 'id') return p.id.toLowerCase().includes(s);
    if (field === 'name') return p.name.toLowerCase().includes(s);
    if (field === 'mobile') return p.mobile.includes(s);
    return (
      p.name.toLowerCase().includes(s) ||
      p.id.toLowerCase().includes(s) ||
      p.mobile.includes(s) ||
      (p.email || '').toLowerCase().includes(s)
    );
  });
}

export const patientFormToData = (f: PatientForm) => ({
  name: f.name.trim(),
  age: +f.age,
  gender: f.gender,
  bloodGroup: f.bloodGroup,
  mobile: f.mobile.trim(),
  email: f.email.trim(),
});
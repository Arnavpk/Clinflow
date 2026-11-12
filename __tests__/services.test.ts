import { seedDb } from '../src/data/seed';
import { DEFAULT_BUSINESS } from '../src/data/constants';
import {
  apiCancelVisit, apiCompleteVisit, apiCreatePatient, apiCreateVisit, apiSavePrescription, apiStartConsultation, apiAddStaff, apiUpdateClinic,
} from '../src/services/api';
import { dateInRange, openVisitToday, patientName, todaysVisits } from '../src/services/selectors';
import { cfNew, cfNormalize, cfPersist, cfSummary } from '../src/services/medicine';
import { searchPatients, validatePatient, validateStaff } from '../src/utils/validation';
import { fmtDate, fmtLong, todayISO } from '../src/utils/format';

describe('validation (ported rules)', () => {
  it('validates patient fields', () => {
    expect(validatePatient({ name: '', age: '', gender: '', bloodGroup: '', mobile: '12', email: 'x' })).toEqual({
      name: 'Full name is required', age: 'Age is required', gender: 'Select a gender', mobile: 'Enter a 10-digit mobile number', email: 'Enter a valid email address',
    });
    expect(validatePatient({ name: 'A', age: '121', gender: 'Male', bloodGroup: '', mobile: '9876543210', email: '' })).toEqual({ age: 'Enter a valid age (0–120)' });
    expect(validatePatient({ name: 'A', age: '0', gender: 'Male', bloodGroup: 'O+', mobile: '9876543210', email: 'a@b.co' })).toEqual({});
  });
  it('validates staff fields', () => {
    expect(Object.keys(validateStaff({ name: '', designation: '', email: 'bad', mobile: '1' }))).toEqual(['name', 'designation', 'email', 'mobile']);
    expect(validateStaff({ name: 'R', designation: 'Nurse', email: 'r@x.io', mobile: '9876543210' })).toEqual({});
  });
  it('searches by field', () => {
    const db = seedDb();
    expect(searchPatients(db.patients, 'pat00', 'id')).toHaveLength(9);
    expect(searchPatients(db.patients, '1234567890', 'mobile').map((p) => p.id)).toEqual(['PAT006', 'PAT034']);
    expect(searchPatients(db.patients, 'example.com').length).toBeGreaterThan(0);
  });
});

describe('service layer', () => {
  it('creates patients and visits with sequential ids/tokens', () => {
    const db = seedDb();
    const p = apiCreatePatient(db, { name: 'New', age: 30, gender: 'Male', bloodGroup: 'A+', mobile: '9999999999', email: '' });
    expect(p.bloodGroup).toBe('A+');
    expect(p.id).toBe('PAT035');
    const v = apiCreateVisit(db, p.id, DEFAULT_BUSINESS);
    expect(v.token).toBe('A-008');
    expect(v.status).toBe('waiting');
    expect(v.fee).toBe(300);
    const online = apiCreateVisit(db, p.id, DEFAULT_BUSINESS, { visitType: 'online', platform: 'meet', paid: true });
    expect(online).toMatchObject({ token: 'A-009', fee: 400, platform: 'meet', paymentStatus: 'paid' });
  });
  it('allows only one consultation at a time', () => {
    const db = seedDb();
    const r = apiStartConsultation(db, 'V-101', (id) => patientName(db, id));
    expect(r.error).toContain('A-002');
    apiCompleteVisit(db, 'V-102');
    expect(apiStartConsultation(db, 'V-101', (id) => patientName(db, id)).ok).toBe(true);
    apiCancelVisit(db, 'V-103');
    expect(db.visits.find((v) => v.id === 'V-103')?.status).toBe('cancelled');
  });
  it('saves then updates a visit prescription', () => {
    const db = seedDb();
    const payload = { visitId: 'V-101', patientId: 'PAT001', symptoms: 'Fever', diagnosis: 'Viral fever', medicines: [{ name: 'Paracetamol', dosage: '500 mg', frequency: '1-0-1-0', duration: 3 as const, unit: 'Days' }], advice: '', followUp: null };
    const a = apiSavePrescription(db, payload, false, 'Dr. X');
    expect(a).toMatchObject({ created: true, rx: { id: 'RX-102' } });
    expect(db.visits.find((v) => v.id === 'V-101')).toMatchObject({ status: 'in_consultation', prescriptionId: 'RX-102', diagnosis: 'Viral fever' });
    const b = apiSavePrescription(db, { ...payload, advice: 'Rest' }, true, 'Dr. X');
    expect(b).toMatchObject({ created: false, rx: { id: 'RX-102', advice: 'Rest' } });
    expect(db.visits.find((v) => v.id === 'V-101')?.status).toBe('completed');
  });
  it('manages staff and clinic', () => {
    const db = seedDb();
    expect(apiAddStaff(db, { name: 'R', designation: 'Nurse', email: 'r@x.io', mobile: '9876543210' })).toMatchObject({ id: 'U-4', status: 'active', designation: 'Nurse' });
    apiUpdateClinic(db, { name: 'Clinic 2' });
    expect(db.clinic.name).toBe('Clinic 2');
  });
  it('selects today’s queue in token order and open visits', () => {
    const db = seedDb();
    expect(todaysVisits(db).map((v) => v.token)).toEqual(['A-001', 'A-002', 'A-003', 'A-004', 'A-005', 'A-006', 'A-007']);
    expect(openVisitToday(db, 'PAT002')?.id).toBe('V-102');
    expect(dateInRange(todayISO(), 'today', '', '')).toBe(true);
    expect(dateInRange('2000-01-01', 'custom', '1999-12-31', '2000-01-02')).toBe(true);
  });
});

describe('medicine editor mapping', () => {
  it('normalises 3-slot frequencies and custom schedules', () => {
    expect(cfNormalize({ name: 'A', dosage: '1', frequency: '1-0-1', duration: 5, unit: 'Days' }).frequency).toBe('1-0-1-0');
    const c = cfNormalize({ name: 'B', dosage: '1', frequency: 'SOS', duration: '', unit: 'Days' });
    expect(c).toMatchObject({ customMode: true, customValue: 'SOS', duration: '3' });
    expect(cfPersist({ ...cfNew('C'), customMode: true, customValue: 'Once weekly', duration: '2', unit: 'Weeks' })).toMatchObject({ frequency: 'Once weekly', duration: 2 });
    expect(cfSummary({ ...cfNew('D', '5 mL'), mealTiming: 'After food' })).toBe('D · 5 mL · 0-0-0-0 · 3 Days · After food');
  });
  it('formats dates like en-GB', () => {
    expect(fmtDate('2026-10-22')).toBe('22 Oct 2026');
    expect(fmtLong('2026-10-22')).toBe('Thursday 22 October 2026');
    expect(fmtDate('')).toBe('—');
  });
});
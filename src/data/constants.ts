import type { BusinessPrefs, EditMed, Role, User } from '../types';
import type { IconName } from '../components/ui/icons';

export const DEMO_USERS: Record<Role, User> = {
  doctor: { name: 'Dr. Aditi Verma', email: 'doctor@clinicflow.test', mobile: '+91 98450 11223', role: 'doctor' },
  reception: { name: 'Priya Nair', email: 'reception@clinicflow.test', mobile: '+91 98450 44501', role: 'reception' },
};
export const DEMO_PASSWORD = 'clinic123';

export const ROLE_META: Record<Role, { label: string; dash: string }> = {
  doctor: { label: 'Doctor', dash: '/doctor/dashboard' },
  reception: { label: 'Reception', dash: '/reception/dashboard' },
};

export const FREQS = ['1-0-1', '1-1-1', '1-0-0', '0-0-1', '0-1-0', '1-1-0', 'SOS', 'Stat'];
export const UNITS = ['Days', 'Weeks', 'Months'];
export const emptyMed = (): EditMed => ({ name: '', dosage: '', frequency: '1-0-1', duration: '', unit: 'Days' });

export const CF_MEDICINES: [string, string][] = [
  ['Paracetamol 500 mg', '1 tablet'],
  ['Paracetamol 650 mg', '1 tablet'],
  ['Paracetamol 250 mg/5 mL', '5 mL'],
  ['Azithromycin 250 mg', '1 tablet'],
  ['Azithromycin 500 mg', '1 tablet'],
  ['Amoxicillin 500 mg', '1 capsule'],
  ['Amoxicillin + Clavulanic Acid 625 mg', '1 tablet'],
  ['Pantoprazole 40 mg', '1 tablet'],
  ['Cetirizine 10 mg', '1 tablet'],
  ['Ibuprofen 400 mg', '1 tablet'],
  ['Metformin 500 mg', '1 tablet'],
  ['Warm saline gargles', '—'],
];
export const CF_SYMPTOMS = ['Fever', 'Headache', 'Body ache', 'Cough', 'Cold', 'Sore throat', 'Vomiting', 'Blood in vomit', 'Nausea', 'Stomach pain', 'Abdominal pain', 'Diarrhea', 'Constipation', 'Dizziness', 'Weakness', 'Chest pain', 'Shortness of breath', 'Burning urination', 'Loss of appetite', 'Skin rash'];
export const CF_DIAGNOSES = ['Viral fever', 'Malaria', 'Typhoid fever', 'Acute pharyngitis', 'Gastroenteritis', 'Common cold', 'Migraine', 'Food poisoning', 'Chickenpox', 'Urinary tract infection', 'Acid reflux / GERD', 'Gastritis', 'Hypertension', 'Type 2 diabetes mellitus'];
export const CF_PERIODS = ['Morning', 'Afternoon', 'Evening', 'Night'];
export const CF_CUSTOM = ['Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'SOS / as required', 'Once weekly', 'Alternate days', 'Stat', 'Other'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const STAFF_DESIGNATIONS = ['Receptionist', 'Front Desk Executive', 'Nurse', 'Clinic Assistant', 'Billing Executive', 'Pharmacist', 'Lab Technician'];

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Other'];

export const DEFAULT_BUSINESS: BusinessPrefs = {
  onlineEnabled: false,
  offlinePaymentsEnabled: true,
  onlinePaymentsEnabled: true,
  messagingNumber: '8999644087',
  offlineFee: 300,
  onlineFee: 400,
  followupFee: 150,
  prepay: true,
  diagnosticsEnabled: true,
  providerName: '',
  providerEmail: '',
  providerWhatsApp: '',
};

export type NavItem =
  | { sec: string; line?: boolean }
  | { l: string; ic: IconName; r: string; m: string[]; badge?: 'waiting' };

export const NAV: Record<Role, NavItem[]> = {
  doctor: [
    { sec: 'Workspace' },
    { l: 'Dashboard', ic: 'dashboard', r: '/doctor/dashboard', m: ['/doctor', '/consultation'] },
    { l: 'Patients', ic: 'users', r: '/patients', m: ['/patients'] },
    { l: 'Visits', ic: 'clipboard', r: '/visits', m: ['/visits', '/queue'], badge: 'waiting' },
    { l: 'Prescriptions', ic: 'file-text', r: '/prescriptions', m: ['/prescriptions'] },
    { sec: 'Clinic', line: true },
    { l: 'Settings', ic: 'settings', r: '/settings', m: ['/settings/clinic', '/settings/prescription', '/settings/consultation'] },
    { l: 'Staff', ic: 'idcard', r: '/settings/staff', m: [] },
    { sec: 'Account', line: true },
    { l: 'Profile', ic: 'user', r: '/profile', m: [] },
  ],
  reception: [
    { sec: 'Workspace' },
    { l: 'Dashboard', ic: 'dashboard', r: '/reception/dashboard', m: ['/reception/dashboard'] },
    { l: 'Patients', ic: 'users', r: '/patients', m: ['/patients'] },
    { l: 'Reception Desk', ic: 'user-plus', r: '/reception/desk', m: ['/reception/desk'] },
    { l: 'Visits', ic: 'clipboard', r: '/visits', m: ['/visits', '/queue'], badge: 'waiting' },
    { sec: 'Account', line: true },
    { l: 'Profile', ic: 'user', r: '/profile', m: [] },
  ],
};
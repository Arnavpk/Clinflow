import type { Db } from '../types';
import { daysAgo, daysAhead, todayISO } from '../utils/format';

/** Mock database — identical records to the HTML prototype, with dates relative to today. */
export function seedDb(): Db {
  const T = todayISO();
  return {
    clinic: {
      name: 'Sunrise Family Clinic',
      doctorName: 'Dr. Aditi Verma',
      address: '24, MG Road, Indiranagar, Bengaluru — 560038',
      phone: '+91 80 4123 8890',
      timings: 'Mon–Sat · 9:00 AM–1:00 PM · 5:00 PM–8:00 PM',
      regNo: 'KA/CLN/2019/4471',
      logo: null,
    },
    staff: [
      { id: 'U-1', name: 'Priya Nair', designation: 'Receptionist', email: 'priya@clinicflow.test', mobile: '9845044501', role: 'reception', status: 'active' },
      { id: 'U-2', name: 'Deepa Menon', designation: 'Front Desk Executive', email: 'deepa@clinicflow.test', mobile: '9900123456', role: 'reception', status: 'active' },
      { id: 'U-3', name: 'Sunita Krishnan', designation: 'Billing Executive', email: 'sunita@clinicflow.test', mobile: '9741889022', role: 'reception', status: 'inactive' },
    ],
    patients: [
      { id: 'PAT001', name: 'Rahul Sharma', age: 24, gender: 'Male', mobile: '9822011234', email: 'rahul.sharma@example.com', bloodGroup: 'B+', registeredOn: daysAgo(120) },
      { id: 'PAT002', name: 'Amit Kumar', age: 34, gender: 'Male', mobile: '9811223344', email: 'amit.k@example.com', bloodGroup: 'O+', registeredOn: daysAgo(95) },
      { id: 'PAT003', name: 'Neha Patel', age: 29, gender: 'Female', mobile: '9870001122', email: 'neha.patel@example.com', bloodGroup: 'A+', registeredOn: daysAgo(88) },
      { id: 'PAT004', name: 'Sana Sheikh', age: 41, gender: 'Female', mobile: '9963345511', email: '', bloodGroup: 'AB+', registeredOn: daysAgo(64) },
      { id: 'PAT005', name: 'Vikram Rao', age: 52, gender: 'Male', mobile: '9845127800', email: 'vikram.rao@example.com', bloodGroup: 'O-', registeredOn: daysAgo(140) },
      { id: 'PAT006', name: 'ABC', age: 24, gender: 'Male', mobile: '1234567890', email: '', bloodGroup: '', registeredOn: daysAgo(30) },
      { id: 'PAT007', name: 'Meera Iyer', age: 6, gender: 'Female', mobile: '9900456712', email: '', bloodGroup: 'A-', registeredOn: daysAgo(22) },
      { id: 'PAT008', name: 'Arjun Malhotra', age: 37, gender: 'Male', mobile: '9739988771', email: 'arjun.m@example.com', bloodGroup: 'B-', registeredOn: daysAgo(18) },
      { id: 'PAT009', name: 'Kavita Joshi', age: 63, gender: 'Female', mobile: '9820447711', email: 'kavita.j@example.com', bloodGroup: 'O+', registeredOn: daysAgo(200) },
      { id: 'PAT010', name: 'Rohan Das', age: 18, gender: 'Male', mobile: '9007788665', email: '', bloodGroup: '', registeredOn: daysAgo(9) },
      { id: 'PAT034', name: 'ABC', age: 58, gender: 'Female', mobile: '1234567890', email: '', bloodGroup: '', registeredOn: daysAgo(4) },
    ],
    visits: [
      { id: 'V-101', token: 'A-001', patientId: 'PAT001', date: T, time: '09:10', status: 'waiting' },
      { id: 'V-102', token: 'A-002', patientId: 'PAT002', date: T, time: '09:25', status: 'in_consultation' },
      { id: 'V-103', token: 'A-003', patientId: 'PAT003', date: T, time: '09:40', status: 'waiting' },
      { id: 'V-104', token: 'A-004', patientId: 'PAT006', date: T, time: '09:55', status: 'waiting' },
      { id: 'V-105', token: 'A-005', patientId: 'PAT009', date: T, time: '10:05', status: 'completed' },
      { id: 'V-106', token: 'A-006', patientId: 'PAT005', date: T, time: '10:20', status: 'completed', prescriptionId: 'RX-101' },
      { id: 'V-107', token: 'A-007', patientId: 'PAT008', date: T, time: '10:35', status: 'cancelled' },
      { id: 'V-087', token: 'B-014', patientId: 'PAT001', date: daysAgo(12), time: '11:05', status: 'completed', prescriptionId: 'RX-090', symptoms: 'Fever, body ache, headache', diagnosis: 'Viral fever' },
      { id: 'V-064', token: 'B-006', patientId: 'PAT001', date: daysAgo(54), time: '12:10', status: 'completed', prescriptionId: 'RX-064', symptoms: 'Sore throat, painful swallowing', diagnosis: 'Acute pharyngitis' },
      { id: 'V-071', token: 'B-009', patientId: 'PAT002', date: daysAgo(30), time: '10:40', status: 'completed', prescriptionId: 'RX-071', symptoms: 'Acidity, bloating after meals', diagnosis: 'Gastritis' },
      { id: 'V-058', token: 'B-021', patientId: 'PAT009', date: daysAgo(20), time: '09:30', status: 'completed', prescriptionId: 'RX-058', symptoms: 'Bilateral knee pain, stiffness', diagnosis: 'Osteoarthritis' },
      { id: 'V-049', token: 'B-011', patientId: 'PAT005', date: daysAgo(45), time: '05:30', status: 'completed', prescriptionId: 'RX-101', symptoms: 'Routine BP follow-up', diagnosis: 'Hypertension — Stage 1' },
      { id: 'V-076', token: 'B-017', patientId: 'PAT003', date: daysAgo(9), time: '06:15', status: 'completed', prescriptionId: 'RX-076', symptoms: 'Itchy skin rash on arms', diagnosis: 'Allergic dermatitis' },
    ],
    prescriptions: [
      {
        id: 'RX-101', visitId: 'V-106', patientId: 'PAT005', date: T, doctor: 'Dr. Aditi Verma',
        medicines: [
          { name: 'Telmisartan', dosage: '40 mg', frequency: '1-0-0', duration: 30, unit: 'Days' },
          { name: 'Amlodipine', dosage: '2.5 mg', frequency: '1-0-1', duration: 30, unit: 'Days' },
        ],
        advice: 'Reduce salt intake. 30 minutes of brisk walk daily. Monitor BP weekly.', followUp: daysAhead(30),
      },
      {
        id: 'RX-090', visitId: 'V-087', patientId: 'PAT001', date: daysAgo(12), doctor: 'Dr. Aditi Verma',
        medicines: [
          { name: 'Paracetamol', dosage: '500 mg', frequency: '1-0-1', duration: 3, unit: 'Days' },
          { name: 'Cetirizine', dosage: '10 mg', frequency: '0-0-1', duration: 5, unit: 'Days' },
        ],
        advice: 'Plenty of fluids. Complete bed rest for 2 days.', followUp: daysAgo(5),
      },
      {
        id: 'RX-064', visitId: 'V-064', patientId: 'PAT001', date: daysAgo(54), doctor: 'Dr. Aditi Verma',
        medicines: [
          { name: 'Azithromycin', dosage: '500 mg', frequency: '1-0-0', duration: 3, unit: 'Days' },
          { name: 'Warm saline gargles', dosage: '—', frequency: 'SOS', duration: 5, unit: 'Days' },
        ],
        advice: 'Avoid cold drinks. Gargle twice daily.', followUp: daysAgo(47),
      },
      {
        id: 'RX-076', visitId: 'V-076', patientId: 'PAT003', date: daysAgo(9), doctor: 'Dr. Aditi Verma',
        medicines: [
          { name: 'Cetirizine', dosage: '10 mg', frequency: '0-0-1', duration: 7, unit: 'Days' },
          { name: 'Calamine lotion', dosage: 'Topical', frequency: 'SOS', duration: 7, unit: 'Days' },
        ],
        advice: 'Avoid harsh soaps and known allergens.', followUp: daysAgo(2),
      },
    ],
    seq: { patient: 35, token: 8, visit: 108, rx: 102, staff: 4 },
  };
}
/** Domain types — same shapes the FastAPI schemas will expose. */
export type Role = 'doctor' | 'reception';

export interface User {
  name: string;
  email: string;
  mobile: string;
  role: Role;
}

export interface Clinic {
  name: string;
  doctorName: string;
  address: string;
  phone: string;
  timings: string;
  regNo: string;
  logo: string | null;
}

export type StaffStatus = 'active' | 'inactive';
export interface Staff {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'reception';
  /** Job title shown next to the name, e.g. Receptionist, Nurse. Access is still the reception role. */
  designation: string;
  status: StaffStatus;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  email: string;
  /** ABO/Rh blood group, e.g. "B+"; empty string when not known. */
  bloodGroup: string;
  registeredOn: string;
}

export type VisitStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
export type VisitType = 'offline' | 'online';
export type Platform3 = 'whatsapp' | 'meet' | 'teams' | '';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Visit {
  id: string;
  token: string;
  patientId: string;
  date: string;
  time: string;
  status: VisitStatus;
  prescriptionId?: string;
  symptoms?: string;
  diagnosis?: string;
  doctor?: string;
  visitType?: VisitType;
  platform?: Platform3;
  meetingLink?: string;
  fee?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  investigations?: string[];
  labStatus?: string;
  messagingContact?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: number | '';
  unit: string;
  mealTiming?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  visitId: string | null;
  patientId: string;
  date: string;
  doctor: string;
  medicines: Medicine[];
  advice: string;
  followUp: string | null;
  symptoms?: string;
  diagnosis?: string;
}

/** A prescription draft shown on the preview sheet (may not be saved yet). */
export interface DraftRx extends Omit<Prescription, 'id' | 'visitId'> {
  id: string | null;
}

export interface Seq {
  patient: number;
  token: number;
  visit: number;
  rx: number;
  staff: number;
}

export interface Db {
  clinic: Clinic;
  staff: Staff[];
  patients: Patient[];
  visits: Visit[];
  prescriptions: Prescription[];
  seq: Seq;
}

/** Medicine row in the consultation editor (V2 controls). */
export interface CfMed {
  name: string;
  dosage: string;
  /** 4-slot pattern Morning-Afternoon-Evening-Night, e.g. "1-0-1-0". */
  frequency: string;
  customMode: boolean;
  customValue: string;
  duration: string;
  unit: string;
  mealTiming: string;
  instructions: string;
}

/** Medicine row in the standalone prescription builder (V1 controls). */
export interface EditMed {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  unit: string;
}

export interface ConsultationDraft {
  visitId: string;
  symptoms: string;
  diagnosis: string;
  meds: CfMed[];
  advice: string;
  followUp: string;
}

export interface BuilderDraft {
  meds: EditMed[];
  advice: string;
  followUp: string;
}

export interface PresetItem {
  name: string;
  enabled: boolean;
}
export interface PrescriptionPrefs {
  suggestions: boolean;
  symptoms: PresetItem[];
  diagnosis: PresetItem[];
}
export type PresetKind = 'symptoms' | 'diagnosis';

export interface BusinessPrefs {
  onlineEnabled: boolean;
  offlinePaymentsEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  messagingNumber: string;
  offlineFee: number;
  onlineFee: number;
  followupFee: number;
  prepay: boolean;
  diagnosticsEnabled: boolean;
  providerName: string;
  providerEmail: string;
  providerWhatsApp: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  msg?: string;
}

export interface VisitOptions {
  visitType: VisitType;
  platform: Platform3;
  meetingLink: string;
}

export type ModalState =
  | { type: 'addPatient' }
  | { type: 'reg'; pid: string }
  | { type: 'visit'; pid?: string | null }
  | { type: 'edit'; pid: string }
  | {
    type: 'confirm';
    tone: 'danger' | 'primary';
    title: string;
    msg: string;
    label?: string;
    onConfirm: () => void;
  }
  | { type: 'staffAdd' }
  | { type: 'staffEdit'; id: string }
  | { type: 'dupDesk'; matches: Patient[]; mobile: string; onView: (id: string) => void; onContinue: () => void }
  | { type: 'visitChoice'; onConfirm: (o: VisitOptions) => void }
  | { type: 'billing'; visitId: string }
  | { type: 'prompt'; title: string; label: string; value: string; onSubmit: (v: string) => void };
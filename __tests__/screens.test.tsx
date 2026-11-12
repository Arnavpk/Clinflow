/**
 * Native smoke test: renders every screen with the React Native renderer, which throws on
 * invalid native trees (e.g. raw text outside <Text>) that a web build would silently accept.
 */
import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppStore';
import { DEMO_USERS } from '../src/data/constants';
import { ModalHost } from '../src/modals/ModalHost';
import { Sidebar } from '../src/layout/Sidebar';
import { Topbar } from '../src/layout/Topbar';
import LoginScreen from '../src/screens/LoginScreen';
import { DoctorDashboard, ReceptionDashboard } from '../src/screens/Dashboards';
import { PatientProfileScreen, PatientsScreen } from '../src/screens/PatientScreens';
import { VisitsScreen } from '../src/screens/VisitsScreen';
import { ConsultationScreen } from '../src/screens/ConsultationScreen';
import { PrescriptionBuilderScreen, PrescriptionViewScreen, PrescriptionsScreen } from '../src/screens/PrescriptionScreens';
import { ReceptionDesk } from '../src/screens/ReceptionDesk';
import {
  BusinessSettings, ClinicSettings, PresetDetail, PrescriptionSettings, ProfileScreen, SettingsHome, StaffScreen, SuggestionSettings,
} from '../src/screens/SettingsScreens';
import { Guard } from '../src/layout/Page';
import type { Role } from '../src/types';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  usePathname: () => '/doctor/dashboard',
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

async function mount(ui: React.ReactNode, role: Role = 'doctor') {
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <AppProvider initialUser={DEMO_USERS[role]}>
        {ui}
        <ModalHost />
      </AppProvider>
    </SafeAreaProvider>,
  );
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const cases: [string, React.ReactNode, string, Role?][] = [
  ['login', <LoginScreen />, 'Sign in to your clinic'],
  ['sidebar+topbar', <><Sidebar /><Topbar /></>, 'Reception Staff'],
  ['doctor dashboard', <DoctorDashboard />, 'Now Serving'],
  ['reception dashboard', <ReceptionDashboard />, 'Reception Overview', 'reception'],
  ['patients', <PatientsScreen />, 'Showing'],
  ['patient profile', <PatientProfileScreen patientId="PAT001" />, 'Visit History'],
  ['patient missing', <PatientProfileScreen patientId="NOPE" />, 'Patient not found'],
  ['visits', <VisitsScreen />, 'Historical visits across all patients · ', ],
  ['consultation', <ConsultationScreen visitId="V-102" />, 'Consultation Notes'],
  ['consultation completed', <ConsultationScreen visitId="V-106" />, 'This visit is already completed'],
  ['consultation missing', <ConsultationScreen visitId="V-999" />, 'Unable to load consultation'],
  ['prescriptions', <PrescriptionsScreen />, 'RX-101'],
  ['builder', <PrescriptionBuilderScreen patientId="PAT001" fromRx="RX-090" />, 'Prefilled from RX-090'],
  ['builder missing patient', <PrescriptionBuilderScreen />, 'Patient not found'],
  ['rx view', <PrescriptionViewScreen rxId="RX-101" />, 'Telmisartan'],
  ['rx missing', <PrescriptionViewScreen rxId="RX-000" />, 'Prescription not found'],
  ['desk', <ReceptionDesk initialQ="rahul" />, 'Rahul Sharma', 'reception'],
  ['settings', <SettingsHome />, 'Open Clinic Settings'],
  ['clinic', <ClinicSettings />, 'Clinic Logo'],
  ['rx settings', <PrescriptionSettings />, 'Suggestion Templates'],
  ['suggestions', <SuggestionSettings />, 'Enable prescription suggestions'],
  ['diagnosis presets', <PresetDetail kind="diagnosis" />, 'Typhoid fever'],
  ['symptom presets', <PresetDetail kind="symptoms" />, 'Blood in vomit'],
  ['business', <BusinessSettings />, 'Diagnostics provider'],
  ['staff', <StaffScreen />, 'Sunita Krishnan'],
  ['profile', <ProfileScreen />, 'Change Password'],
  ['restricted', <Guard roles={['doctor']}><SettingsHome /></Guard>, 'Access restricted', 'reception'],
];

describe.each(cases)('%s', (_name, ui, text, role) => {
  it('renders natively', async () => {
    await mount(ui, role);
    expect(screen.getAllByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).length).toBeGreaterThan(0);
  });
});

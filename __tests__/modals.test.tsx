import { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useStore } from '../src/store/AppStore';
import { DEMO_USERS } from '../src/data/constants';
import { ModalHost } from '../src/modals/ModalHost';
import { ConsultationScreen } from '../src/screens/ConsultationScreen';
import type { ModalState } from '../src/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() }, usePathname: () => '/x', useLocalSearchParams: () => ({}), Redirect: () => null }));

function Open({ m }: { m: ModalState }) {
  const { openModal } = useStore();
  useEffect(() => openModal(m), [m, openModal]);
  return null;
}
async function mount(node: React.ReactNode) {
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <AppProvider initialUser={DEMO_USERS.doctor}>
        {node}
        <ModalHost />
      </AppProvider>
    </SafeAreaProvider>,
  );
}
const noop = () => {};
const cases: [string, ModalState, string][] = [
  ['add patient', { type: 'addPatient' }, 'Register New Patient'],
  ['registered', { type: 'reg', pid: 'PAT001' }, 'Patient Registered Successfully'],
  ['visit search', { type: 'visit' }, 'Rahul Sharma'],
  ['visit for patient', { type: 'visit', pid: 'PAT001' }, 'Payment · Offline consultation'],
  ['edit', { type: 'edit', pid: 'PAT002' }, 'Edit Patient'],
  ['confirm', { type: 'confirm', tone: 'danger', title: 'Sure?', msg: 'm', onConfirm: noop }, 'Sure?'],
  ['staff add', { type: 'staffAdd' }, 'Add Reception Staff'],
  ['staff edit', { type: 'staffEdit', id: 'U-1' }, 'Edit Staff'],
  ['dup desk', { type: 'dupDesk', matches: [], mobile: '1234567890', onView: noop, onContinue: noop }, 'Possible Existing Patient'],
  ['visit choice', { type: 'visitChoice', onConfirm: noop }, 'Choose visit type'],
  ['billing', { type: 'billing', visitId: 'V-101' }, 'Diagnostic request'],
  ['prompt', { type: 'prompt', title: 'Rename preset', label: 'Rename preset:', value: 'x', onSubmit: noop }, 'Rename preset:'],
];
describe.each(cases)('%s modal', (_n, m, text) => {
  it('renders natively', async () => {
    await mount(<Open m={m} />);
    expect(await screen.findByText(text)).toBeTruthy();
  });
});

it('consultation editor with medicines, custom schedule and suggestions renders natively', async () => {
  jest.useFakeTimers();
  await mount(<ConsultationScreen visitId="V-102" />);
  await fireEvent.changeText(screen.getByTestId('cf-med-search'), 'para');
  expect(await screen.findByText('Paracetamol 500 mg')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('cf-opt-0'));
  await fireEvent.press(screen.getByTestId('cf-custom-0'));
  await fireEvent.press(screen.getByTestId('cf-freq-0-0'));
  await fireEvent(screen.getByTestId('cf-quick-symptoms'), 'focus');
  expect(screen.getByText('Custom Schedule')).toBeTruthy();
  expect(screen.getByTestId('cf-chip-symptoms-Fever')).toBeTruthy();
  await act(async () => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

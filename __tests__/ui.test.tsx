import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppStore';
import { DEMO_USERS } from '../src/data/constants';
import { QueueTable } from '../src/components/domain';
import { ModalHost } from '../src/modals/ModalHost';
import { seedDb } from '../src/data/seed';
import { todaysVisits } from '../src/services/selectors';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() }, usePathname: () => '/doctor/dashboard', Redirect: () => null }));

const wrap = async (ui: React.ReactNode) =>
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <AppProvider initialUser={DEMO_USERS.doctor}>
        {ui}
        <ModalHost />
      </AppProvider>
    </SafeAreaProvider>,
  );

describe('queue table (native render)', () => {
  it('renders today’s visits with role actions and opens the cancel confirmation', async () => {
    await wrap(<QueueTable visits={todaysVisits(seedDb())} role="doctor" from="/doctor/dashboard" />);
    expect(await screen.findByText('Rahul Sharma')).toBeTruthy();
    expect(screen.getByTestId('q-start-V-101')).toBeTruthy();
    expect(screen.getByTestId('q-complete-V-102')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('q-bill-V-101'));
    expect(await screen.findByText('Visit billing & investigations')).toBeTruthy();
  });
});

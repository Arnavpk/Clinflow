
import { Guard } from '../layout/Page';
import { ProfileScreen } from '../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor', 'reception']}>
      <ProfileScreen />
    </Guard>
  );
}


import { Guard } from '../../layout/Page';
import { StaffScreen } from '../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <StaffScreen />
    </Guard>
  );
}

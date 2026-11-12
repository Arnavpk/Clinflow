
import { Guard } from '../../layout/Page';
import { SettingsHome } from '../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <SettingsHome />
    </Guard>
  );
}

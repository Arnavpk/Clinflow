
import { Guard } from '../../layout/Page';
import { BusinessSettings } from '../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <BusinessSettings />
    </Guard>
  );
}

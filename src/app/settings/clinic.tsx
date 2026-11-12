
import { Guard } from '../../layout/Page';
import { ClinicSettings } from '../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <ClinicSettings />
    </Guard>
  );
}

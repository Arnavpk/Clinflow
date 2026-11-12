
import { Guard } from '../../../layout/Page';
import { PrescriptionSettings } from '../../../screens/SettingsScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <PrescriptionSettings />
    </Guard>
  );
}

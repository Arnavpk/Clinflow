
import { Guard } from '../../layout/Page';
import { PrescriptionsScreen } from '../../screens/PrescriptionScreens';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <PrescriptionsScreen />
    </Guard>
  );
}

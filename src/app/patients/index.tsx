
import { Guard } from '../../layout/Page';
import { PatientsScreen } from '../../screens/PatientScreens';

export default function Route() {

  return (
    <Guard roles={['doctor', 'reception']}>
      <PatientsScreen />
    </Guard>
  );
}

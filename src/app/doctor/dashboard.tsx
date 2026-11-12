
import { Guard } from '../../layout/Page';
import { DoctorDashboard } from '../../screens/Dashboards';

export default function Route() {

  return (
    <Guard roles={['doctor']}>
      <DoctorDashboard />
    </Guard>
  );
}

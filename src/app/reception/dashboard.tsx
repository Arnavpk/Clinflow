
import { Guard } from '../../layout/Page';
import { ReceptionDashboard } from '../../screens/Dashboards';

export default function Route() {

  return (
    <Guard roles={['reception']}>
      <ReceptionDashboard />
    </Guard>
  );
}

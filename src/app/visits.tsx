
import { Guard } from '../layout/Page';
import { VisitsScreen } from '../screens/VisitsScreen';

export default function Route() {

  return (
    <Guard roles={['doctor', 'reception']}>
      <VisitsScreen />
    </Guard>
  );
}

import { useLocalSearchParams } from 'expo-router';
import { Guard } from '../../layout/Page';
import { PrescriptionViewScreen } from '../../screens/PrescriptionScreens';

export default function Route() {
  const { rxId, from } = useLocalSearchParams<{ rxId: string; from?: string }>();
  return (
    <Guard roles={['doctor', 'reception']}>
      <PrescriptionViewScreen key={rxId} rxId={rxId} from={from} />
    </Guard>
  );
}

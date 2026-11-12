import { useLocalSearchParams } from 'expo-router';
import { Guard } from '../../layout/Page';
import { ConsultationScreen } from '../../screens/ConsultationScreen';

export default function Route() {
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  return (
    <Guard roles={['doctor']}>
      <ConsultationScreen key={visitId} visitId={visitId} />
    </Guard>
  );
}

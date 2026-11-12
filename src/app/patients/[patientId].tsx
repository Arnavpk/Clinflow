import { useLocalSearchParams } from 'expo-router';
import { Guard } from '../../layout/Page';
import { PatientProfileScreen } from '../../screens/PatientScreens';

export default function Route() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  return (
    <Guard roles={['doctor', 'reception']}>
      <PatientProfileScreen key={patientId} patientId={patientId} />
    </Guard>
  );
}

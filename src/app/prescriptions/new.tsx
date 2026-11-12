import { useLocalSearchParams } from 'expo-router';
import { Guard } from '../../layout/Page';
import { PrescriptionBuilderScreen } from '../../screens/PrescriptionScreens';

export default function Route() {
  const { patient, from } = useLocalSearchParams<{ patient?: string; from?: string }>();
  return (
    <Guard roles={['doctor']}>
      <PrescriptionBuilderScreen key={(patient || '') + (from || '')} patientId={patient} fromRx={from} />
    </Guard>
  );
}

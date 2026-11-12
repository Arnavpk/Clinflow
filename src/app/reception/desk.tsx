import { useLocalSearchParams } from 'expo-router';
import { Guard } from '../../layout/Page';
import { ReceptionDesk } from '../../screens/ReceptionDesk';

export default function Route() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return (
    <Guard roles={['reception']}>
      <ReceptionDesk initialQ={q} />
    </Guard>
  );
}

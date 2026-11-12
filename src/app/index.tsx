import { Redirect } from 'expo-router';
import { useStore } from '../store/AppStore';
import { ROLE_META } from '../data/constants';

export default function Index() {
  const { ready, user } = useStore();
  if (!ready) return null;
  return <Redirect href={(user ? ROLE_META[user.role].dash : '/login') as never} />;
}

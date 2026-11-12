import { Redirect } from 'expo-router';
import { useStore } from '../store/AppStore';
import { ROLE_META } from '../data/constants';

/** Unknown routes redirect to the role dashboard (or login), like the prototype's router fallback. */
export default function NotFound() {
  const { ready, user } = useStore();
  if (!ready) return null;
  return <Redirect href={(user ? ROLE_META[user.role].dash : '/login') as never} />;
}

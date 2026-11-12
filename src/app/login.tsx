import { Redirect } from 'expo-router';
import { useStore } from '../store/AppStore';
import { ROLE_META } from '../data/constants';
import LoginScreen from '../screens/LoginScreen';

export default function Login() {
  const { ready, user } = useStore();
  if (!ready) return null;
  if (user) return <Redirect href={ROLE_META[user.role].dash as never} />;
  return <LoginScreen />;
}

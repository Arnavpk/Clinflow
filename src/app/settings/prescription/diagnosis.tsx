import { Redirect } from 'expo-router';

/** Old separate presets route — symptoms and diagnosis are now managed together. */
export default function Route() {
  return <Redirect href="/settings/prescription/presets" />;
}
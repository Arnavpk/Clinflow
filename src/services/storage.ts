import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage keys kept identical to the web prototype's localStorage/sessionStorage keys. */
export const KEYS = {
  user: 'cf_user',
  prefs: 'trisetuprefs_v1',
  business: 'trisetubusiness_v1',
  draft: 'trisetudraft_v2',
} as const;

export async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    if (value == null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage is best-effort, exactly like the try/catch around localStorage in the prototype */
  }
}

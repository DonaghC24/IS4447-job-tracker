import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'auth_user_id';

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password
  );
}

export function generateSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveSession(userId: number): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, String(userId));
}

export async function loadSession(): Promise<number | null> {
  const val = await SecureStore.getItemAsync(SESSION_KEY);
  if (!val) return null;
  const id = parseInt(val, 10);
  return isNaN(id) ? null : id;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

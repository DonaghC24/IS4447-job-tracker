// auth utilities - handles password hashing and session persistence
// passwords are hashed using sha256 with a unique salt for each user
// the session (user id) is stored in expo secure store, not async storage, for security

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'auth_user_id';

// hash a password by combining the salt and password then running sha256
export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password
  );
}

// generate a random 16-byte salt and convert it to a hex string
export function generateSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// persist the logged-in user's id in secure store
export async function saveSession(userId: number): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, String(userId));
}

// retrieve the saved user id from secure store, returns null if not found
export async function loadSession(): Promise<number | null> {
  const val = await SecureStore.getItemAsync(SESSION_KEY);
  if (!val) return null;
  const id = parseInt(val, 10);
  return isNaN(id) ? null : id;
}

// remove the session from secure store on logout
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
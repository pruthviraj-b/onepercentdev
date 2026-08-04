import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawApiKey !== "dummy_api_key" &&
  !rawApiKey.startsWith("dummy_")
);

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyKeyForDevelopmentOnly000",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function getAccessToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try { return await auth.currentUser.getIdToken(); } catch { return null; }
}

export async function getAuthorizationHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // Keep the legacy header during the migration window.
  headers['X-User-Id'] = auth.currentUser?.uid || 'local';
  return headers;
}

// Only attempt persistence if valid Firebase credentials are provided
// Guard with typeof window to avoid crashing during Next.js SSR
if (isFirebaseConfigured && typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

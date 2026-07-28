'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { syncUserProfile, markOffline } from '@/lib/studentAnalyticsApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signingIn: false,
  authError: null,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const popupInFlightRef = useRef(false);
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const saved = localStorage.getItem('opd_local_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          syncUserProfile(
            parsed.uid,
            parsed.displayName || '',
            parsed.email || '',
            parsed.photoURL || '',
          );
        }
      } catch {}
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);

          if (currentUser && syncedRef.current !== currentUser.uid) {
            syncedRef.current = currentUser.uid;
            sessionStorage.setItem('session_start', new Date().toISOString());
            syncUserProfile(
              currentUser.uid,
              currentUser.displayName || '',
              currentUser.email || '',
              currentUser.photoURL || '',
            );
          }

          if (!currentUser) {
            syncedRef.current = null;
            markOffline();
          }
        },
        (err) => {
          console.warn('Firebase auth listener skipped:', err?.message);
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }

    const handleUnload = () => markOffline();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      // Local dev mode fallback: Instant guest login
      const localStudent = {
        uid: 'local_dev_student',
        displayName: '1% Developer Student',
        email: 'student@onepercentdev.local',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Developer',
      } as unknown as User;

      setUser(localStudent);
      try { localStorage.setItem('opd_local_user', JSON.stringify(localStudent)); } catch {}
      syncUserProfile(
        localStudent.uid,
        localStudent.displayName || '',
        localStudent.email || '',
        localStudent.photoURL || '',
      );
      setAuthError(null);
      return;
    }
    if (popupInFlightRef.current) return;
    popupInFlightRef.current = true;
    setSigningIn(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in was cancelled. Try once more when ready.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('Firebase blocked sign-in because this site is not authorized. Add your localhost and deployment domains in Firebase Auth settings.');
      } else if (code === 'auth/invalid-api-key' || code === 'auth/invalid-app-id') {
        setAuthError('Firebase configuration is invalid. Verify your NEXT_PUBLIC_FIREBASE_* values.');
      } else {
        setAuthError(`Could not sign in with Google. (${code}) ${error?.message || 'Check your Firebase setup.'}`);
        console.error('Login Failed:', error);
      }
    } finally {
      popupInFlightRef.current = false;
      setSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await markOffline();
      try { localStorage.removeItem('opd_local_user'); } catch {}
      setUser(null);
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout Failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, authError, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

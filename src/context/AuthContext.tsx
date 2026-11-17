import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { fetchMyProfile, updateMyProfile } from '../lib/api';
import type { MemberProfile } from '../types/run';

interface AuthContextValue {
  firebaseUser: User | null;
  member: MemberProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  saveProfile: (updates: {
    displayName?: string;
    preferredPace?: string;
  }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const profile = await fetchMyProfile(token);
          setMember(profile);
          setAuthError(null);
        } catch (error) {
          console.error('Failed to sync member profile:', error);
          setMember(null);
        }
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const token = await credential.user.getIdToken();
      const profile = await fetchMyProfile(token);
      setMember(profile);
      return credential.user;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Google sign-in was cancelled or failed.';
      setAuthError(message);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
    setMember(null);
  }, []);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) {
      return null;
    }
    return auth.currentUser.getIdToken();
  }, []);

  const saveProfile = useCallback(
    async (updates: { displayName?: string; preferredPace?: string }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Please sign in to update your profile.');
      }
      const updated = await updateMyProfile(updates, token);
      setMember(updated);
    },
    [getToken],
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        member,
        loading,
        authError,
        signInWithGoogle,
        signOut,
        getToken,
        saveProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

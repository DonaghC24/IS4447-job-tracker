// auth context - provides the current user and auth actions to the entire app
// on mount it checks async storage for a saved session and restores it if found
// any screen can call useauth() to get the user or trigger logout

import { getUserById } from '@/db/queries';
import { User } from '@/db/schema';
import { clearSession, loadSession } from '@/lib/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // restore the session from async storage when the app first loads
  useEffect(() => {
    loadSession().then((id) => {
      if (id !== null) {
        // look up the user by their saved id in sqlite
        const found = getUserById(id);
        setUser(found ?? null);
      }
      setLoading(false);
    });
  }, []);

  // clear the session from storage and reset the user state
  async function logout() {
    await clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// hook to access auth context - throws if used outside the provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
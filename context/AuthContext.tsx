import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/db/schema';
import { getUserById } from '@/db/queries';
import { loadSession, clearSession } from '@/lib/auth';

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

  useEffect(() => {
    loadSession().then((id) => {
      if (id !== null) {
        const found = getUserById(id);
        setUser(found ?? null);
      }
      setLoading(false);
    });
  }, []);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, User } from './api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('voyage_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem('voyage_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user: loggedInUser } = await api.login(email, password);
    localStorage.setItem('voyage_token', token);
    setUser(loggedInUser);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const { token, user: newUser } = await api.register(email, password, fullName);
    localStorage.setItem('voyage_token', token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('voyage_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

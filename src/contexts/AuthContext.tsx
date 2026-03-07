import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, setToken, getToken, type ApiUser } from '@/lib/api';

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authTab: 'login' | 'signup';
  setAuthTab: (tab: 'login' | 'signup') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi.me()
        .then(res => setUser(res.user))
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      setUser(res.user);
      setShowAuthModal(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    try {
      const res = await authApi.register(username, email, password);
      setToken(res.token);
      setUser(res.user);
      setShowAuthModal(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, showAuthModal, setShowAuthModal, authTab, setAuthTab }}>
      {children}
    </AuthContext.Provider>
  );
};

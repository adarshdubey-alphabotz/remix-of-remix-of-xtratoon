import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, DUMMY_CREDENTIALS, publishers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (username: string, email: string, password: string, role: 'reader' | 'publisher') => { success: boolean; error?: string };
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
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const login = useCallback((email: string, password: string) => {
    if (email === DUMMY_CREDENTIALS.admin.email && password === DUMMY_CREDENTIALS.admin.password) {
      setUser({ id: 'admin-1', username: 'Admin', email, role: 'admin', library: [] });
      setShowAuthModal(false);
      return { success: true };
    }
    if (email === DUMMY_CREDENTIALS.publisher.email && password === DUMMY_CREDENTIALS.publisher.password) {
      const pub = publishers.find(p => p.email === email);
      setUser({ id: 'pub-1', username: pub?.username || 'Publisher', email, role: 'publisher', library: [] });
      setShowAuthModal(false);
      return { success: true };
    }
    if (email === DUMMY_CREDENTIALS.reader.email && password === DUMMY_CREDENTIALS.reader.password) {
      setUser({ id: 'reader-1', username: 'MangaFan', email, role: 'reader', library: ['solo-ascension', 'moonlit-garden', 'void-walker'] });
      setShowAuthModal(false);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const signup = useCallback((username: string, email: string, _password: string, role: 'reader' | 'publisher') => {
    setUser({ id: 'new-user', username, email, role, library: [] });
    setShowAuthModal(false);
    return { success: true };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, showAuthModal, setShowAuthModal, authTab, setAuthTab }}>
      {children}
    </AuthContext.Provider>
  );
};

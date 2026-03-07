import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role_type: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authTab: 'login' | 'signup';
  setAuthTab: (tab: 'login' | 'signup') => void;
  isAdmin: boolean;
  isPublisher: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!error && data) setProfile(data as Profile);
  }, []);

  const checkRole = useCallback(async (userId: string, role: string) => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: role as any });
    return !!data;
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
    const admin = await checkRole(user.id, 'admin');
    const publisher = await checkRole(user.id, 'publisher');
    setIsAdmin(admin);
    setIsPublisher(publisher);
  }, [user, fetchProfile, checkRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
        const admin = await checkRole(u.id, 'admin');
        const publisher = await checkRole(u.id, 'publisher');
        setIsAdmin(admin);
        setIsPublisher(publisher);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsPublisher(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfile(u.id);
        const admin = await checkRole(u.id, 'admin');
        const publisher = await checkRole(u.id, 'publisher');
        setIsAdmin(admin);
        setIsPublisher(publisher);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, checkRole]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      setShowAuthModal(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const signup = useCallback(async (displayName: string, email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return { success: false, error: error.message };
      setShowAuthModal(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsPublisher(false);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    if (error) return { success: false, error: error.message };
    await fetchProfile(user.id);
    return { success: true };
  }, [user, fetchProfile]);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, login, signup, logout,
      updateProfile, changePassword, refreshProfile,
      showAuthModal, setShowAuthModal, authTab, setAuthTab,
      isAdmin, isPublisher,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

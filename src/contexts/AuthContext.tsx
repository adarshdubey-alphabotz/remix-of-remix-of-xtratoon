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
  signup: (data: {
    displayName: string;
    email: string;
    password: string;
    roleType: string;
    username?: string;
  }) => Promise<{ success: boolean; error?: string }>;
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

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const normalizeRoleType = (roleType: string) => {
  const role = roleType.trim().toLowerCase();
  return role === 'creator' || role === 'publisher' ? 'publisher' : 'reader';
};

const normalizeUsername = (username?: string) => {
  const normalized = username?.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  return normalized || null;
};

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;

    const nextProfile = (data as Profile | null) ?? null;
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const checkRole = useCallback(async (userId: string, role: 'admin' | 'publisher') => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: role as any });
    return !!data;
  }, []);

  const syncRoleFlags = useCallback(
    async (userId: string, profileData?: Profile | null) => {
      const [admin, publisher] = await Promise.all([
        checkRole(userId, 'admin'),
        checkRole(userId, 'publisher'),
      ]);

      const publisherFromProfile =
        profileData?.role_type === 'publisher' || profileData?.role_type === 'creator';

      setIsAdmin(admin);
      setIsPublisher(publisher || publisherFromProfile);
    },
    [checkRole],
  );

  const hydrateUserState = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setIsAdmin(false);
        setIsPublisher(false);
        setLoading(false);
        return;
      }

      const nextProfile = await fetchProfile(nextUser.id);
      await syncRoleFlags(nextUser.id, nextProfile);
      setLoading(false);
    },
    [fetchProfile, syncRoleFlags],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const nextProfile = await fetchProfile(user.id);
    await syncRoleFlags(user.id, nextProfile);
  }, [fetchProfile, syncRoleFlags, user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUserState(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void hydrateUserState(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [hydrateUserState]);

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

  const signup = useCallback(
    async ({ displayName, email, password, roleType, username }: {
      displayName: string;
      email: string;
      password: string;
      roleType: string;
      username?: string;
    }) => {
      try {
        const normalizedRole = normalizeRoleType(roleType);
        const normalizedUsername = normalizeUsername(username);

        if (normalizedRole === 'publisher' && !normalizedUsername) {
          return { success: false, error: 'Username is required for creators' };
        }

        if (normalizedUsername) {
          if (normalizedUsername.length < 5) {
            return { success: false, error: 'Username must be at least 5 characters' };
          }
          if (!USERNAME_REGEX.test(normalizedUsername)) {
            return { success: false, error: 'Username can only contain letters, numbers, _ and .' };
          }

          const { data: existing, error: usernameError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', normalizedUsername)
            .limit(1);

          if (usernameError) {
            return { success: false, error: usernameError.message };
          }

          if (existing && existing.length > 0) {
            return { success: false, error: 'Username already taken' };
          }
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              role_type: normalizedRole,
              username: normalizedUsername,
            },
          },
        });

        if (error) return { success: false, error: error.message };

        const userId = signUpData.user?.id;
        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              {
                user_id: userId,
                display_name: displayName || null,
                role_type: normalizedRole,
                username: normalizedUsername,
              },
              { onConflict: 'user_id' },
            );

          if (profileError) {
            if (profileError.code === '23505') {
              return { success: false, error: 'Username already taken' };
            }
            return { success: false, error: profileError.message };
          }

          const roleValue = normalizedRole === 'publisher' ? 'publisher' : 'reader';
          const oppositeRole = roleValue === 'publisher' ? 'reader' : 'publisher';

          const { error: roleInsertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: roleValue as any });

          if (roleInsertError && roleInsertError.code !== '23505') {
            return { success: false, error: roleInsertError.message };
          }

          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role', oppositeRole as any);

          const nextProfile = await fetchProfile(userId);
          await syncRoleFlags(userId, nextProfile);
        }

        setShowAuthModal(false);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [fetchProfile, syncRoleFlags],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsPublisher(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user) return { success: false, error: 'Not logged in' };

      const normalizedUsername = normalizeUsername(data.username ?? undefined);
      if (normalizedUsername) {
        if (normalizedUsername.length < 5) {
          return { success: false, error: 'Username must be at least 5 characters' };
        }
        if (!USERNAME_REGEX.test(normalizedUsername)) {
          return { success: false, error: 'Username can only contain letters, numbers, _ and .' };
        }
      }

      const updates: Partial<Profile> = {
        ...data,
        username: normalizedUsername,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Username already taken' };
        }
        return { success: false, error: error.message };
      }

      await refreshProfile();
      return { success: true };
    },
    [refreshProfile, user],
  );

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      signup,
      logout,
      updateProfile,
      changePassword,
      refreshProfile,
      showAuthModal,
      setShowAuthModal,
      authTab,
      setAuthTab,
      isAdmin,
      isPublisher,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

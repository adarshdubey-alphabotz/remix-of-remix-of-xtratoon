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
  is_banned: boolean;
  banned_reason: string | null;
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
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authTab: 'login' | 'signup';
  setAuthTab: (tab: 'login' | 'signup') => void;
  isAdmin: boolean;
  isPublisher: boolean;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

const USERNAME_REGEX = /^[a-z0-9_.]+$/;

const normalizeRoleType = (roleType?: string) => {
  const role = roleType?.trim().toLowerCase();
  return role === 'creator' || role === 'publisher' ? 'publisher' : 'reader';
};

const normalizeUsername = (username?: string | null) => {
  const normalized = username?.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  return normalized || null;
};

const isPublisherRole = (roleType?: string | null) => roleType === 'publisher' || roleType === 'creator';

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
  const [adminMode, setAdminMode] = useState(() => {
    try { return localStorage.getItem('xtratoon-admin-mode') === 'true'; } catch { return true; }
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { profile: null as Profile | null, error: error.message };

    const nextProfile = (data as Profile | null) ?? null;
    setProfile(nextProfile);
    return { profile: nextProfile, error: null as string | null };
  }, []);

  const syncReaderPublisherRole = useCallback(async (userId: string, roleType: string) => {
    const desiredRole = isPublisherRole(roleType) ? 'publisher' : 'reader';
    const oppositeRole = desiredRole === 'publisher' ? 'reader' : 'publisher';

    const { error: roleInsertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: desiredRole as any });

    if (roleInsertError && roleInsertError.code !== '23505') {
      return roleInsertError.message;
    }

    const { error: roleDeleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', oppositeRole as any);

    if (roleDeleteError) return roleDeleteError.message;

    return null;
  }, []);

  const ensureProfile = useCallback(
    async (authUser: User) => {
      const metadata = authUser.user_metadata || {};
      const desiredRole = normalizeRoleType(metadata.role_type);
      const desiredDisplayName =
        typeof metadata.display_name === 'string' && metadata.display_name.trim().length > 0
          ? metadata.display_name.trim()
          : authUser.email ?? null;
      const desiredUsername = normalizeUsername(typeof metadata.username === 'string' ? metadata.username : null);

      if (desiredUsername && (desiredUsername.length < 5 || !USERNAME_REGEX.test(desiredUsername))) {
        return { profile: null as Profile | null, error: 'Username must be at least 5 characters and use only letters, numbers, _ and .' };
      }

      const { profile: existingProfile, error: fetchError } = await fetchProfile(authUser.id);
      if (fetchError) return { profile: null as Profile | null, error: fetchError };

      let nextProfile = existingProfile;

      if (!existingProfile) {
        const { data: createdProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            display_name: desiredDisplayName,
            role_type: desiredRole,
            username: desiredUsername,
          })
          .select('*')
          .single();

        if (insertError) {
          if (insertError.code === '23505') return { profile: null as Profile | null, error: 'Username already taken' };
          return { profile: null as Profile | null, error: insertError.message };
        }

        nextProfile = createdProfile as Profile;
        setProfile(nextProfile);
      } else {
        const updates: Partial<Profile> = {};

        if (!existingProfile.display_name && desiredDisplayName) {
          updates.display_name = desiredDisplayName;
        }

        if (!existingProfile.username && desiredUsername) {
          updates.username = desiredUsername;
        }

        if (!isPublisherRole(existingProfile.role_type) && isPublisherRole(desiredRole)) {
          updates.role_type = 'publisher';
        }

        if (Object.keys(updates).length > 0) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', authUser.id)
            .select('*')
            .single();

          if (updateError) {
            if (updateError.code === '23505') return { profile: null as Profile | null, error: 'Username already taken' };
            return { profile: null as Profile | null, error: updateError.message };
          }

          nextProfile = updatedProfile as Profile;
          setProfile(nextProfile);
        }
      }

      if (nextProfile) {
        const roleSyncError = await syncReaderPublisherRole(authUser.id, nextProfile.role_type);
        if (roleSyncError) return { profile: nextProfile, error: roleSyncError };
      }

      return { profile: nextProfile, error: null as string | null };
    },
    [fetchProfile, syncReaderPublisherRole],
  );

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

      const publisherFromProfile = isPublisherRole(profileData?.role_type);

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

      const { profile: ensuredProfile } = await ensureProfile(nextUser);
      await syncRoleFlags(nextUser.id, ensuredProfile);
      setLoading(false);
    },
    [ensureProfile, syncRoleFlags],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { profile: nextProfile } = await fetchProfile(user.id);
    await syncRoleFlags(user.id, nextProfile);
  }, [fetchProfile, syncRoleFlags, user]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    async ({
      displayName,
      email,
      password,
      roleType,
      username,
    }: {
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

        if (signUpData.user && signUpData.session) {
          const ensured = await ensureProfile(signUpData.user);
          if (ensured.error) {
            return { success: false, error: ensured.error };
          }
        }

        setShowAuthModal(false);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [ensureProfile],
  );

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsPublisher(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) return { success: false, error: error.message };

      await logout();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete account' };
    }
  }, [logout]);

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user) return { success: false, error: 'Not logged in' };

      const updates: Partial<Profile> = { ...data };

      if (Object.prototype.hasOwnProperty.call(data, 'username')) {
        const normalizedUsername = normalizeUsername(data.username ?? undefined);
        if (normalizedUsername) {
          if (normalizedUsername.length < 5) {
            return { success: false, error: 'Username must be at least 5 characters' };
          }
          if (!USERNAME_REGEX.test(normalizedUsername)) {
            return { success: false, error: 'Username can only contain letters, numbers, _ and .' };
          }
        }
        updates.username = normalizedUsername;
      }

      if (Object.prototype.hasOwnProperty.call(data, 'role_type') && data.role_type) {
        updates.role_type = normalizeRoleType(data.role_type);
      }

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

      if (updates.role_type) {
        const roleSyncError = await syncReaderPublisherRole(user.id, updates.role_type);
        if (roleSyncError) {
          return { success: false, error: roleSyncError };
        }
      }

      await refreshProfile();
      return { success: true };
    },
    [refreshProfile, syncReaderPublisherRole, user],
  );

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        deleteAccount,
        updateProfile,
        changePassword,
        refreshProfile,
        showAuthModal,
        setShowAuthModal,
        authTab,
        setAuthTab,
        isAdmin,
        isPublisher,
        adminMode: isAdmin ? adminMode : false,
        setAdminMode: (mode: boolean) => {
          setAdminMode(mode);
          try { localStorage.setItem('xtratoon-admin-mode', String(mode)); } catch {}
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

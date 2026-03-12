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

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com','temp-mail.org','tempmail.net','temp-mail.io',
  'mailinator.com','mailinator.net','mailinator2.com',
  '10minutemail.com','10minmail.com','10mail.org',
  'guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrilla.ml','grr.la',
  'throwaway.email','throwawaymail.com','trashmail.com','trashmail.net','trashmail.me',
  'yopmail.com','yopmail.fr','yopmail.net',
  'dispostable.com','maildrop.cc','mailnesia.com','sharklasers.com',
  'guerrillamailblock.com','pokemail.net','spam4.me','bccto.me',
  'discard.email','discardmail.com','discardmail.de',
  'emailondeck.com','getnada.com','getairmail.com',
  'fakeinbox.com','mailcatch.com','mailexpire.com','mailmoat.com',
  'minutemail.com','mytemp.email','mt2015.com',
  'mohmal.com','mailnull.com','mailsac.com',
  'safetymail.info','spamgourmet.com','tempr.email',
  'tmail.ws','tmpmail.net','tmpmail.org',
  'wegwerfmail.de','wegwerfmail.net','einrot.com',
  'crazymailing.com','armyspy.com','dayrep.com',
  'fleckens.hu','gustr.com','jourrapide.com',
  'rhyta.com','superrito.com','teleworm.us',
  'mailforspam.com','spam.la','spamfree24.org',
  'objectmail.com','protonmail.ch',
  'anonbox.net','anonymbox.com',
  'bugmenot.com','deadaddress.com',
  'filzmail.com','haltospam.com','harakirimail.com',
  'incognitomail.org','inboxalias.com',
  'jetable.org','kasmail.com','koszmail.pl',
  'kurzepost.de','lifebyfood.com','lookugly.com',
  'mailblocks.com','mailhazard.com','mailimate.com',
  'mailmetrash.com','mailscrap.com','mailshell.com',
  'mailzilla.com','mezimages.net','mfsa.info',
  'mycleaninbox.net','nobulk.com','noclickemail.com',
  'nogmailspam.info','nomail.xl.cx','nomail2me.com',
  'nospam.ze.tc','owlpic.com','pookmail.com',
  'proxymail.eu','rcpt.at','reallymymail.com',
  'recode.me','regbypass.com','s0ny.net',
  'safersignup.de','safetypost.de','shieldedmail.com',
  'sogetthis.com','sofort-mail.de','spambob.com',
  'spambog.com','spambox.us','spamcero.com',
  'spamday.com','spamex.com','spamfighter.cf',
  'spamfighter.ga','spamfighter.gq','spamfighter.ml',
  'spamfighter.tk','spamhole.com','spaml.com',
  'spamoff.de','spamstack.net','spamthis.co.uk',
  'speedgaus.net','suremail.info','tempemail.co.za',
  'tempemail.net','tempinbox.com','tempmail.eu',
  'tempomail.fr','thankyou2010.com','thisisnotmyrealemail.com',
  'trash-mail.at','trash-mail.com','trash2009.com',
  'trashdevil.com','trashemail.de','trashymail.com',
  'trashymail.net','twinmail.de','tyldd.com',
  'uggsrock.com','upliftnow.com','uplipht.com',
  'venompen.com','veryrealliemail.com','viditag.com',
  'viewcastmedia.com','viewcastmedia.net','viewcastmedia.org',
  'vomoto.com','vpn.st','vsimcard.com',
  'vubby.com','wetrainbayarea.com','wetrainbayarea.org',
  'wh4f.org','whatiaas.com','whatpaas.com',
  'wilemail.com','willselfdestruct.com','winemaven.info',
  'wronghead.com','wuzup.net','wuzupmail.net',
  'wwwnew.eu','xagloo.com','xemaps.com',
  'xents.com','xjoi.com','xmaily.com',
  'xoxy.net','yapped.net','yeah.net',
  'yep.it','yogamaven.com','yomail.info',
  'yuurok.com','zehnminutenmail.de','zippymail.info',
  'zoaxe.com','zoemail.org',
]);

const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

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
    try { return localStorage.getItem('komixora-admin-mode') === 'true'; } catch { return true; }
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
      .upsert(
        { user_id: userId, role: desiredRole as any },
        { onConflict: 'user_id,role', ignoreDuplicates: true },
      );

    if (roleInsertError) {
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

  // Track IP for existing users on login (fire-and-forget)
  const trackLoginIp = useCallback(async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('signup_ip').eq('user_id', userId).maybeSingle();
      if (prof && !(prof as any).signup_ip) {
        const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (geo?.ip) {
          await supabase.from('profiles').update({
            signup_ip: geo.ip,
            signup_country: geo.country_name || null,
            signup_city: geo.city || null,
          } as any).eq('user_id', userId);
        }
      }
    } catch {}
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      setShowAuthModal(false);
      // Track IP for existing users who don't have it yet
      if (data.user) trackLoginIp(data.user.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [trackLoginIp]);

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
        // Block disposable/temporary emails
        if (isDisposableEmail(email)) {
          return { success: false, error: 'Disposable or temporary email addresses are not allowed. Please use a real email.' };
        }

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

          // Track signup IP & location (fire-and-forget)
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(geo => {
              if (geo?.ip) {
                supabase.from('profiles').update({
                  signup_ip: geo.ip,
                  signup_country: geo.country_name || null,
                  signup_city: geo.city || null,
                } as any).eq('user_id', signUpData.user!.id).then(() => {});
              }
            })
            .catch(() => {});
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
          try { localStorage.setItem('komixora-admin-mode', String(mode)); } catch {}
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

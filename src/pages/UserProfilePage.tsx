import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicAchievements } from '@/components/AchievementSystem';

/**
 * Universal profile page for any user (reader or creator).
 * Routes: /reader/:id and /user/:id
 * If the user is a publisher, redirects to /publisher/:username
 * Otherwise renders a read-only reader profile.
 */
const UserProfilePage: React.FC = () => {
  const { id } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile-lookup', id],
    queryFn: async () => {
      // Try by username first
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', id)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-5xl">👤</span>
          <h2 className="text-xl font-bold">User not found</h2>
          <p className="text-sm text-muted-foreground">No user with username "{id}" exists.</p>
        </div>
      </div>
    );
  }

  // Redirect publishers to their publisher profile
  if (profile.role_type === 'publisher' || profile.role_type === 'creator') {
    return <Navigate to={`/publisher/${profile.username}`} replace />;
  }

  // Render reader profile
  const p = profile as any;
  const displayName = p.display_name || p.username || 'Anonymous';
  const initial = displayName[0]?.toUpperCase() || 'A';
  const joinDate = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const location = [p.country, p.continent].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <div className="max-w-lg mx-auto px-4">
        <div className="brutal-card p-6 sm:p-8 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 border-2 border-border overflow-hidden mb-4">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">{initial}</span>
            )}
          </div>

          {/* Name & Username */}
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {p.username && <p className="text-sm text-muted-foreground">@{p.username}</p>}

          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            📖 Reader
          </span>

          {/* Bio */}
          {p.bio && (
            <p className="text-sm text-muted-foreground mt-4 max-w-sm mx-auto">{p.bio}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mt-6 text-left">
            <div className="p-3 bg-muted/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Joined</p>
              <p className="text-sm font-semibold">{joinDate}</p>
            </div>
            {location && (
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold">{location}</p>
              </div>
            )}
          </div>

          {/* Social Links */}
          {p.social_links && Object.keys(p.social_links).length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {Object.entries(p.social_links as Record<string, string>).filter(([, v]) => v?.trim()).map(([key, val]) => (
                <a
                  key={key}
                  href={val.startsWith('http') ? val : `https://${val}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-muted/40 rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {key.replace('custom_', '').replace(/_/g, ' ')}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

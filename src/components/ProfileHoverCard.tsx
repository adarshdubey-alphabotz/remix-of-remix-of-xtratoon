import React from 'react';
import { Link } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ProfileHoverCardProps {
  userId: string;
  username?: string;
  children: React.ReactNode;
}

const ProfileHoverCard: React.FC<ProfileHoverCardProps> = ({ userId, username, children }) => {
  const { user } = useAuth();
  const { isFollowing, followersCount, toggleFollow, isToggling } = useFollow(userId);

  const { data: profileData } = useQuery({
    queryKey: ['hover-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, bio, role_type, is_verified')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  const { data: mangaCount = 0 } = useQuery({
    queryKey: ['hover-manga-count', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('manga')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('approval_status', 'APPROVED');
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  const p = profileData;
  const profileLink = `/publisher/${p?.username || username || ''}`;
  const isSelf = user?.id === userId;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-72 p-0 overflow-hidden glass-dropdown border-border/30"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        {/* Banner gradient */}
        <div className="h-16 bg-gradient-to-r from-primary/30 via-primary/10 to-accent/20" />

        <div className="px-4 pb-4 -mt-8">
          {/* Avatar */}
          <Link to={profileLink} className="block w-14 h-14 rounded-full border-2 border-background overflow-hidden mb-2">
            {p?.avatar_url ? (
              <img src={p.avatar_url} alt={`${p.display_name || p.username || 'User'}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Name & username */}
          <Link to={profileLink} className="block">
            <p className="text-sm font-bold text-foreground hover:underline leading-tight inline-flex items-center gap-1">
              {p?.display_name || p?.username || 'User'}
              {(p as any)?.is_verified && <VerifiedBadge size="sm" />}
            </p>
            {p?.username && (
              <p className="text-xs text-muted-foreground">@{p.username}</p>
            )}
          </Link>

          {/* Role badge */}
          {p?.role_type && p.role_type !== 'reader' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
              {p.role_type}
            </span>
          )}

          {/* Bio */}
          {p?.bio && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{p.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-bold text-foreground">{followersCount}</span> followers
            </span>
            {mangaCount > 0 && (
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">{mangaCount}</span> works
              </span>
            )}
          </div>

          {/* Follow button */}
          {!isSelf && user && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(); }}
              disabled={isToggling}
              className={`w-full mt-3 py-2 rounded-full text-xs font-bold transition-all ${
                isFollowing
                  ? 'border border-border text-foreground hover:border-destructive hover:text-destructive'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Eye, BookOpen, Calendar, MapPin, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import ScrollReveal from '@/components/ScrollReveal';
import ManhwaCard from '@/components/ManhwaCard';

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
};

const PublisherProfile: React.FC = () => {
  const { id } = useParams();

  // Fetch profile from Supabase by username
  const { data: profile, isLoading } = useQuery({
    queryKey: ['publisher-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch their approved manga
  const { data: creatorManga = [] } = useQuery({
    queryKey: ['publisher-manga', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('creator_id', profile.user_id)
        .eq('approval_status', 'APPROVED')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // Total views across all manga
  const totalViews = creatorManga.reduce((acc, m) => acc + (m.views || 0), 0);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">Loading profile...</p>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <p className="text-muted-foreground">User not found</p>
    </div>
  );

  const location = [profile.continent, profile.country].filter(Boolean).join(' → ');

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollReveal>
          <div className="brutal-card p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-foreground flex-shrink-0" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }} />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex-shrink-0 border-2 border-foreground flex items-center justify-center text-2xl font-bold" style={{ boxShadow: '3px 3px 0 hsl(0 0% 8%)' }}>
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-display text-4xl sm:text-5xl mb-1 tracking-wider">
                  {(profile.display_name || profile.username || 'Creator').toUpperCase()}
                </h1>
                {profile.username && (
                  <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
                )}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-lg">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{creatorManga.length}</span>
                    <span className="text-muted-foreground text-xs">Works</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{formatViews(totalViews)}</span>
                    <span className="text-muted-foreground text-xs">Total Views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{new Date(profile.created_at).toLocaleDateString()}</span>
                    <span className="text-muted-foreground text-xs">Joined</span>
                  </div>
                  {location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold">{location}</span>
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{profile.timezone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Creator's Works */}
        {creatorManga.length > 0 && (
          <ScrollReveal>
            <h2 className="text-display text-2xl tracking-wider mb-4">WORKS</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {creatorManga.map((m, i) => (
                <ManhwaCard
                  key={m.id}
                  manhwa={{
                    _id: m.id,
                    slug: m.slug,
                    title: m.title,
                    description: m.description || '',
                    cover: m.cover_url || '',
                    genres: m.genres || [],
                    status: m.status,
                    type: 'Manhwa',
                    views: m.views || 0,
                    ratingAverage: Number(m.rating_average) || 0,
                  } as any}
                  index={i}
                />
              ))}
            </div>
          </ScrollReveal>
        )}

        {creatorManga.length === 0 && (
          <div className="brutal-card p-12 text-center">
            <p className="text-muted-foreground">No published works yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherProfile;

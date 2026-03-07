import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFollow = (creatorId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFollowing = false } = useQuery({
    queryKey: ['follow-status', user?.id, creatorId],
    queryFn: async () => {
      if (!user || !creatorId) return false;
      const { data } = await supabase
        .from('follows' as any)
        .select('id')
        .eq('follower_id', user.id)
        .eq('creator_id', creatorId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!creatorId,
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followers-count', creatorId],
    queryFn: async () => {
      if (!creatorId) return 0;
      const { count } = await supabase
        .from('follows' as any)
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);
      return count || 0;
    },
    enabled: !!creatorId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !creatorId) throw new Error('Not authenticated');
      if (isFollowing) {
        await supabase
          .from('follows' as any)
          .delete()
          .eq('follower_id', user.id)
          .eq('creator_id', creatorId);
      } else {
        await supabase
          .from('follows' as any)
          .insert({ follower_id: user.id, creator_id: creatorId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, creatorId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', creatorId] });
    },
  });

  return {
    isFollowing,
    followersCount,
    toggleFollow: followMutation.mutate,
    isToggling: followMutation.isPending,
  };
};

export const useFollowingIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('follows' as any)
        .select('creator_id')
        .eq('follower_id', user.id);
      return (data || []).map((f: any) => f.creator_id as string);
    },
    enabled: !!user,
  });
};

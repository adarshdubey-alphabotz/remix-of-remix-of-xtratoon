import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const useUserNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data || []) as any[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markRead = async (id: string) => {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
  };

  const markAllRead = async () => {
    if (!user || notifications.length === 0) return;
    // Batch update all unread notifications at once
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) console.error('markAllRead error:', error);
    queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] });
  };

  return {
    notifications,
    unreadCount: notifications.length,
    markRead,
    markAllRead,
  };
};

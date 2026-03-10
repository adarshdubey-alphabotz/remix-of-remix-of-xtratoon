import React from 'react';
import { Bell, BookOpen, Heart, MessageCircle, Users, Info, Check, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, React.ReactNode> = {
  new_chapter: <BookOpen className="w-4 h-4 text-primary" />,
  new_post: <MessageCircle className="w-4 h-4 text-blue-500" />,
  new_follower: <Users className="w-4 h-4 text-green-500" />,
  like: <Heart className="w-4 h-4 text-pink-500" />,
  manga_approved: <Check className="w-4 h-4 text-green-500" />,
  chapter_approved: <Check className="w-4 h-4 text-green-500" />,
  manga_rejected: <XCircle className="w-4 h-4 text-destructive" />,
  chapter_rejected: <XCircle className="w-4 h-4 text-destructive" />,
};

interface Props {
  open: boolean;
  onClose: () => void;
  adminNotifications?: any[];
  adminMode?: boolean;
  onMarkAdminRead?: (id: string) => void;
  onMarkAllAdminRead?: () => void;
}

const NotificationCenter: React.FC<Props> = ({
  open,
  onClose,
  adminNotifications = [],
  adminMode = false,
  onMarkAdminRead,
  onMarkAllAdminRead,
}) => {
  const { notifications: userNotifs, unreadCount: userUnreadCount, markRead, markAllRead } = useUserNotifications();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const showAdmin = isAdmin && adminMode && adminNotifications.length > 0;
  const totalCount = userUnreadCount + (showAdmin ? adminNotifications.length : 0);

  const handleNotifClick = async (n: any, isAdminNotif = false) => {
    if (isAdminNotif) {
      onMarkAdminRead?.(n.id);
      onClose();
      navigate('/admin');
    } else {
      markRead(n.id);
      onClose();
      if (n.type === 'new_chapter' && n.reference_id) navigate(`/manhwa/${n.reference_id}`);
      else if ((n.type === 'manga_approved' || n.type === 'chapter_approved') && n.reference_id) navigate(`/manhwa/${n.reference_id}`);
      else if ((n.type === 'manga_rejected' || n.type === 'chapter_rejected')) navigate('/dashboard');
      else if (n.type === 'new_post' && n.reference_id) navigate(`/community/post/${n.reference_id}`);
      else if (n.type === 'new_follower' && n.reference_id) {
        // reference_id is the follower's user_id, look up their username
        const { data: followerProfile } = await supabase.from('profiles').select('username').eq('user_id', n.reference_id).single();
        if (followerProfile?.username) navigate(`/publisher/${followerProfile.username}`);
        else navigate(`/community`);
      }
      else if (n.type === 'unbanned') navigate('/profile');
    }
  };

  const handleMarkAll = () => {
    markAllRead();
    if (showAdmin) onMarkAllAdminRead?.();
  };

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 glass-dropdown overflow-hidden max-h-[28rem] flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-display text-lg tracking-wide">NOTIFICATIONS</h3>
                {totalCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                    {totalCount}
                  </span>
                )}
              </div>
              {totalCount > 0 && (
                <button onClick={handleMarkAll} className="text-xs text-primary hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* User notifications */}
              {userNotifs.length > 0 && (
                <div className="divide-y divide-border/20">
                  {userNotifs.map((n: any) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {typeIcons[n.type] || <Info className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Admin notifications */}
              {showAdmin && (
                <div className="divide-y divide-border/20">
                  {userNotifs.length > 0 && (
                    <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                      🛡️ Admin
                    </div>
                  )}
                  {adminNotifications.map((n: any) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n, true)}
                      className="w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {userNotifs.length === 0 && !showAdmin && (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;

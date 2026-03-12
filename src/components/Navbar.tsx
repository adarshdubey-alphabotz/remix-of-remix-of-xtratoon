import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, MoreVertical, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield, Sun, Moon, Smartphone, Home, BarChart3, MessageSquare, Clock, Users, Eye, FileText, Newspaper, Scale, Cookie, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import NotificationCenter from '@/components/NotificationCenter';

const Navbar: React.FC = () => {
  const { user, profile, logout, setShowAuthModal, setAuthTab, isAdmin, isPublisher, adminMode, setAdminMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: adminNotifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await supabase.from('admin_notifications' as any).select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(20);
      return (data || []) as any[];
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  const unreadCount = adminNotifications.length;

  const markNotifRead = async (id: string) => {
    await supabase.from('admin_notifications' as any).update({ is_read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const markAllRead = async () => {
    const ids = adminNotifications.map((n: any) => n.id);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from('admin_notifications' as any).update({ is_read: true }).eq('id', id);
    }
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  useEffect(() => {
    setUserMenuOpen(false);
    setNotifOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = () => { setAuthTab('login'); setShowAuthModal(true); setMobileMenuOpen(false); };
  const handleSignup = () => { setAuthTab('signup'); setShowAuthModal(true); setMobileMenuOpen(false); };
  const handleLogout = async () => {
    setLogoutPending(true);
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
    setLogoutPending(false);
  };
  const isActive = (path: string) => location.pathname === path;
  const isReaderPage = location.pathname.startsWith('/read/');

  const { unreadCount: userUnreadCount } = useUserNotifications();

  const bottomNavItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: Search },
    { to: '/upcoming', label: 'Upcoming', icon: Clock },
    { to: '/charts', label: 'Charts', icon: BarChart3 },
    { to: '/community', label: 'Community', icon: MessageSquare },
  ];

  const desktopNavItems = [
    ...bottomNavItems,
    { to: '/creators', label: 'Creators', icon: Users },
  ];

  if (isReaderPage) return null;

  const themeIcon = theme === 'light' ? <Moon className="w-4 h-4" /> : theme === 'dark' ? <Smartphone className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  const themeLabel = theme === 'light' ? 'Dark Mode' : theme === 'dark' ? 'AMOLED Mode' : 'Light Mode';

  return (
    <>
      {/* Desktop navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 hidden md:block transition-all duration-200 ${scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-background border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0">
              <span className="text-display text-xl">
                KOMI<span className="text-primary">XORA</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {desktopNavItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.to)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>

            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
              {themeIcon}
            </button>

            {user && (
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
                  <Bell className="w-4 h-4" />
                  {(() => {
                    const showAdminNotifs = isAdmin && adminMode;
                    const count = showAdminNotifs ? unreadCount + userUnreadCount : userUnreadCount;
                    return count > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                      </span>
                    ) : null;
                  })()}
                </button>
                <NotificationCenter
                  open={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  adminNotifications={adminNotifications}
                  adminMode={adminMode}
                  onMarkAdminRead={markNotifRead}
                  onMarkAllAdminRead={markAllRead}
                />
              </div>
            )}

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/60 transition-colors">
                  <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {(profile?.username || profile?.display_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg p-1.5 z-50">
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || profile?.username || user.email}</p>
                        {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/10 text-primary rounded-full">
                          {isAdmin ? (adminMode ? 'Admin' : 'Creator') : (profile?.role_type || 'reader')}
                        </span>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"><UserIcon className="w-4 h-4" /> My Profile</Link>
                      <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"><BookOpen className="w-4 h-4" /> My Library</Link>
                      {(isPublisher || (isAdmin && !adminMode)) && (
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                      )}
                      {isAdmin && adminMode && (
                        <>
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"><Shield className="w-4 h-4" /> Admin Panel</Link>
                          <Link to="/admin/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"><Shield className="w-4 h-4" /> Admin Settings</Link>
                        </>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setAdminMode(!adminMode)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted/60 rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-2"><Shield className="w-4 h-4" />{adminMode ? 'Switch to Creator' : 'Switch to Admin'}</span>
                          <span className={`w-7 h-4 rounded-full transition-colors flex items-center ${adminMode ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                            <span className="w-3 h-3 bg-background rounded-full mx-0.5" />
                          </span>
                        </button>
                      )}
                      <div className="my-1 border-t border-border/50" />
                      <button onClick={handleLogout} disabled={logoutPending} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-60"><LogOut className="w-4 h-4" /> {logoutPending ? 'Logging out...' : 'Logout'}</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleLogin} className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</button>
                <button onClick={handleSignup} className="px-4 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-background border-b border-border">
        <div className="flex items-center justify-between px-3 h-12">
          <Link to="/" className="flex-shrink-0">
            <span className="text-display text-lg">
              KOMI<span className="text-primary">XORA</span>
            </span>
          </Link>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            {user && (
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground">
                <Bell className="w-[18px] h-[18px]" />
                {(() => {
                  const showAdminNotifs = isAdmin && adminMode;
                  const count = showAdminNotifs ? unreadCount + userUnreadCount : userUnreadCount;
                  return count > 0 ? (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  ) : null;
                })()}
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-foreground" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Notification center for mobile */}
        {notifOpen && (
          <div className="absolute right-2 top-12 z-50">
            <NotificationCenter
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              adminNotifications={adminNotifications}
              adminMode={adminMode}
              onMarkAdminRead={markNotifRead}
              onMarkAllAdminRead={markAllRead}
            />
          </div>
        )}

        {/* Mobile 3-dot dropdown — full menu with legal & blog links */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px]" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute right-2 top-12 z-50 w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto p-1.5">
                {user && (
                  <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || profile?.username || user.email}</p>
                    {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/10 text-primary rounded-full">
                      {isAdmin ? (adminMode ? 'Admin' : 'Creator') : (profile?.role_type || 'reader')}
                    </span>
                  </div>
                )}

                {/* Navigation */}
                <Link to="/creators" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors">
                  <Users className="w-4 h-4 text-muted-foreground" /> Search Creators
                </Link>

                {user && (
                  <>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors">
                      <UserIcon className="w-4 h-4 text-muted-foreground" /> My Profile
                    </Link>
                    <Link to="/library" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors">
                      <BookOpen className="w-4 h-4 text-muted-foreground" /> My Library
                    </Link>
                    {(isPublisher || (isAdmin && !adminMode)) && (
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Dashboard
                      </Link>
                    )}
                    {isAdmin && adminMode && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors">
                        <Shield className="w-4 h-4 text-muted-foreground" /> Admin Panel
                      </Link>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { setAdminMode(!adminMode); setMobileMenuOpen(false); }}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-3"><Shield className="w-4 h-4 text-muted-foreground" />{adminMode ? 'Creator Mode' : 'Admin Mode'}</span>
                        <span className={`w-7 h-4 rounded-full transition-colors flex items-center ${adminMode ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                          <span className="w-3 h-3 bg-background rounded-full mx-0.5" />
                        </span>
                      </button>
                    )}
                  </>
                )}

                {/* Theme toggle */}
                <div className="my-1 border-t border-border/50" />
                <button
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-muted/60 rounded-lg transition-colors"
                >
                  {themeIcon} <span>{themeLabel}</span>
                </button>

                {/* Legal & Info section */}
                <div className="my-1 border-t border-border/50" />
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Info & Legal</p>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <Newspaper className="w-4 h-4" /> Blog
                </Link>
                <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" /> Terms of Service
                </Link>
                <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <Scale className="w-4 h-4" /> Privacy Policy
                </Link>
                <Link to="/content-guidelines" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Content Guidelines
                </Link>
                <Link to="/dmca" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <Shield className="w-4 h-4" /> DMCA
                </Link>
                <Link to="/cookie-policy" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
                  <Cookie className="w-4 h-4" /> Cookie Policy
                </Link>

                {/* Auth buttons / Logout */}
                <div className="my-1 border-t border-border/50" />
                {!user ? (
                  <div className="flex gap-2 p-2">
                    <button onClick={handleLogin} className="flex-1 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted/40 transition-colors">Login</button>
                    <button onClick={handleSignup} className="flex-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg">Sign Up</button>
                  </div>
                ) : (
                  <button onClick={handleLogout} disabled={logoutPending} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-60">
                    <LogOut className="w-4 h-4" /> {logoutPending ? 'Logging out...' : 'Logout'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-13 max-w-md mx-auto">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[9px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}
          {user ? (
            <Link
              to="/profile"
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <UserIcon className={`w-5 h-5 ${isActive('/profile') ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[9px] ${isActive('/profile') ? 'font-bold' : 'font-medium'}`}>Profile</span>
              {userUnreadCount > 0 && (
                <span className="absolute top-0.5 right-1/4 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full flex items-center justify-center">
                  {userUnreadCount > 9 ? '9+' : userUnreadCount}
                </span>
              )}
            </Link>
          ) : (
            <button onClick={handleSignup} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-muted-foreground">
              <UserIcon className="w-5 h-5" />
              <span className="text-[9px] font-medium">Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield, Sun, Moon, Smartphone, Home, BarChart3, Grid3X3, MessageSquare, Command, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import NotificationCenter from '@/components/NotificationCenter';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const Navbar: React.FC = () => {
  const { user, profile, logout, setShowAuthModal, setAuthTab, isAdmin, isPublisher, adminMode, setAdminMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Admin notifications
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogin = () => { setAuthTab('login'); setShowAuthModal(true); setMobileOpen(false); };
  const handleSignup = () => { setAuthTab('signup'); setShowAuthModal(true); setMobileOpen(false); };
  const handleLogout = async () => {
    setLogoutPending(true);
    await logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
    setLogoutPending(false);
  };
  const isActive = (path: string) => location.pathname === path;
  const isReaderPage = location.pathname.startsWith('/read/');
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // User notifications
  const { unreadCount: userUnreadCount } = useUserNotifications();

  const navItems = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: Search },
    { to: '/charts', label: 'Charts', icon: BarChart3 },
    { to: '/community', label: 'Community', icon: MessageSquare },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -8 },
  };

  // Hide navbar completely in reader mode
  if (isReaderPage) return null;

  return (
    <>
      {/* Desktop: floating glass pill navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-center pointer-events-none" style={{ paddingTop: '16px' }}>
        <motion.div
          className="pointer-events-auto flex items-center gap-1 rounded-full p-1.5 border"
          style={{
            background: isHomePage && !scrolled
              ? 'hsla(var(--background) / 0.15)'
              : scrolled
              ? 'hsla(var(--glass-bg))'
              : 'hsla(var(--background) / 0.4)',
            backdropFilter: 'blur(60px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
            borderColor: isHomePage && !scrolled
              ? 'hsla(0, 0%, 100% / 0.15)'
              : scrolled
              ? 'hsla(var(--glass-border))'
              : 'hsla(var(--border) / 0.3)',
            boxShadow: scrolled
              ? '0 8px 40px -8px hsla(0, 0%, 0%, 0.15), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.1)'
              : '0 4px 20px -4px hsla(0, 0%, 0%, 0.08)',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <Link to="/" className="px-4 py-2 flex-shrink-0">
            <span className="text-display text-xl tracking-wider">
              <span className="font-normal">KOMI</span>
              <span className="text-primary">XORA</span>
            </span>
          </Link>

          {/* Nav pill items */}
          <div className="flex items-center gap-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill-active"
                      className="absolute inset-0 bg-muted/70 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Genres dropdown */}
            <div className="relative">
              <button
                onClick={() => setGenreOpen(!genreOpen)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-full"
              >
                <Grid3X3 className="w-4 h-4" />
                Genres
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${genreOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {genreOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setGenreOpen(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden" animate="visible" exit="exit"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full mt-3 left-0 w-64 glass-dropdown p-2 grid grid-cols-2 gap-0.5"
                    >
                      {allGenres.map(g => (
                        <Link key={g} to={`/browse?genre=${g}`} onClick={() => setGenreOpen(false)} className="px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl">
                          {g}
                        </Link>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border/40 mx-1" />

          {/* Search — triggers ⌘K spotlight */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-muted rounded border border-border/50">⌘K</kbd>
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-muted/60 transition-all text-muted-foreground hover:text-foreground" aria-label="Toggle theme" title={`Theme: ${theme}`}>
            <AnimatePresence mode="wait">
              {theme === 'light' ? (
                <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-[18px] h-[18px]" />
                </motion.div>
              ) : theme === 'dark' ? (
                <motion.div key="amoled" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Smartphone className="w-[18px] h-[18px]" />
                </motion.div>
              ) : (
                <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-[18px] h-[18px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-full hover:bg-muted/60 transition-all text-muted-foreground hover:text-foreground">
                <Bell className="w-[18px] h-[18px]" />
                {(() => {
                  const showAdminNotifs = isAdmin && adminMode;
                  const count = showAdminNotifs ? unreadCount + userUnreadCount : userUnreadCount;
                  return count > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
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

          {/* Auth */}
          {user ? (
          <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted/60 transition-all">
                <div className="w-8 h-8 gradient-cover-1 rounded-full flex items-center justify-center text-xs font-bold text-foreground">{(profile?.username || profile?.display_name || user.email || 'U')[0].toUpperCase()}</div>
                {userUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
                    {userUnreadCount > 9 ? '9+' : userUnreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                     <motion.div
                       variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                       transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                       className="absolute right-0 top-full mt-3 w-60 glass-dropdown p-2 overflow-hidden"
                     >
                       {/* Profile header */}
                       <div className="px-3 py-3 border-b border-border/30 mb-1">
                         <p className="text-sm font-bold text-foreground truncate">{profile?.display_name || profile?.username || user.email}</p>
                         {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                            {isAdmin ? (adminMode ? '🛡️ Admin' : '✨ Creator') : (profile?.role_type || 'reader')}
                          </span>
                        </div>
                         <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><UserIcon className="w-4 h-4" /> My Profile</Link>
                         <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><BookOpen className="w-4 h-4" /> My Library</Link>
                         {(isPublisher || (isAdmin && !adminMode)) && (
                           <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                         )}
                         {isAdmin && adminMode && (
                           <>
                             <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><Shield className="w-4 h-4" /> Admin Panel</Link>
                             <Link to="/admin/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><Shield className="w-4 h-4" /> Admin Settings</Link>
                           </>
                         )}
                         {isAdmin && (
                           <button
                             onClick={() => setAdminMode(!adminMode)}
                             className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-primary/10 transition-all font-medium rounded-xl"
                           >
                             <span className="flex items-center gap-2.5">
                               <Shield className="w-4 h-4" />
                               {adminMode ? 'Switch to Creator' : 'Switch to Admin'}
                             </span>
                             <span className={`w-8 h-4 rounded-full transition-colors flex items-center ${adminMode ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                               <span className="w-3 h-3 bg-background rounded-full mx-0.5" />
                             </span>
                           </button>
                         )}
                        <div className="my-1 border-t border-border/30" />
                        <button onClick={handleLogout} disabled={logoutPending} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-destructive/10 transition-all w-full text-left text-destructive font-medium rounded-xl disabled:opacity-60"><LogOut className="w-4 h-4" /> {logoutPending ? 'Logging out...' : 'Logout'}</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={handleSignup} className="btn-accent text-xs py-2 px-5 rounded-full">Sign Up</button>
          )}
        </motion.div>
      </nav>

      {/* Mobile: compact glass bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div
          className="mx-3 mt-3 rounded-2xl border flex items-center justify-between px-4 h-14"
          style={{
            background: 'hsla(var(--glass-bg))',
            backdropFilter: 'blur(60px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
            borderColor: 'hsla(var(--glass-border))',
            boxShadow: '0 8px 40px -8px hsla(0, 0%, 0%, 0.15), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.1)',
          }}
        >
          <Link to="/" className="flex-shrink-0">
            <span className="text-display text-xl tracking-wider">
              <span className="font-normal">XTRA</span>
              <span className="text-primary">TOON</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/creators" className="p-2 rounded-full hover:bg-muted/60 transition-all text-muted-foreground" aria-label="Search creators">
              <Search className="w-4 h-4" />
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted/60 transition-all text-muted-foreground" aria-label="Toggle theme" title={`Theme: ${theme}`}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : theme === 'dark' ? <Smartphone className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-full hover:bg-muted/60 transition-all text-foreground">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile bottom pill nav */}
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div
            className="flex items-center justify-around rounded-full p-1.5 border"
            style={{
              background: 'hsla(var(--glass-bg))',
              backdropFilter: 'blur(60px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
              borderColor: 'hsla(var(--glass-border))',
              boxShadow: '0 8px 40px -8px hsla(0, 0%, 0%, 0.2), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.1)',
            }}
          >
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
                    active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-muted/70 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                </Link>
              );
            })}
            {user ? (
              <Link
                to="/profile"
                className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
                  isActive('/profile') || isActive('/settings') ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {(isActive('/profile') || isActive('/settings')) && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-muted/70 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <UserIcon className="w-5 h-5 relative z-10" />
                {userUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center z-20">
                    {userUnreadCount > 9 ? '9+' : userUnreadCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={handleSignup}
                className="relative flex items-center justify-center p-3 rounded-full text-muted-foreground transition-all duration-300"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile expanded menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-3 mt-1 rounded-2xl border overflow-hidden"
              style={{
                background: 'hsla(var(--glass-bg))',
                backdropFilter: 'blur(60px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
                borderColor: 'hsla(var(--glass-border))',
              }}
            >
              <div className="p-4 space-y-2">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search manhwa..." className="w-full pl-9 pr-3 py-2.5 bg-muted/30 border border-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </form>
                {navItems.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-4 py-3 text-sm font-semibold transition-all rounded-xl ${isActive(l.to) ? 'text-primary bg-primary/10' : 'hover:bg-muted/40'}`}>{l.label}</Link>
                ))}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {allGenres.slice(0, 6).map(g => (
                    <Link key={g} to={`/browse?genre=${g}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-xs text-center border border-border/30 rounded-xl hover:border-primary hover:text-primary transition-all font-medium">{g}</Link>
                  ))}
                </div>
                {!user && (
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <button onClick={handleLogin} className="flex-1 btn-outline text-xs py-3">Login</button>
                    <button onClick={handleSignup} className="flex-1 btn-accent text-xs py-3">Sign Up</button>
                  </div>
                )}
                {user && (
                  <div className="pt-3 border-t border-border/30 space-y-1">
                    <div className="px-4 py-2">
                      <p className="text-sm font-bold">{profile?.display_name || user.email}</p>
                      {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                    </div>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl">My Profile</Link>
                    <Link to="/library" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl">My Library</Link>
                    {(isPublisher || (isAdmin && !adminMode)) && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl">Dashboard</Link>}
                    {isAdmin && adminMode && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl">Admin Panel</Link>}
                    {isAdmin && adminMode && <Link to="/admin/settings" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl">Admin Settings</Link>}
                    {isAdmin && (
                      <button
                        onClick={() => setAdminMode(!adminMode)}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 rounded-xl"
                      >
                        <span>{adminMode ? 'Switch to Creator' : 'Switch to Admin'}</span>
                        <span className={`w-8 h-4 rounded-full transition-colors flex items-center ${adminMode ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                          <span className="w-3 h-3 bg-background rounded-full mx-0.5" />
                        </span>
                      </button>
                    )}
                    <button onClick={handleLogout} disabled={logoutPending} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-xl disabled:opacity-60">{logoutPending ? 'Logging out...' : 'Logout'}</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;

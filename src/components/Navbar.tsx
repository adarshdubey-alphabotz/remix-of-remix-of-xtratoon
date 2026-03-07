import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield, Sun, Moon, Home, Compass, BarChart3, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const Navbar: React.FC = () => {
  const { user, logout, setShowAuthModal, setAuthTab } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/browse', label: 'Browse', icon: Search },
    { to: '/charts', label: 'Charts', icon: BarChart3 },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -8 },
  };

  return (
    <>
      {/* Desktop: floating glass pill navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-center pointer-events-none" style={{ paddingTop: '16px' }}>
        <motion.div
          className="pointer-events-auto flex items-center gap-1 rounded-full p-1.5 border"
          style={{
            background: scrolled
              ? 'hsla(var(--glass-bg))'
              : 'hsla(var(--background) / 0.4)',
            backdropFilter: 'blur(60px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
            borderColor: scrolled
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
              <span className="font-normal">XTRA</span>
              <span className="text-primary">TOON</span>
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

          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-36 pl-9 pr-3 py-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:w-48 transition-all duration-300 rounded-full"
            />
          </form>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-muted/60 transition-all text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
            <AnimatePresence mode="wait">
              {theme === 'light' ? (
                <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-[18px] h-[18px]" />
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
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-3 w-80 glass-dropdown overflow-hidden"
                    >
                      <div className="p-4 border-b border-border/50"><h3 className="font-display text-lg tracking-wide">NOTIFICATIONS</h3></div>
                      <div className="p-4 text-sm text-muted-foreground">No new notifications</div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted/60 transition-all">
                <div className="w-8 h-8 gradient-cover-1 rounded-full flex items-center justify-center text-xs font-bold text-foreground">{user.username[0]}</div>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-3 w-52 glass-dropdown p-2 overflow-hidden"
                    >
                      {user.role === 'USER' && (
                        <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><BookOpen className="w-4 h-4" /> My Library</Link>
                      )}
                      {user.role === 'CREATOR' && (
                        <>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                          <Link to={`/publisher/${user.username}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><UserIcon className="w-4 h-4" /> My Profile</Link>
                        </>
                      )}
                      {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><Shield className="w-4 h-4" /> Admin Panel</Link>
                      )}
                      <div className="my-1 border-t border-border/30" />
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-destructive/10 transition-all w-full text-left text-destructive font-medium rounded-xl"><LogOut className="w-4 h-4" /> Logout</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <LiquidButton size="sm" onClick={handleSignup}>Sign Up</LiquidButton>
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
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted/60 transition-all text-muted-foreground" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative flex items-center justify-center p-3 rounded-full text-muted-foreground transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>
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
                {[...navItems, { to: '/explore', label: 'Explore', icon: Compass }].filter((v, i, a) => a.findIndex(x => x.to === v.to) === i).map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-4 py-3 text-sm font-semibold transition-all rounded-xl ${isActive(l.to) ? 'text-primary bg-primary/10' : 'hover:bg-muted/40'}`}>{l.label}</Link>
                ))}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {allGenres.slice(0, 6).map(g => (
                    <Link key={g} to={`/browse?genre=${g}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-xs text-center border border-border/30 rounded-xl hover:border-primary hover:text-primary transition-all font-medium">{g}</Link>
                  ))}
                </div>
                {!user && (
                  <div className="flex gap-2 pt-3 border-t border-border/30">
                    <LiquidButton variant="outline" size="default" onClick={handleLogin} className="flex-1">Login</LiquidButton>
                    <LiquidButton size="default" onClick={handleSignup} className="flex-1">Sign Up</LiquidButton>
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

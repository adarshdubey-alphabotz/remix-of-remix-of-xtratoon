import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { mockNotifications, allGenres, publishers } from '@/data/mockData';

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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse' },
    { to: '/charts', label: 'Charts' },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -8 },
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-strong border-b border-border' : 'bg-background/40 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-display text-2xl sm:text-3xl tracking-wider">
            <span className="font-normal">XTRA</span>
            <span className="text-primary">TOON</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative px-4 py-2 text-sm font-semibold transition-all rounded-lg ${
                isActive(l.to) ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              {l.label}
              {isActive(l.to) && (
                <motion.div layoutId="nav-active" className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </Link>
          ))}

          <div className="relative">
            <button onClick={() => setGenreOpen(!genreOpen)} className="px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-foreground flex items-center gap-1 transition-colors rounded-lg">
              Genres <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${genreOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {genreOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setGenreOpen(false)} />
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
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

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search manhwa..."
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-muted/60 transition-all text-foreground/70 hover:text-foreground"
            aria-label="Toggle theme"
          >
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

          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-xl hover:bg-muted/60 transition-all text-foreground/70 hover:text-foreground">
                <Bell className="w-[18px] h-[18px]" />
                {mockNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-3 w-80 glass-dropdown overflow-hidden"
                    >
                      <div className="p-4 border-b border-border/50"><h3 className="font-display text-lg tracking-wide">NOTIFICATIONS</h3></div>
                      <div className="max-h-64 overflow-y-auto">
                        {mockNotifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 border-b border-border/20 text-sm transition-colors hover:bg-primary/5 ${!n.read ? 'bg-primary/5' : ''}`}>
                            <p className="text-foreground">{n.text}</p>
                            <p className="text-muted-foreground text-xs mt-1">{n.time}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/60 transition-all">
                <div className="w-8 h-8 gradient-cover-1 rounded-full flex items-center justify-center text-xs font-bold text-foreground">{user.username[0]}</div>
                <span className="hidden md:block text-sm font-semibold text-foreground/80">{user.username}</span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-3 w-52 glass-dropdown p-2 overflow-hidden"
                    >
                      {user.role === 'reader' && (
                        <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><BookOpen className="w-4 h-4" /> My Library</Link>
                      )}
                      {user.role === 'publisher' && (
                        <>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                          <Link to={`/publisher/${publishers.find(p => p.email === user.email)?.id || 'pub-1'}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-all font-medium rounded-xl"><UserIcon className="w-4 h-4" /> My Profile</Link>
                        </>
                      )}
                      {user.role === 'admin' && (
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
            <div className="hidden md:flex items-center gap-2">
              <button onClick={handleLogin} className="btn-outline text-xs py-2 px-4">Login</button>
              <button onClick={handleSignup} className="btn-accent text-xs py-2 px-4">Sign Up</button>
            </div>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 rounded-xl hover:bg-muted/60 transition-all">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search manhwa..." className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </form>
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-4 py-3 text-sm font-semibold transition-all rounded-xl ${isActive(l.to) ? 'text-primary bg-primary/10' : 'hover:bg-muted/60'}`}>{l.label}</Link>
              ))}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {allGenres.slice(0, 6).map(g => (
                  <Link key={g} to={`/browse?genre=${g}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-xs text-center border border-border rounded-xl hover:border-primary hover:text-primary transition-all font-medium">{g}</Link>
                ))}
              </div>
              {!user && (
                <div className="flex gap-2 pt-3 border-t border-border/50">
                  <button onClick={handleLogin} className="flex-1 btn-outline text-xs py-3">Login</button>
                  <button onClick={handleSignup} className="flex-1 btn-accent text-xs py-3">Sign Up</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

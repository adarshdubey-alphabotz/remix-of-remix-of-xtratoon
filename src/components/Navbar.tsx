import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { mockNotifications, allGenres, publishers } from '@/data/mockData';

const Navbar: React.FC = () => {
  const { user, logout, setShowAuthModal, setAuthTab } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-display text-xl sm:text-2xl tracking-tight">
            <span className="text-primary">XTRA</span>
            <span className="text-foreground">TOON</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive(l.to) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
              {isActive(l.to) && (
                <motion.div layoutId="nav-active" className="absolute inset-0 bg-primary/10 rounded-lg -z-10" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </Link>
          ))}

          <div className="relative">
            <button onClick={() => setGenreOpen(!genreOpen)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Genres <ChevronDown className={`w-3 h-3 transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {genreOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setGenreOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 left-0 w-60 glass-strong rounded-xl p-3 grid grid-cols-2 gap-1"
                  >
                    {allGenres.map(g => (
                      <Link key={g} to={`/browse?genre=${g}`} onClick={() => setGenreOpen(false)} className="px-3 py-2 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
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
          <div className={`relative w-full transition-all ${searchFocused ? 'scale-105' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search manhwa..."
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <Bell className="w-5 h-5" />
                {mockNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-border"><h3 className="font-display text-sm font-bold">Notifications</h3></div>
                      <div className="max-h-64 overflow-y-auto">
                        {mockNotifications.map(n => (
                          <div key={n.id} className={`px-3 py-2.5 border-b border-border/50 text-sm transition-colors hover:bg-muted/30 ${!n.read ? 'bg-primary/5' : ''}`}>
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
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-xl gradient-cover-1 flex items-center justify-center text-xs font-bold text-foreground">{user.username[0]}</div>
                <span className="hidden md:block text-sm font-medium">{user.username}</span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl py-1 overflow-hidden"
                    >
                      {user.role === 'reader' && (
                        <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"><BookOpen className="w-4 h-4" /> My Library</Link>
                      )}
                      {user.role === 'publisher' && (
                        <>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                          <Link to={`/publisher/${publishers.find(p => p.email === user.email)?.id || 'pub-1'}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"><UserIcon className="w-4 h-4" /> My Profile</Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Shield className="w-4 h-4" /> Admin Panel</Link>
                      )}
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors w-full text-left text-destructive"><LogOut className="w-4 h-4" /> Logout</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button onClick={handleLogin} className="px-4 py-2 text-sm font-medium rounded-xl glass hover:bg-muted/50 transition-all">Login</button>
              <button onClick={handleSignup} className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Sign Up</button>
            </div>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors">
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
            className="md:hidden glass-strong border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search manhwa..." className="w-full pl-9 pr-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </form>
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(l.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/30'}`}>{l.label}</Link>
              ))}
              {/* Genre grid in mobile */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {allGenres.slice(0, 6).map(g => (
                  <Link key={g} to={`/browse?genre=${g}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-xs text-center rounded-xl glass hover:bg-primary/10 hover:text-primary transition-colors font-medium">{g}</Link>
                ))}
              </div>
              {!user && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={handleLogin} className="flex-1 px-4 py-3 text-sm font-medium rounded-xl glass">Login</button>
                  <button onClick={handleSignup} className="flex-1 px-4 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">Sign Up</button>
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

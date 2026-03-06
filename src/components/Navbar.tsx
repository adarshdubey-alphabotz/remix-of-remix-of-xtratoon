import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown, User as UserIcon, LogOut, BookOpen, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockNotifications, allGenres } from '@/data/mockData';

const Navbar: React.FC = () => {
  const { user, logout, setShowAuthModal, setAuthTab } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogin = () => {
    setAuthTab('login');
    setShowAuthModal(true);
    setMobileOpen(false);
  };

  const handleSignup = () => {
    setAuthTab('signup');
    setShowAuthModal(true);
    setMobileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse' },
    { to: '/charts', label: 'Charts' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-display text-2xl tracking-tight">
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
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(l.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* Genre dropdown */}
          <div className="relative">
            <button
              onClick={() => setGenreOpen(!genreOpen)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Genres <ChevronDown className="w-3 h-3" />
            </button>
            {genreOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setGenreOpen(false)} />
                <div className="absolute top-full mt-2 left-0 w-56 glass-strong rounded-lg p-3 grid grid-cols-2 gap-1">
                  {allGenres.map(g => (
                    <Link
                      key={g}
                      to={`/browse?genre=${g}`}
                      onClick={() => setGenreOpen(false)}
                      className="px-2 py-1.5 text-sm rounded hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search manhwa..."
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {mockNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <h3 className="font-display text-sm font-bold">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {mockNotifications.map(n => (
                        <div key={n.id} className={`px-3 py-2.5 border-b border-border/50 text-sm ${!n.read ? 'bg-primary/5' : ''}`}>
                          <p className="text-foreground">{n.text}</p>
                          <p className="text-muted-foreground text-xs mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-cover-1 flex items-center justify-center text-xs font-bold text-foreground">
                  {user.username[0]}
                </div>
                <span className="hidden md:block text-sm font-medium">{user.username}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-lg py-1 overflow-hidden">
                    {user.role === 'reader' && (
                      <Link to="/library" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <BookOpen className="w-4 h-4" /> My Library
                      </Link>
                    )}
                    {user.role === 'publisher' && (
                      <>
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to={`/publisher/${publishers.find(p => p.email === user.email)?.id || 'pub-1'}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                          <UserIcon className="w-4 h-4" /> My Profile
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors w-full text-left text-destructive">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button onClick={handleLogin} className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-foreground/20 hover:border-foreground/40 transition-colors">
                Login
              </button>
              <button onClick={handleSignup} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-muted/50">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border">
          <div className="p-4 space-y-2">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search manhwa..."
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </form>
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(l.to) ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={handleLogin} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border-2 border-foreground/20">Login</button>
                <button onClick={handleSignup} className="flex-1 px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Need to import publishers
import { publishers } from '@/data/mockData';

export default Navbar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Heart, BookOpen, Users, BarChart3, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import mascotImg from '@/assets/mascot-character.png';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const floatKeyframes = `
@keyframes mascotFloat {
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
@keyframes mascotWave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  75% { transform: rotate(-5deg); }
}
`;

const Footer: React.FC = () => (
  <footer className="relative border-t border-border bg-background overflow-hidden">
    <style>{floatKeyframes}</style>

    {/* Animated mascot */}
    <div className="absolute -top-16 right-4 sm:right-12 lg:right-24 z-10 pointer-events-none select-none">
      <div style={{ animation: 'mascotFloat 4s ease-in-out infinite' }}>
        <img
          src={mascotImg}
          alt="Xtratoon Mascot"
          className="w-28 sm:w-36 lg:w-40 drop-shadow-lg"
          loading="lazy"
        />
      </div>
    </div>

    {/* Background accent glow */}
    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-[1]">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 space-y-4 pr-8">
          <Link to="/" className="inline-block">
            <span className="text-display text-3xl tracking-wider">
              <span className="font-normal">XTRA</span>
              <span className="text-primary">TOON</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Premium manhwa & manga from world-class creators. Discover, read, and publish stunning webtoons.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="https://instagram.com/XtraToon.global"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/Xtratoonglobal"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              aria-label="Follow us on X"
            >
              <XIcon />
            </a>
          </div>
        </div>

        {/* Discover */}
        <div className="space-y-3">
          <h4 className="text-display text-sm tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> DISCOVER
          </h4>
          <nav className="flex flex-col gap-2">
            <Link to="/home" className="text-sm text-muted-foreground hover:text-primary transition-colors">Explore</Link>
            <Link to="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse All</Link>
            <Link to="/charts" className="text-sm text-muted-foreground hover:text-primary transition-colors">Top Charts</Link>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-primary transition-colors">My Library</Link>
            <Link to="/creators" className="text-sm text-muted-foreground hover:text-primary transition-colors">Find Creators</Link>
          </nav>
        </div>

        {/* Community */}
        <div className="space-y-3">
          <h4 className="text-display text-sm tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> COMMUNITY
          </h4>
          <nav className="flex flex-col gap-2">
            <Link to="/community" className="text-sm text-muted-foreground hover:text-primary transition-colors">Feed</Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Publisher Dashboard</Link>
            <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">My Profile</Link>
            <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Settings</Link>
          </nav>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <h4 className="text-display text-sm tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> LEGAL
          </h4>
          <nav className="flex flex-col gap-2">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/content-guidelines" className="text-sm text-muted-foreground hover:text-primary transition-colors">Content Guidelines</Link>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          © 2026 Xtratoon. Made with <Heart className="w-3 h-3 text-primary fill-primary inline" /> by Akane Sakuramori.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/XtraToon.global"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            @XtraToon.global
          </a>
          <span className="text-muted-foreground/30">·</span>
          <a
            href="https://x.com/Xtratoonglobal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            @Xtratoonglobal
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

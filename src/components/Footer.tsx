import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, BookOpen, Users, Shield } from 'lucide-react';
import mascotImg from '@/assets/mascot-character.png';

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const floatKeyframes = `
@keyframes mascotFloat {
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
`;

const Footer: React.FC = () => (
  <footer className="relative border-t border-border bg-background overflow-hidden">
    <style>{floatKeyframes}</style>

    <div className="absolute top-4 right-4 sm:right-12 lg:right-24 z-10 pointer-events-none select-none">
      <div style={{ animation: 'mascotFloat 4s ease-in-out infinite' }}>
        <img src={mascotImg} alt="Komixora Mascot" className="w-20 sm:w-28 lg:w-32 drop-shadow-lg" loading="lazy" />
      </div>
    </div>

    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-[1]">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 space-y-4 pr-8">
          <Link to="/" className="inline-block">
            <span className="text-display text-3xl tracking-wider">
              <span className="font-normal">KOMI</span>
              <span className="text-primary">XORA</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Premium manhwa & manga from world-class creators. Discover, read, and publish stunning webtoons.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="https://instagram.com/komixora.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://t.me/komixora"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              aria-label="Join us on Telegram"
            >
              <TelegramIcon />
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
            <Link to="/blog/publish-on-komixora" className="text-sm text-muted-foreground hover:text-primary transition-colors">For Creators</Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Publisher Dashboard</Link>
            <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">My Profile</Link>
            <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Settings</Link>
          </nav>
        </div>

        {/* Legal & Resources */}
        <div className="space-y-3">
          <h4 className="text-display text-sm tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> RESOURCES
          </h4>
          <nav className="flex flex-col gap-2">
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            <Link to="/blog/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/content-guidelines" className="text-sm text-muted-foreground hover:text-primary transition-colors">Content Guidelines</Link>
            <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Disclaimer</Link>
            <Link to="/dmca" className="text-sm text-muted-foreground hover:text-primary transition-colors">DMCA Policy</Link>
            <Link to="/cookie-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          © 2026 Komixora — A division of <span className="font-semibold text-foreground">Xtratoon</span>.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/komixora.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            @komixora.fun
          </a>
          <span className="text-muted-foreground/30">·</span>
          <a
            href="https://t.me/komixora"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            t.me/komixora
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

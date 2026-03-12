import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const Footer: React.FC = () => (
  <footer className="border-t border-border bg-background pb-16 md:pb-0">
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1 space-y-3">
          <Link to="/">
            <span className="text-display text-2xl tracking-wider">
              <span className="font-normal">KOMI</span>
              <span className="text-primary">XORA</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Read manhwa, manga & webtoons from world-class creators. Free, HD, updated daily.
          </p>
          <div className="flex gap-2">
            <a href="https://instagram.com/komixora.fun" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/60 transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://t.me/komixora" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/60 transition-colors" aria-label="Telegram">
              <TelegramIcon />
            </a>
          </div>
        </div>

        {/* Discover */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discover</h4>
          <nav className="flex flex-col gap-1.5">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
            <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
            <Link to="/charts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Top Charts</Link>
            <Link to="/creators" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Creators</Link>
          </nav>
        </div>

        {/* Community */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community</h4>
          <nav className="flex flex-col gap-1.5">
            <Link to="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Feed</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Publish</Link>
          </nav>
        </div>

        {/* Legal */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
          <nav className="flex flex-col gap-1.5">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/dmca" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DMCA</Link>
            <Link to="/content-guidelines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guidelines</Link>
          </nav>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">© 2026 Komixora — by Xtratoon</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <a href="https://instagram.com/komixora.fun" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">@komixora.fun</a>
          <a href="https://t.me/komixora" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">t.me/komixora</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

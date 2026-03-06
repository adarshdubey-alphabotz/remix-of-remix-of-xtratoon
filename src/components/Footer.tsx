import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer: React.FC = () => (
  <footer className="border-t border-border bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <span className="text-display text-3xl tracking-wider">
            <span className="font-normal">XTRA</span>
            <span className="text-primary">TOON</span>
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Premium manhwa & manga from world-class creators. Discover, read, and publish stunning webtoons.
          </p>
          <div className="flex gap-2 pt-2">
            <a href="https://instagram.com/XtraToon.global" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300" aria-label="Follow us on Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://x.com/Xtratoonglobal" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300" aria-label="Follow us on X">
              <XIcon />
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-display text-lg tracking-wider">NAVIGATE</h4>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse</Link>
            <Link to="/charts" className="text-sm text-muted-foreground hover:text-primary transition-colors">Top Charts</Link>
            <Link to="/library" className="text-sm text-muted-foreground hover:text-primary transition-colors">My Library</Link>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="text-display text-lg tracking-wider">FOR CREATORS</h4>
          <nav className="flex flex-col gap-2">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Publisher Dashboard</Link>
            <span className="text-sm text-muted-foreground">Submit Your Work</span>
            <span className="text-sm text-muted-foreground">Creator Guidelines</span>
          </nav>
        </div>
        <div className="space-y-4">
          <h4 className="text-display text-lg tracking-wider">LEGAL</h4>
          <nav className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Terms of Service</span>
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">DMCA / Copyright</span>
            <span className="text-sm text-muted-foreground">Content Policy</span>
          </nav>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Xtratoon. All rights reserved. Created by Akane Sakuramori.</p>
        <div className="flex items-center gap-4">
          <a href="https://instagram.com/XtraToon.global" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">@XtraToon.global</a>
          <span className="text-muted-foreground/30">·</span>
          <a href="https://x.com/Xtratoonglobal" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">@Xtratoonglobal</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

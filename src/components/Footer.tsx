import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="border-t border-border bg-background pb-14 md:pb-0">
    <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-foreground text-xs">KOMI<span className="text-primary">XORA</span></span>
        <span>© 2026</span>
      </div>
      <nav className="flex items-center gap-3 flex-wrap justify-center">
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/dmca" className="hover:text-foreground transition-colors">DMCA</Link>
        <Link to="/content-guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <a href="https://t.me/komixora" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Telegram</a>
        <a href="https://instagram.com/komixora.fun" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
      </nav>
    </div>
  </footer>
);

export default Footer;

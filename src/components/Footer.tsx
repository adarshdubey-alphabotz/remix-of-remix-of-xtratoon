import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="border-t border-border bg-background pb-14 md:pb-0">
    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="text-display text-xs text-foreground">KOMI<span className="text-primary">XORA</span></span>
        <span>© 2026</span>
      </div>
      <nav className="flex items-center gap-2.5 flex-wrap justify-center">
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/dmca" className="hover:text-foreground transition-colors">DMCA</Link>
        <Link to="/about-us" className="hover:text-foreground transition-colors">About</Link>
        <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <Link to="/content-guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
        <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <a href="https://t.me/komixora" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Telegram</a>
      </nav>
    </div>
  </footer>
);

export default Footer;

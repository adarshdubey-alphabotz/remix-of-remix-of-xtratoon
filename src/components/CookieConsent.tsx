import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setShow(true);
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-card border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-sm">
        <p className="text-muted-foreground text-center sm:text-left flex-1">
          We use cookies including Google AdSense and Analytics cookies to improve your experience. By continuing you accept our{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Link to="/privacy" className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted/40 transition-colors">
            Learn More
          </Link>
          <button onClick={accept} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

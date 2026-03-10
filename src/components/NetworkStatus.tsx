import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

const NetworkStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 px-5 py-3 bg-destructive text-destructive-foreground rounded-xl shadow-2xl border border-destructive/50">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-semibold">You're offline</span>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg text-xs font-bold hover:bg-white/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    </div>
  );
};

export default NetworkStatus;

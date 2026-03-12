import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const VerifyEmailBanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const isVerified = user?.app_metadata?.email_verified === true;

  if (!user || isVerified || dismissed) return null;

  return (
    <div className="sticky top-14 z-40 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium truncate">
            Verify your email to unlock all features
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/verify')}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Verify Now
          </button>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-amber-500/20 rounded-md transition-colors">
            <X className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailBanner;

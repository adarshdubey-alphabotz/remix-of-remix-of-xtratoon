import React from 'react';
import { Ban, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BanNotice: React.FC = () => {
  const { profile } = useAuth();

  if (!profile || !profile.is_banned) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Ban className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="font-display text-3xl tracking-wider mb-3">ACCOUNT SUSPENDED</h1>
        <p className="text-muted-foreground mb-2">Your account has been suspended for violating our community guidelines.</p>
        {(profile as any).banned_reason && (
          <div className="brutal-card p-4 mb-4 text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
            <p className="text-sm font-medium">{(profile as any).banned_reason}</p>
          </div>
        )}
        <div className="brutal-card p-4 text-left border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Appeal this decision</p>
              <p className="text-xs text-muted-foreground mt-1">
                If you believe this was a mistake, you can submit an appeal by emailing us at{' '}
                <a href="mailto:admin@xtratoon.com" className="text-primary hover:underline font-semibold">
                  admin@xtratoon.com
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Include your username <strong>@{profile.username || 'N/A'}</strong> and explain why you think this decision should be reversed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanNotice;

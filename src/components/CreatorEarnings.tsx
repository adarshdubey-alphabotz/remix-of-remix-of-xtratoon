import React from 'react';
import { DollarSign, TrendingUp, Eye, Wallet, Calendar, BarChart3, Construction } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CreatorEarnings: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <Construction className="h-5 w-5 text-primary" />
        <AlertTitle className="text-base font-display tracking-wider">EARNINGS — COMING SOON</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground mt-1">
          This feature is not available yet. Please keep publishing your content — we'll implement the earnings and revenue tracking system very soon. You won't miss out on anything!
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-40 pointer-events-none select-none">
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Eye className="w-4 h-4" /> Total Unlocks
          </div>
          <div className="text-3xl font-display tracking-wider">—</div>
        </div>
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <DollarSign className="w-4 h-4" /> Total Revenue
          </div>
          <div className="text-3xl font-display tracking-wider text-primary">—</div>
        </div>
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <Wallet className="w-4 h-4" /> Your Share
          </div>
          <div className="text-3xl font-display tracking-wider">—</div>
        </div>
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
            <TrendingUp className="w-4 h-4" /> Platform
          </div>
          <div className="text-3xl font-display tracking-wider text-muted-foreground">—</div>
        </div>
      </div>

      <div className="brutal-card p-5 opacity-40 pointer-events-none select-none">
        <h3 className="font-display text-lg tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> UNLOCKS (LAST 7 DAYS)
        </h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Chart will appear here once the feature is live.
        </div>
      </div>

      <div className="brutal-card p-5 border-primary/30 opacity-40 pointer-events-none select-none">
        <h3 className="font-display text-lg tracking-wider mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> PAYOUT INFO
        </h3>
        <p className="text-sm text-muted-foreground">
          Payout details will be available once the earnings system is implemented.
        </p>
      </div>
    </div>
  );
};

export default CreatorEarnings;

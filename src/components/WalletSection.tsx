import React from 'react';
import { Wallet, ArrowLeft, Construction } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface WalletSectionProps {
  onBack: () => void;
}

const WalletSection: React.FC<WalletSectionProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3">
        <Wallet className="w-7 h-7 text-primary" />
        <h2 className="text-display text-3xl tracking-wider">WALLET</h2>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <Construction className="h-5 w-5 text-primary" />
        <AlertTitle className="text-base font-display tracking-wider">WALLET — COMING SOON</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground mt-1">
          This feature is not available yet. Please keep publishing your content — we'll implement wallet, payouts, and earnings tracking very soon. You won't miss out on anything!
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-40 pointer-events-none select-none">
        <div className="brutal-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Balance</p>
          <p className="text-2xl font-display tracking-wider">—</p>
        </div>
        <div className="brutal-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Earned</p>
          <p className="text-2xl font-display tracking-wider">—</p>
        </div>
        <div className="brutal-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pending Payouts</p>
          <p className="text-2xl font-display tracking-wider">—</p>
        </div>
      </div>
    </div>
  );
};

export default WalletSection;

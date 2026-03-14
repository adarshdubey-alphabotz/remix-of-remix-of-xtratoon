import React from 'react';
import { Link } from 'react-router-dom';
import DynamicMeta from '@/components/DynamicMeta';
import { Check, X, ArrowRight, Zap, DollarSign, Shield, Palette } from 'lucide-react';

const comparisons = [
  { feature: 'Free to publish', komixora: true, webtoon: true },
  { feature: 'No exclusivity contract', komixora: true, webtoon: false },
  { feature: '70% revenue share', komixora: true, webtoon: false },
  { feature: 'Keep your IP rights', komixora: true, webtoon: false },
  { feature: 'Fast approval (< 24h)', komixora: true, webtoon: false },
  { feature: 'Direct payout system', komixora: true, webtoon: true },
  { feature: 'Creator analytics', komixora: true, webtoon: true },
  { feature: 'Community posts', komixora: true, webtoon: true },
  { feature: 'Custom profile themes', komixora: true, webtoon: false },
  { feature: 'Telegram bot uploads', komixora: true, webtoon: false },
];

const benefits = [
  { icon: <Shield className="w-5 h-5" />, title: 'You own your work', desc: 'No exclusivity. Publish on Komixora and anywhere else simultaneously.' },
  { icon: <DollarSign className="w-5 h-5" />, title: 'Fair monetization', desc: '70/30 revenue split in your favor. Get paid directly via PayPal, Binance, or UPI.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Lightning-fast publishing', desc: 'Upload via web dashboard or Telegram bot. Chapters go live within hours.' },
  { icon: <Palette className="w-5 h-5" />, title: 'Creator-first platform', desc: 'Built by creators, for creators. Every feature is designed with your needs in mind.' },
];

const WebtoonAlternativePage: React.FC = () => (
  <div className="min-h-screen bg-background">
    <DynamicMeta
      title="Best Webtoon Alternative — Publish Manhwa Free | Komixora"
      description="Looking for a WEBTOON alternative? Komixora offers no exclusivity, 70% revenue share, full IP ownership, and a passionate reader community. Start publishing free."
    />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-display tracking-wider">
          Best WEBTOON Alternative for Manhwa Creators
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Keep your IP, earn more, and publish without exclusivity contracts. Komixora is the creator-friendly alternative.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Link to="/signup" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            Start Publishing Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/browse" className="px-6 py-3 border border-border rounded-xl text-sm font-medium hover:border-primary transition-colors">
            Explore Library
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-6">Komixora vs WEBTOON</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="px-4 py-3">Feature</div>
            <div className="px-4 py-3 text-center text-primary">Komixora</div>
            <div className="px-4 py-3 text-center">WEBTOON</div>
          </div>
          {comparisons.map((c, i) => (
            <div key={i} className={`grid grid-cols-3 text-sm ${i !== comparisons.length - 1 ? 'border-b border-border/50' : ''}`}>
              <div className="px-4 py-3">{c.feature}</div>
              <div className="px-4 py-3 flex justify-center">{c.komixora ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}</div>
              <div className="px-4 py-3 flex justify-center">{c.webtoon ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-6">Why Switch to Komixora</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="p-5 border border-border rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{b.icon}</div>
              <h3 className="font-bold">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-display tracking-wider">Make the switch today</h2>
        <p className="text-muted-foreground">No contracts. No lock-in. Just publish and earn.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export default WebtoonAlternativePage;

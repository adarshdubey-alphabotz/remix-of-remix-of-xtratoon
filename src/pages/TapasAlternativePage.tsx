import React from 'react';
import { Link } from 'react-router-dom';
import DynamicMeta from '@/components/DynamicMeta';
import { Check, X, ArrowRight, Zap, DollarSign, Users, Globe } from 'lucide-react';

const comparisons = [
  { feature: 'Free to publish', komixora: true, tapas: false },
  { feature: 'No exclusivity required', komixora: true, tapas: false },
  { feature: '70% creator revenue share', komixora: true, tapas: false },
  { feature: 'Instant approval process', komixora: true, tapas: false },
  { feature: 'Full analytics dashboard', komixora: true, tapas: true },
  { feature: 'Community features', komixora: true, tapas: true },
  { feature: 'Telegram upload support', komixora: true, tapas: false },
  { feature: 'Custom creator profiles', komixora: true, tapas: true },
  { feature: 'Direct payout system', komixora: true, tapas: true },
  { feature: 'No platform ads on content', komixora: true, tapas: false },
];

const benefits = [
  { icon: <Zap className="w-5 h-5" />, title: 'Publish in minutes', desc: 'Upload chapters via Telegram bot or dashboard. No lengthy review process.' },
  { icon: <DollarSign className="w-5 h-5" />, title: '70% revenue share', desc: 'Keep more of what you earn. Industry-leading creator compensation.' },
  { icon: <Users className="w-5 h-5" />, title: 'Growing community', desc: 'Access a passionate reader base hungry for new content.' },
  { icon: <Globe className="w-5 h-5" />, title: 'Global reach', desc: 'Readers from 100+ countries. Multi-language support coming soon.' },
];

const TapasAlternativePage: React.FC = () => (
  <div className="min-h-screen bg-background">
    <DynamicMeta
      title="Best Tapas Alternative for Manhwa & Manga Creators — Komixora"
      description="Looking for a Tapas alternative? Komixora offers free publishing, 70% revenue share, no exclusivity, and a growing community. Publish your manhwa today."
    />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-display tracking-wider">
          Best Tapas Alternative for Manga & Manhwa Creators
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tired of exclusivity contracts and low revenue shares? Komixora gives creators full control, better earnings, and a passionate community.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Link to="/signup" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            Start Publishing Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/browse" className="px-6 py-3 border border-border rounded-xl text-sm font-medium hover:border-primary transition-colors">
            Browse Content
          </Link>
        </div>
      </div>

      {/* Comparison */}
      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-6">Komixora vs Tapas</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="px-4 py-3">Feature</div>
            <div className="px-4 py-3 text-center text-primary">Komixora</div>
            <div className="px-4 py-3 text-center">Tapas</div>
          </div>
          {comparisons.map((c, i) => (
            <div key={i} className={`grid grid-cols-3 text-sm ${i !== comparisons.length - 1 ? 'border-b border-border/50' : ''}`}>
              <div className="px-4 py-3">{c.feature}</div>
              <div className="px-4 py-3 flex justify-center">{c.komixora ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}</div>
              <div className="px-4 py-3 flex justify-center">{c.tapas ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-6">Why Creators Choose Komixora</h2>
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

      {/* CTA */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-display tracking-wider">Ready to switch?</h2>
        <p className="text-muted-foreground">Join hundreds of creators already publishing on Komixora.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Create Your Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export default TapasAlternativePage;

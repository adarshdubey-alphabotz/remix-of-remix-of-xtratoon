import React from 'react';
import { Link } from 'react-router-dom';
import DynamicMeta from '@/components/DynamicMeta';
import { ArrowRight, Upload, BarChart3, DollarSign, Users, Smartphone, Shield } from 'lucide-react';

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up free and set up your creator profile in under 2 minutes.' },
  { num: '02', title: 'Upload your chapters', desc: 'Use the dashboard or our Telegram bot. Supports PNG, JPG, WebP up to 20MB per page.' },
  { num: '03', title: 'Get approved & go live', desc: 'Our team reviews submissions within 24 hours. Once approved, readers can find your work.' },
  { num: '04', title: 'Earn from your work', desc: 'Monetize via chapter unlocks. Cash out anytime via PayPal, Binance, UPI, or bKash.' },
];

const features = [
  { icon: <Upload className="w-5 h-5" />, title: 'Easy Publishing', desc: 'Drag-and-drop upload or Telegram bot for mobile creators.' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Real-time Analytics', desc: 'Track views, likes, bookmarks, and earnings per chapter.' },
  { icon: <DollarSign className="w-5 h-5" />, title: '70% Revenue Share', desc: 'Industry-leading creator compensation. You earn more.' },
  { icon: <Users className="w-5 h-5" />, title: 'Built-in Audience', desc: 'Readers discover your work through browse, search, and recommendations.' },
  { icon: <Smartphone className="w-5 h-5" />, title: 'Mobile-First Reader', desc: 'Your manhwa looks perfect on every device, automatically.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Content Protection', desc: 'Anti-piracy measures protect your work from unauthorized copying.' },
];

const PublishManhwaPage: React.FC = () => (
  <div className="min-h-screen bg-background">
    <DynamicMeta
      title="Publish Your Manhwa Free — Komixora Creator Platform"
      description="Publish your manhwa, manga, or webtoon on Komixora for free. Get 70% revenue share, real-time analytics, and access to a growing global reader community."
    />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-display tracking-wider">
          Publish Your Manhwa on Komixora
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Free to publish. No exclusivity. Keep your IP. Earn 70% of every unlock. Join the creator-first platform.
        </p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Start Publishing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Steps */}
      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-8">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(s => (
            <div key={s.num} className="p-5 border border-border rounded-xl space-y-2">
              <span className="text-3xl font-display text-primary/30">{s.num}</span>
              <h3 className="font-bold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xl font-display tracking-wider text-center mb-8">Creator Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 border border-border rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{f.icon}</div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-display tracking-wider">Your story deserves to be read</h2>
        <p className="text-muted-foreground">Sign up today and publish your first chapter in minutes.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
          Create Creator Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

export default PublishManhwaPage;

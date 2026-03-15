import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';

const AboutPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="About Komixora — Free Manhwa, Manga & Webtoon Platform"
      description="Komixora is the #1 platform to read manhwa, manga, and webtoons online for free. 100% revenue goes to creators. Learn about our mission."
      keywords="about Komixora, manhwa platform, free manga site, webtoon alternative, indie creator platform"
      url="https://komixora.fun/about"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">ABOUT <span className="text-primary">KOMIXORA</span></h1>
      <p className="text-sm text-muted-foreground mb-8">The platform where indie creators keep 100% of their revenue.</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">What is Komixora?</h2>
          <p>Komixora is a free online platform for reading and publishing manhwa, manga, webtoons, and digital comics. We connect passionate creators with millions of readers worldwide, offering HD-quality vertical-scroll reading across all genres.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">Our Mission</h2>
          <p>We believe creators deserve to keep what they earn. Unlike platforms that take 50–70% cuts, Komixora gives <strong>100% of ad revenue</strong> directly to creators. Readers unlock chapters by viewing a short ad — no paywalls, no subscriptions, no hidden fees.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">What Makes Us Different</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>100% revenue to creators</strong> — no platform commission</li>
            <li><strong>Global payouts</strong> — UPI, bKash, PayPal, Binance, USDT</li>
            <li><strong>Free for readers</strong> — ad-supported, no subscriptions</li>
            <li><strong>Creator-first tools</strong> — analytics, scheduled publishing, community posts</li>
            <li><strong>Fast approval</strong> — content reviewed within 24 hours</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">For Readers</h2>
          <p>Discover thousands of manhwa and manga series in Action, Romance, Fantasy, Isekai, and more. Follow your favorite creators, track your reading history, join community discussions, and get notified when new chapters drop.</p>
          <Link to="/browse" className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium mt-2">
            Browse All Series <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">For Creators</h2>
          <p>Publish your original manhwa, manga, or webtoon and start earning from day one. Our publisher dashboard gives you real-time analytics, payout tracking, chapter scheduling, and a direct line to your audience through community posts.</p>
          <Link to="/creators" className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium mt-2">
            Explore Creators <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">Contact</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>General:</strong> <a href="mailto:hello@komixora.fun" className="text-primary hover:underline">hello@komixora.fun</a></li>
            <li><strong>DMCA / Legal:</strong> <a href="mailto:dmca@komixora.fun" className="text-primary hover:underline">dmca@komixora.fun</a></li>
            <li><strong>Creator Support:</strong> <a href="mailto:creators@komixora.fun" className="text-primary hover:underline">creators@komixora.fun</a></li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default AboutPage;

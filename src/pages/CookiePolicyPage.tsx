import React from 'react';
import DynamicMeta from '@/components/DynamicMeta';
import { Link } from 'react-router-dom';

const CookiePolicyPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="Cookie Policy — Komixora"
      description="Learn how Komixora uses cookies and similar technologies."
      keywords="cookies, cookie policy, Komixora, tracking"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-6">
        COOKIE <span className="text-primary">POLICY</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Last updated: March 10, 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help us provide a better browsing experience by remembering your preferences and understanding how you use our platform.</p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Cookies We Use</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-foreground">Essential Cookies:</strong> Required for authentication, session management, and security. These cannot be disabled.</li>
            <li><strong className="text-foreground">Preference Cookies:</strong> Store your theme preferences (light/dark mode), reading settings, and language choices.</li>
            <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how users interact with Komixora to improve the platform.</li>
            <li><strong className="text-foreground">Advertising Cookies:</strong> Used by third-party ad networks to display relevant advertisements. These support our creator revenue model.</li>
          </ul>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Third-Party Cookies</h2>
          <p>We use third-party services that may set cookies, including ad networks and analytics providers. We do not control the cookies these services use. Please refer to their respective privacy policies.</p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Managing Cookies</h2>
          <p>You can control and delete cookies through your browser settings. Note that disabling essential cookies may affect your ability to use Komixora.</p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Local Storage</h2>
          <p>We also use browser local storage for features like reading progress, theme preferences, and terms acceptance. This data stays on your device and is not transmitted to our servers.</p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/privacy" className="text-primary hover:underline text-sm font-medium">Privacy Policy →</Link>
          <Link to="/terms" className="text-primary hover:underline text-sm font-medium">Terms of Service →</Link>
          <Link to="/disclaimer" className="text-primary hover:underline text-sm font-medium">Disclaimer →</Link>
        </div>
      </div>
    </div>
  </div>
);

export default CookiePolicyPage;

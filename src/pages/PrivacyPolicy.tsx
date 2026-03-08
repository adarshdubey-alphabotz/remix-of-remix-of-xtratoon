import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">PRIVACY <span className="text-primary">POLICY</span></h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> Email address, display name, username, avatar, and profile bio</li>
            <li><strong>Usage Data:</strong> Reading history, library selections, likes, bookmarks, and comments</li>
            <li><strong>Device Data:</strong> Browser type, operating system, IP address (for security)</li>
            <li><strong>Location Data:</strong> Country and timezone (if provided voluntarily)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and maintain the Platform and your account</li>
            <li>Personalize your reading experience and recommendations</li>
            <li>Send notifications about new chapters from followed creators</li>
            <li>Moderate content and enforce community guidelines</li>
            <li>Analyze usage patterns to improve the Platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">3. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Service providers that help operate the Platform (hosting, analytics)</li>
            <li>Law enforcement when required by law</li>
            <li>Other users: your public profile, comments, and published content are visible</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">4. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and row-level security policies on all database tables.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">5. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> View your data through your profile settings</li>
            <li><strong>Update:</strong> Edit your profile information at any time</li>
            <li><strong>Delete:</strong> Delete your account and all associated data permanently</li>
            <li><strong>Export:</strong> Contact us to request a copy of your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">6. Cookies</h2>
          <p>We use essential cookies and local storage to maintain your session, theme preference, and authentication state. We do not use tracking cookies for advertising.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">7. Children's Privacy</h2>
          <p>The Platform is not intended for children under 13. We do not knowingly collect data from children under 13. If we discover such data, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">8. Changes</h2>
          <p>We may update this policy. We will notify users of significant changes via the Platform or email.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">9. Contact</h2>
          <p>For privacy-related questions, reach us on <a href="https://instagram.com/XtraToon.global" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Instagram</a> or <a href="https://x.com/Xtratoonglobal" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">X (Twitter)</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;

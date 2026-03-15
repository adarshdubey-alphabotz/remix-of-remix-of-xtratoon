import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="Privacy Policy — Komixora"
      description="Read Komixora's Privacy Policy. Learn how we collect, use, and protect your data, including our use of Google AdSense, Google Analytics, and Umami Analytics."
      keywords="Komixora privacy policy, data privacy, Google AdSense privacy"
      url="https://komixora.fun/privacy"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">PRIVACY <span className="text-primary">POLICY</span></h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> Email address, display name, username, avatar, and profile bio</li>
            <li><strong>Usage Data:</strong> Reading history, library selections, likes, bookmarks, and comments</li>
            <li><strong>Device Data:</strong> Browser type, operating system, IP address (for security)</li>
            <li><strong>Analytics Data:</strong> Page views, session duration, country, device type (via Google Analytics and Umami Analytics)</li>
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
            <li>Serve advertisements through Google AdSense</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">3. Google AdSense Disclosure</h2>
          <p>We use <strong>Google AdSense</strong> to display advertisements on this Platform. Google AdSense uses cookies, including the <strong>DoubleClick cookie</strong>, to serve ads based on your prior visits to this website and other websites on the internet.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Google's use of the DoubleClick cookie enables it and its partners to serve ads based on your browsing activity</li>
            <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
            <li>You may also opt out of third-party vendor cookies by visiting <a href="https://www.aboutads.info/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">aboutads.info</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">4. Analytics</h2>
          <p>We use <strong>Google Analytics</strong> and <strong>Umami Analytics</strong> to understand how users interact with the Platform. Data collected includes page views, session duration, country, and device type. This data is used solely to improve the user experience and is not sold to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">5. Data Sharing</h2>
          <p><strong>We do not sell your personal data to third parties.</strong> We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google AdSense — for ad serving purposes (anonymized)</li>
            <li>Google Analytics — for usage analytics (anonymized)</li>
            <li>Cloud infrastructure providers — for hosting and database services</li>
            <li>Law enforcement — when required by applicable law</li>
            <li>Other users — your public profile, comments, and published content are visible</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">6. Cookies & Tracking</h2>
          <p>We use essential cookies and local storage for authentication, theme preferences, and session management. Google AdSense and Google Analytics may also place cookies on your device for ad targeting and analytics. See our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> for full details.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">7. GDPR Compliance (EU Users)</h2>
          <p>If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to access, rectify, erase, or restrict processing of your personal data. A cookie consent banner is displayed for first-time visitors. Contact us at <a href="mailto:privacy@komixora.fun" className="text-primary hover:underline">privacy@komixora.fun</a> to exercise your rights.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">8. CCPA Compliance (California Users)</h2>
          <p>If you are a California resident, you have the right under the California Consumer Privacy Act (CCPA) to know what personal data we collect, request its deletion, and opt out of the sale of personal data. We do not sell personal data. Contact us at <a href="mailto:privacy@komixora.fun" className="text-primary hover:underline">privacy@komixora.fun</a> to exercise your rights.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">9. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and row-level security policies on all database tables.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">10. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> View your data through your profile settings</li>
            <li><strong>Update:</strong> Edit your profile information at any time</li>
            <li><strong>Delete:</strong> Request account deletion from your settings</li>
            <li><strong>Export:</strong> Contact us to request a copy of your data</li>
            <li><strong>Opt-out:</strong> Opt out of personalized ads via Google Ads Settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">11. Children's Privacy</h2>
          <p>The Platform is not intended for children under 13. We do not knowingly collect data from children under 13. If we discover such data, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">12. Contact</h2>
          <p>For privacy-related questions, contact us at:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Privacy:</strong> <a href="mailto:privacy@komixora.fun" className="text-primary hover:underline">privacy@komixora.fun</a></li>
            <li><strong>General:</strong> <a href="mailto:hello@komixora.fun" className="text-primary hover:underline">hello@komixora.fun</a></li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;

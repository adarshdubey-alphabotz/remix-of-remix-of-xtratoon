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
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 9, 2026</p>

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
            <li>Serve advertisements through third-party ad networks</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">3. Third-Party Services Disclosure</h2>
          <p>We use the following third-party services to operate the Platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Adsterra (HilltopAds Media LTD):</strong> Third-party advertising provider used to serve banner advertisements on the Platform. Adsterra may use cookies, web beacons, and similar tracking technologies to serve ads based on your browsing activity. For more information, see <a href="https://adsterra.com/privacy-policy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Adsterra's Privacy Policy</a>.</li>
            <li><strong>Analytics:</strong> We use anonymized analytics to understand how users interact with the Platform. This data is used solely to improve the user experience.</li>
            <li><strong>Cloud Infrastructure:</strong> We use cloud-based database and authentication services to securely store user data, with encryption in transit and at rest.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">4. Advertisement Content Disclaimer</h2>
          <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-xl">
            <p className="font-semibold text-foreground mb-2">⚠️ Important Notice About Advertisements</p>
            <p>Advertisements displayed on this Platform are served by third-party ad networks (including Adsterra) and are <strong>not controlled, endorsed, or reviewed by Xtratoon</strong>. We are <strong>not responsible</strong> for the content of any advertisements, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Ads containing adult, explicit, or sexually suggestive content</li>
              <li>Ads promoting gambling, betting, or related services</li>
              <li>Ads containing nudity, violent imagery, or offensive material</li>
              <li>Ads for products or services of any nature served by third-party networks</li>
            </ul>
            <p className="mt-3">If you encounter an inappropriate advertisement, please report it to us immediately. We will take steps to block or request removal of the offending ad from our ad provider. However, we cannot guarantee complete control over third-party ad content at all times.</p>
            <p className="mt-2 font-medium text-foreground">By using this Platform, you acknowledge and accept that third-party advertisements may appear and that Xtratoon bears no liability for their content.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">5. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Service providers that help operate the Platform (hosting, analytics)</li>
            <li>Third-party advertising networks (Adsterra) for ad serving purposes</li>
            <li>Law enforcement when required by law</li>
            <li>Other users: your public profile, comments, and published content are visible</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">6. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and row-level security policies on all database tables.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">7. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> View your data through your profile settings</li>
            <li><strong>Update:</strong> Edit your profile information at any time</li>
            <li><strong>Export:</strong> Contact us to request a copy of your data</li>
            <li><strong>Opt-out:</strong> You may use ad-blocking software, though this may affect your experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">8. Cookies & Tracking</h2>
          <p>We use essential cookies and local storage to maintain your session, theme preference, and authentication state. Third-party ad providers (Adsterra) may also place cookies on your device for ad targeting and performance measurement. We do not use our own tracking cookies for advertising.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">9. Children's Privacy</h2>
          <p>The Platform is not intended for children under 13. We do not knowingly collect data from children under 13. If we discover such data, we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">10. Changes</h2>
          <p>We may update this policy. We will notify users of significant changes via the Platform or email.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">11. Contact</h2>
          <p>For privacy-related questions, reach us at:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Email:</strong> <a href="mailto:support@xtratoon.com" className="text-primary hover:underline">support@xtratoon.com</a></li>
            <li><strong>Instagram:</strong> <a href="https://instagram.com/XtraToon.global" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@XtraToon.global</a></li>
            <li><strong>X (Twitter):</strong> <a href="https://x.com/Xtratoonglobal" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@Xtratoonglobal</a></li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;

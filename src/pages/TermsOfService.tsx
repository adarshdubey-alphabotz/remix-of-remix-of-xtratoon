import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';

const TermsOfService: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="Terms of Service — Komixora"
      description="Read the Terms of Service for Komixora. Covers user accounts, content ownership, DMCA compliance, AdSense disclosure, and more."
      keywords="Komixora terms, terms of service, manhwa platform terms"
      url="https://komixora.fun/terms"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">TERMS OF <span className="text-primary">SERVICE</span></h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">1. Platform Overview & Acceptance</h2>
          <p>Komixora ("the Platform") is an online manhwa, manga, and webtoon reading and publishing platform operated at komixora.fun. By accessing or using the Platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">2. User Accounts & Eligibility</h2>
          <p>You must be at least 13 years old to create an account. Users under 18 must have parental consent. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">3. User-Generated Content Rules</h2>
          <p>Users may upload, post, and share content on the Platform. You agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload illegal, harmful, defamatory, obscene, or infringing content</li>
            <li>Post hate speech, threats, harassment, or discriminatory content</li>
            <li>Use bots or automated tools to inflate views, likes, or follows</li>
            <li>Redistribute, scrape, or pirate content from the Platform</li>
            <li>Impersonate other users, creators, or platform staff</li>
            <li>Upload content that violates our <Link to="/content-guidelines" className="text-primary hover:underline">Content Guidelines</Link></li>
          </ul>
          <p className="mt-2">Komixora reserves the right to remove any content that violates these Terms without prior notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">4. Creator Copyright Ownership</h2>
          <p><strong>Creators retain full ownership of their original content.</strong> By publishing on Komixora, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content on the Platform. This license exists solely for the purpose of operating the Platform and terminates when you remove your content.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">5. Prohibition on Copyrighted Content</h2>
          <p><strong>Uploading copyrighted manhwa, manga, webtoons, or any other creative work without explicit permission from the original rights holder is strictly prohibited.</strong> This includes but is not limited to: scanlations, fan translations of licensed works, reuploads from other platforms, and any content you do not have the legal right to publish.</p>
          <p className="mt-2">Violations will result in immediate content removal and may lead to permanent account termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">6. DMCA Compliance</h2>
          <p>Komixora complies with the Digital Millennium Copyright Act (DMCA). If you believe content on our Platform infringes your copyright, you may submit a takedown notice to <a href="mailto:dmca@komixora.fun" className="text-primary hover:underline">dmca@komixora.fun</a>. Your notice must include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your name and contact information</li>
            <li>Description of the copyrighted work</li>
            <li>URL of the infringing content on Komixora</li>
            <li>A good faith statement that the use is not authorized</li>
            <li>A statement under penalty of perjury that the information is accurate</li>
            <li>Your physical or electronic signature</li>
          </ul>
          <p className="mt-2">We will respond to valid DMCA notices within 72 hours. See our full <Link to="/dmca" className="text-primary hover:underline">DMCA Policy</Link> for counter-notice procedures.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">7. Advertising Disclosure (Google AdSense)</h2>
          <p>This Platform uses Google AdSense to display advertisements. Google AdSense uses cookies, including the DoubleClick cookie, to serve ads based on your browsing activity and interests. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          <p className="mt-2">The advertisements displayed on this Platform are served by third-party advertising networks and are not controlled, endorsed, or reviewed by Komixora. We are not responsible for the content of any third-party advertisements.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">8. Cookies</h2>
          <p>We use essential cookies and local storage for authentication, theme preferences, and session management. Third-party services (Google AdSense, Google Analytics, Umami Analytics) may also place cookies on your device. For more information, see our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">9. Account Termination</h2>
          <p>We may suspend or terminate your account at any time for violating these Terms, including but not limited to: uploading copyrighted content, engaging in harassment, using bots, or repeated violations of our Content Guidelines. Terminated accounts may lose access to all content and earnings.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">10. Limitation of Liability</h2>
          <p>The Platform is provided "as is" without warranties of any kind, express or implied. Komixora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to loss of revenue, data, or business opportunities.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">12. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. We will notify users of significant changes via the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">13. Contact</h2>
          <p>For questions about these Terms, contact us at:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Legal:</strong> <a href="mailto:legal@komixora.fun" className="text-primary hover:underline">legal@komixora.fun</a></li>
            <li><strong>DMCA:</strong> <a href="mailto:dmca@komixora.fun" className="text-primary hover:underline">dmca@komixora.fun</a></li>
            <li><strong>General:</strong> <a href="mailto:hello@komixora.fun" className="text-primary hover:underline">hello@komixora.fun</a></li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default TermsOfService;

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">TERMS OF <span className="text-primary">SERVICE</span></h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Komixora ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">2. Eligibility</h2>
          <p>You must be at least 13 years old to use the Platform. Users under 18 must have parental consent. By creating an account, you represent that you meet these requirements.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">3. User Accounts</h2>
          <p>You are responsible for maintaining the security of your account credentials. You agree to notify us immediately of any unauthorized access. Komixora is not liable for losses arising from unauthorized account use.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">4. Content & Intellectual Property</h2>
          <p>Creators retain ownership of their original content. By publishing on Komixora, you grant us a non-exclusive, worldwide license to display, distribute, and promote your content on the Platform. You must not upload content that infringes on third-party copyrights or trademarks.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">5. Prohibited Conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Uploading illegal, harmful, or infringing content</li>
            <li>Harassment, hate speech, or threats toward other users</li>
            <li>Attempting to reverse-engineer, hack, or disrupt the Platform</li>
            <li>Using bots or automated tools to inflate views, likes, or follows</li>
            <li>Redistributing or pirating content from Komixora</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">6. Content Moderation</h2>
          <p>Komixora reserves the right to remove any content that violates these terms or our Content Guidelines. Repeated violations may result in account suspension or permanent ban.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">7. Disclaimer of Warranties</h2>
          <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service or error-free operation.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">8. Limitation of Liability</h2>
          <p>Komixora shall not be liable for any indirect, incidental, or consequential damages arising from use of the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">9. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-2">10. Contact</h2>
          <p>For questions about these terms, reach us on <a href="https://instagram.com/komixora.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Instagram</a> or <a href="https://t.me/komixora" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Telegram</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsOfService;

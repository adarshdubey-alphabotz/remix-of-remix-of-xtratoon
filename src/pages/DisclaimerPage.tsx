import React from 'react';
import DynamicMeta from '@/components/DynamicMeta';
import { Link } from 'react-router-dom';
import { Shield, Building2, GraduationCap, Scale } from 'lucide-react';

const DisclaimerPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="Disclaimer — Komixora"
      description="Legal disclaimer for Komixora. Learn about our organizational structure, liability limitations, and legal notices."
      keywords="Komixora disclaimer, legal notice, liability"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-6">
        LEGAL <span className="text-primary">DISCLAIMER</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Last updated: March 10, 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="brutal-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Building2 className="w-5 h-5 text-primary" /> Organizational Structure
          </div>
          <p>
            <strong className="text-foreground">Komixora</strong> is a digital entertainment platform operated as a subdivision of <strong className="text-foreground">Xtratoon</strong>. Xtratoon is a sole proprietorship / individual venture and is <strong className="text-foreground">not a publicly listed company</strong>, registered corporation, or government entity.
          </p>
          <p>
            Xtratoon operates as an individual block (sole proprietor) and Komixora functions as one of its subdivisions focused on digital comic content distribution.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <GraduationCap className="w-5 h-5 text-primary" /> Nature of the Platform
          </div>
          <p>
            Komixora is an independent entertainment website created and maintained by students and independent developers. It is not backed by institutional investors, venture capital, or any government body.
          </p>
          <p>
            The platform is provided <strong className="text-foreground">"as-is"</strong> for entertainment purposes. We are a community-driven project that connects comic creators with readers globally.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Scale className="w-5 h-5 text-primary" /> Limitation of Liability
          </div>
          <ul className="list-disc ml-5 space-y-2">
            <li>Komixora and Xtratoon shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use of this platform.</li>
            <li>All content published on Komixora is created and uploaded by independent creators. Komixora acts only as a hosting platform and does not endorse or guarantee the accuracy of user-generated content.</li>
            <li>We do not provide investment, financial, or legal advice. Any revenue-related features (creator earnings) are estimates and subject to third-party ad network performance.</li>
            <li>The platform may contain third-party advertisements. We are not responsible for the content, accuracy, or practices of third-party advertisers.</li>
          </ul>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Shield className="w-5 h-5 text-primary" /> No Government Affiliation
          </div>
          <p>
            Komixora and Xtratoon are <strong className="text-foreground">not affiliated with any government department, regulatory body, or public institution</strong>. We operate entirely as a private, independent project.
          </p>
          <p>
            For any legal inquiries, please contact us at <a href="mailto:support@komixora.fun" className="text-primary hover:underline">support@komixora.fun</a>.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Intellectual Property</h2>
          <p>
            All original content, branding, and design elements of Komixora are the intellectual property of Xtratoon. User-generated content (comics, artwork) remains the property of their respective creators.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Changes to This Disclaimer</h2>
          <p>We reserve the right to update this disclaimer at any time. Changes will be posted on this page with an updated date.</p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/terms" className="text-primary hover:underline text-sm font-medium">Terms of Service →</Link>
          <Link to="/privacy" className="text-primary hover:underline text-sm font-medium">Privacy Policy →</Link>
          <Link to="/content-guidelines" className="text-primary hover:underline text-sm font-medium">Content Guidelines →</Link>
          <Link to="/dmca" className="text-primary hover:underline text-sm font-medium">DMCA Policy →</Link>
          <Link to="/cookie-policy" className="text-primary hover:underline text-sm font-medium">Cookie Policy →</Link>
        </div>
      </div>
    </div>
  </div>
);

export default DisclaimerPage;

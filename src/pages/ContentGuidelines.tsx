import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle, Ban } from 'lucide-react';

const ContentGuidelines: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">CONTENT <span className="text-primary">GUIDELINES</span></h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="space-y-8 text-muted-foreground leading-relaxed text-sm">
        <div className="brutal-card p-5 rounded-lg border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display tracking-wider text-foreground">Our Mission</h2>
          </div>
          <p>Komixora is a platform for creators to share original manhwa, manga, and webtoon content with a global audience. We are committed to fostering a safe, creative, and respectful community.</p>
        </div>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" /> What's Allowed
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Original content</strong> — Works you created or have legal rights to publish</li>
            <li><strong>Fan art</strong> — Clearly labeled as fan-created, with credit to original creators</li>
            <li><strong>Mature themes</strong> — Violence, drama, and mild suggestive content with appropriate genre tags</li>
            <li><strong>Multiple languages</strong> — Content in any supported language</li>
            <li><strong>Collaborations</strong> — Works created with consent of all contributors</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> Requires Review
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Content depicting graphic violence — must be tagged appropriately</li>
            <li>Horror/thriller with intense imagery — age-appropriate tagging required</li>
            <li>Politically sensitive content — must not promote extremism</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-3 flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" /> Strictly Prohibited
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pornography or explicit sexual content</strong></li>
            <li><strong>Content depicting minors in sexual situations</strong></li>
            <li><strong>Copyrighted content</strong> uploaded without permission</li>
            <li><strong>Hate speech</strong> targeting race, gender, religion, or orientation</li>
            <li><strong>Real-world violence promotion</strong> or terrorist content</li>
            <li><strong>Doxxing</strong> or sharing personal information of others</li>
            <li><strong>Spam, scams, or malware</strong></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-3">DMCA & Copyright</h2>
          <p>If you believe your copyrighted work is being used without authorization on Komixora, you may submit a DMCA takedown request by contacting us via our social channels with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Your contact information</li>
            <li>Description of the copyrighted work</li>
            <li>Link to the infringing content on Komixora</li>
            <li>A statement of good faith belief</li>
            <li>Your signature (electronic is accepted)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-display tracking-wider text-foreground mb-3">Enforcement</h2>
          <p>Violations may result in:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Content removal</strong> without notice</li>
            <li><strong>Account suspension</strong> (temporary or permanent)</li>
            <li><strong>IP ban</strong> for severe or repeated violations</li>
            <li><strong>Legal action</strong> when required</li>
          </ul>
        </section>

        <div className="brutal-card p-5 rounded-lg">
          <p className="text-xs">Questions or concerns? Reach us on <a href="https://instagram.com/XtraToon.global" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Instagram</a> or <a href="https://x.com/Xtratoonglobal" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">X (Twitter)</a>.</p>
        </div>
      </div>
    </div>
  </div>
);

export default ContentGuidelines;

import React from 'react';
import DynamicMeta from '@/components/DynamicMeta';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DMCAPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="DMCA Policy — Komixora"
      description="DMCA takedown policy for Komixora. Learn how to report copyright infringement and file a takedown notice."
      keywords="DMCA, copyright, takedown, Komixora, DMCA notice"
      url="https://komixora.fun/dmca"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-6">
        DMCA <span className="text-primary">POLICY</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="border border-border rounded-lg p-6 bg-card space-y-3">
          <h2 className="text-foreground font-semibold text-base">What is the DMCA?</h2>
          <p>The Digital Millennium Copyright Act (DMCA) is a United States copyright law that provides a process for copyright owners to request the removal of infringing material from online platforms. Komixora fully complies with the DMCA and respects the intellectual property rights of all creators.</p>
        </section>

        <section className="border border-border rounded-lg p-6 bg-card space-y-3">
          <h2 className="text-foreground font-semibold text-base">How to File a DMCA Takedown Notice</h2>
          <p>If you believe content on Komixora infringes your copyright, send a written notice to <a href="mailto:dmca@komixora.fun" className="text-primary hover:underline">dmca@komixora.fun</a> containing all of the following:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li><strong>Your name and contact information</strong> (full name, email address, phone number, mailing address)</li>
            <li><strong>Description of the copyrighted work</strong> that you claim has been infringed</li>
            <li><strong>URL(s) of the infringing content</strong> on Komixora with enough detail for us to locate it</li>
            <li><strong>A good faith statement</strong> that you believe the use is not authorized by the copyright owner, its agent, or the law</li>
            <li><strong>A statement under penalty of perjury</strong> that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
            <li><strong>Your physical or electronic signature</strong></li>
          </ol>
        </section>

        <section className="border border-border rounded-lg p-6 bg-card space-y-3">
          <h2 className="text-foreground font-semibold text-base">Response Time</h2>
          <p>We take copyright infringement seriously. <strong>We will respond to valid DMCA takedown notices within 72 hours.</strong> If the notice is valid, the infringing content will be removed promptly and the uploader will be notified.</p>
        </section>

        <section className="border border-border rounded-lg p-6 bg-card space-y-3">
          <h2 className="text-foreground font-semibold text-base">Counter-Notification</h2>
          <p>If you believe your content was removed by mistake or misidentification, you may submit a counter-notification to <a href="mailto:dmca@komixora.fun" className="text-primary hover:underline">dmca@komixora.fun</a> containing:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Your name, address, phone number, and email</li>
            <li>Identification of the content that was removed and its original location</li>
            <li>A statement under penalty of perjury that you have a good faith belief the content was removed by mistake</li>
            <li>A statement that you consent to jurisdiction of your local federal court</li>
            <li>Your physical or electronic signature</li>
          </ol>
          <p className="mt-2">Upon receiving a valid counter-notification, we will forward it to the original complainant and may restore the content within 10–14 business days unless the copyright owner files a court action.</p>
        </section>

        <section className="border border-border rounded-lg p-6 bg-card space-y-3">
          <h2 className="text-foreground font-semibold text-base">Repeat Infringer Policy</h2>
          <p>Komixora maintains a strict repeat infringer policy. Users who receive multiple valid DMCA takedown notices will have their accounts permanently terminated. Uploading pirated, scanlated, or stolen content is grounds for immediate and permanent ban.</p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/terms" className="text-primary hover:underline text-sm font-medium">Terms of Service →</Link>
          <Link to="/privacy" className="text-primary hover:underline text-sm font-medium">Privacy Policy →</Link>
          <Link to="/content-guidelines" className="text-primary hover:underline text-sm font-medium">Content Guidelines →</Link>
        </div>
      </div>
    </div>
  </div>
);

export default DMCAPage;

import React from 'react';
import DynamicMeta from '@/components/DynamicMeta';
import { Link } from 'react-router-dom';

const DMCAPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="DMCA Policy — Komixora"
      description="DMCA takedown policy for Komixora. Learn how to report copyright infringement."
      keywords="DMCA, copyright, takedown, Komixora"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-6">
        DMCA <span className="text-primary">POLICY</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Last updated: March 10, 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Copyright Infringement Notification</h2>
          <p>
            Komixora respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond to proper notifications of claimed copyright infringement.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">How to File a DMCA Takedown Notice</h2>
          <p>If you believe that content on Komixora infringes your copyright, please send a written notice to <a href="mailto:support@komixora.fun" className="text-primary hover:underline">support@komixora.fun</a> containing:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the infringing material with enough detail to locate it on our platform (e.g., URL or title).</li>
            <li>Your contact information (name, address, phone, email).</li>
            <li>A statement that you have a good faith belief the use is not authorized by the copyright owner.</li>
            <li>A statement under penalty of perjury that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner.</li>
          </ol>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Counter-Notification</h2>
          <p>
            If you believe your content was removed by mistake or misidentification, you may submit a counter-notification to <a href="mailto:admin@komixora.fun" className="text-primary hover:underline">admin@komixora.fun</a> with the required information under the DMCA.
          </p>
        </section>

        <section className="brutal-card p-6 space-y-3">
          <h2 className="text-foreground font-semibold text-base">Repeat Infringers</h2>
          <p>
            Komixora will terminate the accounts of users who are repeat copyright infringers. Uploading pirated or stolen content will result in a permanent ban.
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link to="/terms" className="text-primary hover:underline text-sm font-medium">Terms of Service →</Link>
          <Link to="/privacy" className="text-primary hover:underline text-sm font-medium">Privacy Policy →</Link>
          <Link to="/disclaimer" className="text-primary hover:underline text-sm font-medium">Disclaimer →</Link>
        </div>
      </div>
    </div>
  </div>
);

export default DMCAPage;

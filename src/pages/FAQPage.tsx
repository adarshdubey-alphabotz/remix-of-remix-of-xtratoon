import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';

const faqData = [
  { q: 'What is Komixora?', a: 'Komixora is a free online platform where you can read manhwa, manga, and webtoons in HD quality. We feature thousands of series across all genres with daily updates from creators worldwide.' },
  { q: 'Is Komixora free to use?', a: 'Yes! Komixora is completely free for readers. Chapters are unlocked by viewing a short ad, and 100% of that ad revenue goes directly to the creators.' },
  { q: 'How do creators earn money on Komixora?', a: 'Creators earn ad revenue generated when readers unlock their chapters. Payouts are processed monthly via PayPal, UPI (India), bKash (Bangladesh), Binance, and USDT.' },
  { q: 'How do I publish my manhwa on Komixora?', a: 'Create a publisher account, upload your chapters with cover art, and submit for review. Once approved, your series goes live and starts earning immediately.' },
  { q: 'What genres are available on Komixora?', a: 'Komixora offers series across all genres including Action, Romance, Fantasy, Isekai, Slice of Life, Horror, Comedy, Drama, Martial Arts, School Life, Sci-Fi, and many more.' },
  { q: 'Where can I read manhwa online for free?', a: 'You can read manhwa online for free on Komixora (komixora.fun). We offer thousands of manhwa, manga, and webtoon series in HD quality with daily updates.' },
  { q: 'How does the 100% revenue model work?', a: 'Readers unlock chapters by watching a short ad. 100% of ad revenue goes directly to the creator — no platform cuts, no hidden fees.' },
  { q: 'When do creators get paid?', a: 'Payouts are processed monthly. Earnings are sent within 5–7 business days via your preferred payment method.' },
  { q: 'What payment methods are supported for creators?', a: 'We support UPI (India), bKash (Bangladesh), PayPal (Global), Binance (Crypto), and USDT on TON network.' },
  { q: 'Is Komixora a legal manga site?', a: 'Yes. Komixora is a legal publishing platform. All content is uploaded by original creators or rights holders. We comply with DMCA and remove any infringing content promptly.' },
  { q: 'How is Komixora different from Tapas or WEBTOON?', a: 'Unlike Tapas and WEBTOON which take 50–70% of creator earnings, Komixora gives 100% of ad revenue to creators. We also support more payout methods including UPI, bKash, and crypto.' },
  { q: 'Can I read manhwa on mobile?', a: 'Yes! Komixora is fully responsive and works perfectly on mobile browsers. Our vertical-scroll reader is optimized for phone screens.' },
  { q: 'How do I report copyrighted content?', a: 'Send a DMCA takedown notice to dmca@komixora.fun with the URL of the infringing content and proof of ownership. We respond within 72 hours.' },
  { q: 'Do I need an account to read manhwa?', a: 'You can browse and discover series without an account, but creating a free account lets you track reading history, bookmark favorites, and follow creators.' },
  { q: 'What languages are supported?', a: 'Currently Komixora supports content in English, Korean, Japanese, and Hindi. We are expanding to more languages soon.' },
];

const FAQPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-16 bg-background">
    <DynamicMeta
      title="FAQ — Frequently Asked Questions"
      description="Find answers to common questions about reading manhwa on Komixora. Learn about our free reading model, creator earnings, payment methods, and more."
      keywords="Komixora FAQ, manhwa FAQ, how to read manhwa free, Komixora help, manhwa platform questions"
      url="https://komixora.fun/faq"
    />

    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <h1 className="text-display text-4xl sm:text-5xl tracking-wider mb-2">
        FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Everything you need to know about reading and publishing on Komixora.</p>

      <div className="space-y-3">
        {faqData.map((f, i) => (
          <details key={i} className="group border border-border rounded-lg bg-card overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-left font-medium text-sm text-foreground pr-4 list-none [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
              {f.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>Still have questions? Contact us at <a href="mailto:hello@komixora.fun" className="text-primary hover:underline">hello@komixora.fun</a></p>
      </div>
    </div>

    {/* FAQPage structured data */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a }
          }))
        })
      }}
    />
  </div>
);

export default FAQPage;

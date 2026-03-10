import React from 'react';

const SITE_URL = 'https://komixora.fun';
const SITE_NAME = 'Komixora';

const JsonLd: React.FC = () => (
  <>
    {/* WebSite with SearchAction (enables Google sitelinks search) */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "alternateName": ["Komixora", "komixora.fun"],
          "url": SITE_URL,
          "description": "Komixora is the #1 platform to read manhwa, manga, webtoons, and comics online for free. Discover trending series, follow top creators, and publish your own manhwa.",
          "inLanguage": "en",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${SITE_URL}/browse?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "sameAs": [
            "https://instagram.com/XtraToon.global",
            "https://x.com/Xtratoonglobal"
          ]
        })
      }}
    />

    {/* Organization */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": SITE_NAME,
          "alternateName": ["Komixora"],
          "url": SITE_URL,
          "logo": `${SITE_URL}/favicon.ico`,
          "description": "Premium manhwa, manga & webtoon publishing and reading platform. Read Korean manhwa, Japanese manga, and webtoons online in HD quality.",
          "sameAs": [
            "https://instagram.com/XtraToon.global",
            "https://x.com/Xtratoonglobal"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "url": SITE_URL
          },
          "foundingDate": "2026",
          "knowsAbout": [
            "Manhwa", "Manga", "Webtoon", "Comics", "Korean Comics",
            "Japanese Manga", "Webtoons", "Digital Comics", "Online Reading"
          ]
        })
      }}
    />

    {/* CollectionPage — helps Google understand content type */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Browse Manhwa & Manga — Komixora",
          "description": "Browse thousands of manhwa, manga, and webtoon series. Filter by genre, popularity, and latest releases on Komixora.",
          "url": `${SITE_URL}/browse`,
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL }
        })
      }}
    />

    {/* BreadcrumbList for site structure */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Browse Manhwa", "item": `${SITE_URL}/browse` },
            { "@type": "ListItem", "position": 3, "name": "Top Charts", "item": `${SITE_URL}/charts` },
            { "@type": "ListItem", "position": 4, "name": "Blog", "item": `${SITE_URL}/blog` },
            { "@type": "ListItem", "position": 5, "name": "Community", "item": `${SITE_URL}/community` },
          ]
        })
      }}
    />

    {/* Speakable — helps AI assistants (ChatGPT, Perplexity, Google AI) cite your content */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Komixora — Read Manhwa, Manga & Webtoons Online Free",
          "url": SITE_URL,
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".speakable"]
          },
          "mainEntity": {
            "@type": "ItemList",
            "name": "Popular Manhwa on Komixora",
            "description": "Top trending manhwa, manga and webtoon series available to read for free on Komixora.",
            "itemListOrder": "https://schema.org/ItemListOrderDescending",
            "numberOfItems": 500
          }
        })
      }}
    />

    {/* FAQPage for AI engines to extract answers */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is Komixora?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Komixora is a free online platform to read manhwa, manga, and webtoons in HD quality. It features thousands of series across all genres with daily updates from world-class creators."
              }
            },
            {
              "@type": "Question",
              "name": "Is Komixora free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Komixora is completely free for readers. Chapters are unlocked through a short ad view, and 100% of the ad revenue goes directly to the creators."
              }
            },
            {
              "@type": "Question",
              "name": "How do creators earn money on Komixora?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Creators earn 100% of ad revenue generated when readers unlock their chapters. Komixora takes zero platform cuts. Payouts are processed monthly via PayPal, UPI, bKash, Binance, and USDT."
              }
            },
            {
              "@type": "Question",
              "name": "How do I publish my manhwa on Komixora?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Create a publisher account on Komixora, upload your manhwa chapters with cover art, and submit for review. Once approved, your series goes live and starts earning from day one."
              }
            }
          ]
        })
      }}
    />
  </>
);

export default JsonLd;

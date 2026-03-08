import React from 'react';

const SITE_URL = 'https://glassy-ink-verse.lovable.app';
const SITE_NAME = 'Xtratoon';

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
          "alternateName": ["Xtratoons", "XtraToon", "Xtra Toon", "xtratoon.com"],
          "url": SITE_URL,
          "description": "Xtratoon is the #1 platform to read manhwa, manga, webtoons, and comics online for free. Discover trending series, follow top creators, and publish your own manhwa.",
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
          "alternateName": ["Xtratoons", "XtraToon"],
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
          "name": "Browse Manhwa & Manga — Xtratoon",
          "description": "Browse thousands of manhwa, manga, and webtoon series. Filter by genre, popularity, and latest releases on Xtratoon.",
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
  </>
);

export default JsonLd;

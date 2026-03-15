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
          "alternateName": ["Komixora", "komixora.fun", "Komixora Manhwa", "Komixora Manga"],
          "url": SITE_URL,
          "description": "Komixora is the #1 platform to read manhwa, manga, webtoons, and comics online for free. Discover trending series, follow top creators, and publish your own manhwa.",
          "inLanguage": "en",
          "potentialAction": [
            {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SITE_URL}/browse?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            },
            {
              "@type": "ReadAction",
              "target": `${SITE_URL}/browse`
            }
          ],
          "sameAs": [
            "https://instagram.com/komixora.fun",
            "https://t.me/komixora",
            "https://x.com/Xtratoonglobal"
          ]
        })
      }}
    />

    {/* Organization — enhanced with more structured data */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": SITE_NAME,
          "alternateName": ["Komixora", "Komixora.fun"],
          "url": SITE_URL,
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/favicon.ico`,
            "width": 512,
            "height": 512
          },
          "description": "Komixora is the best free manhwa, manga & webtoon reading platform. Read thousands of series in HD quality, follow top creators, and publish your own comics.",
          "sameAs": [
            "https://instagram.com/komixora.fun",
            "https://t.me/komixora",
            "https://x.com/Xtratoonglobal"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "support@komixora.fun",
            "url": SITE_URL
          },
          "foundingDate": "2026",
          "knowsAbout": [
            "Manhwa", "Manga", "Webtoon", "Comics", "Korean Comics",
            "Japanese Manga", "Webtoons", "Digital Comics", "Online Reading",
            "Read Manhwa Online", "Free Manga", "Manhwa Reader"
          ],
          "slogan": "Read Manhwa, Manga & Webtoons Online Free",
          "areaServed": "Worldwide"
        })
      }}
    />

    {/* WebApplication — helps Google understand this is a web app */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": SITE_NAME,
          "url": SITE_URL,
          "applicationCategory": "EntertainmentApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "500",
            "bestRating": "5"
          }
        })
      }}
    />

    {/* CollectionPage */}
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
            { "@type": "ListItem", "position": 6, "name": "Discover Manhwa", "item": `${SITE_URL}/discover` },
          ]
        })
      }}
    />

    {/* Speakable — helps AI assistants cite your content */}
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

  </>
);

export default JsonLd;

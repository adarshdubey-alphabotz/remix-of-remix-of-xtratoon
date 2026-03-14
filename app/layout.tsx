import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import Providers from '@/app/providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komixora.fun';
const SITE_NAME = 'Komixora';
const SITE_DESCRIPTION =
  'Read manhwa, manga, webtoons and comics online free on Komixora. 500+ series — action, romance, fantasy, isekai & martial arts. HD quality, daily updates. No subscription needed.';
const OG_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/fBX3qmXyGrXPWiSGlF9kHg13L552/social-images/social-1773130304984-1000327551.webp';

export const metadata: Metadata = {
  title: 'Read Manhwa, Manga & Webtoons Online Free — Komixora',
  description: SITE_DESCRIPTION,
  keywords: [
    'Komixora',
    'manhwa',
    'manga',
    'webtoon',
    'read manhwa online',
    'read manga online',
    'free manhwa',
    'free manga',
    'Korean comics',
    'Japanese manga',
    'webtoons',
    'comic reader',
    'action manhwa',
    'romance manhwa',
    'fantasy manhwa',
    'isekai manhwa',
  ],
  authors: [{ name: 'Komixora' }],
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Read Manhwa, Manga & Webtoons Online Free — Komixora',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Komixora — Free Manhwa, Manga & Webtoon Reader',
        type: 'image/webp',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Xtratoonglobal',
    creator: '@Xtratoonglobal',
    title: 'Read Manhwa, Manga & Webtoons Online Free — Komixora',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  applicationName: SITE_NAME,
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a1a1a',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Komixora',
              alternateName: ['Komixora Manga', 'Komixora Manhwa', 'Komixora Webtoon'],
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              inLanguage: 'en-US',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/browse?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Komixora',
              url: SITE_URL,
              logo: OG_IMAGE,
              sameAs: ['https://twitter.com/Xtratoonglobal'],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'Browse Manhwa & Manga on Komixora',
              description: 'Explore top manhwa, manga and webtoon categories on Komixora',
              url: `${SITE_URL}/browse`,
              itemListElement: [
                { '@type': 'SiteNavigationElement', position: 1, name: 'Browse Manhwa & Manga', url: `${SITE_URL}/browse` },
                { '@type': 'SiteNavigationElement', position: 2, name: 'Top Manga Charts', url: `${SITE_URL}/charts` },
                { '@type': 'SiteNavigationElement', position: 3, name: 'Community', url: `${SITE_URL}/community` },
                { '@type': 'SiteNavigationElement', position: 4, name: 'Manhwa Creators', url: `${SITE_URL}/creators` },
                { '@type': 'SiteNavigationElement', position: 5, name: 'Manga Blog', url: `${SITE_URL}/blog` },
              ],
            }),
          }}
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZVXWVDJDQG" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZVXWVDJDQG');
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}

// Sitemap generator utility for SEO
// This generates XML sitemap content that can be served at /sitemap.xml

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ''}${entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>\n` : ''}${entry.priority !== undefined ? `    <priority>${entry.priority}</priority>\n` : ''}  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((sm) => `  <sitemap>
    <loc>${escapeXml(sm.loc)}</loc>
${sm.lastmod ? `    <lastmod>${sm.lastmod}</lastmod>\n` : ''}  </sitemap>`).join('\n')}
</sitemapindex>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

// Helper to generate sitemap entries for static pages
export function getStaticPageEntries(): SitemapEntry[] {
  const baseUrl = 'https://komixora.fun';
  const today = new Date().toISOString().split('T')[0];

  return [
    { url: `${baseUrl}/`, priority: 1.0, changefreq: 'daily', lastmod: today },
    { url: `${baseUrl}/browse`, priority: 0.9, changefreq: 'daily', lastmod: today },
    { url: `${baseUrl}/creators`, priority: 0.8, changefreq: 'weekly', lastmod: today },
    { url: `${baseUrl}/announcements`, priority: 0.7, changefreq: 'weekly', lastmod: today },
    { url: `${baseUrl}/blog`, priority: 0.7, changefreq: 'daily', lastmod: today },
    { url: `${baseUrl}/community`, priority: 0.7, changefreq: 'daily', lastmod: today },
    { url: `${baseUrl}/charts`, priority: 0.7, changefreq: 'daily', lastmod: today },
    { url: `${baseUrl}/upcoming`, priority: 0.6, changefreq: 'weekly', lastmod: today },
    { url: `${baseUrl}/about`, priority: 0.5, changefreq: 'monthly', lastmod: today },
    { url: `${baseUrl}/contact`, priority: 0.5, changefreq: 'monthly', lastmod: today },
    { url: `${baseUrl}/privacy`, priority: 0.3, changefreq: 'yearly' },
    { url: `${baseUrl}/terms`, priority: 0.3, changefreq: 'yearly' },
  ];
}

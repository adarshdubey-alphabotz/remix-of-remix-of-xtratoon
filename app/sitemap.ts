import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komixora.fun';

async function getSitemapData() {
  const sitemap: MetadataRoute.Sitemap = [
    // Static pages
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/charts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/dmca`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Add dynamic manga/manhwa pages
  try {
    const { data: manga, error } = await supabase
      .from('manga')
      .select('id, updated_at')
      .eq('status', 'published')
      .limit(10000);

    if (!error && manga) {
      manga.forEach((item: any) => {
        sitemap.push({
          url: `${SITE_URL}/title/${item.id}`,
          lastModified: new Date(item.updated_at || new Date()),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (err) {
    console.error('Error fetching manga for sitemap:', err);
  }

  // Add blog pages
  try {
    const { data: blogs, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .limit(1000);

    if (!error && blogs) {
      blogs.forEach((item: any) => {
        sitemap.push({
          url: `${SITE_URL}/blog/${item.slug}`,
          lastModified: new Date(item.updated_at || new Date()),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (err) {
    console.error('Error fetching blog posts for sitemap:', err);
  }

  return sitemap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapData();
}

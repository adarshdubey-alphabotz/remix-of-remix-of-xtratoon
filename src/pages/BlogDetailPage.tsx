import React, { useEffect } from 'react';


import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Eye, ArrowLeft, Tag, Clock } from 'lucide-react';
import DynamicMeta from '@/components/DynamicMeta';
import ScrollReveal from '@/components/ScrollReveal';

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const readTime = (html: string) => {
  const text = html.replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
};

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog-detail', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      return data as any;
    },
    enabled: !!slug,
  });

  // Increment views
  useEffect(() => {
    if (!blog?.id) return;
    supabase.from('blogs' as any).update({ views: (blog.views || 0) + 1 } as any).eq('id', blog.id).then(() => {});
  }, [blog?.id]);

  // Related blogs
  const { data: related = [] } = useQuery({
    queryKey: ['blog-related', blog?.id],
    queryFn: async () => {
      if (!blog) return [];
      const { data } = await supabase
        .from('blogs' as any)
        .select('id, title, slug, thumbnail_url, created_at')
        .eq('is_published', true)
        .neq('id', blog.id)
        .order('created_at', { ascending: false })
        .limit(3);
      return (data || []) as any[];
    },
    enabled: !!blog,
  });

  if (isLoading) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!blog) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Article not found.</p></div>;

  const minutes = readTime(blog.content || '');

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <DynamicMeta
        title={blog.seo_title || blog.title}
        description={blog.seo_description || blog.description || ''}
        image={blog.thumbnail_url}
        keywords={(blog.seo_keywords || []).join(', ') + ', Komixora, komixora, manhwa, manga, webtoon'}
        url={`https://komixora.fun/blog/${blog.slug}`}
      />

      <article className="max-w-3xl mx-auto px-4" itemScope itemType="https://schema.org/BlogPosting">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <ScrollReveal>
          {/* Category badge */}
          {blog.is_faq && (
            <span className="inline-block mb-4 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">FAQ</span>
          )}

          <h1 className="text-display text-3xl sm:text-5xl tracking-wider mb-4 leading-tight" itemProp="headline">
            {blog.title.toUpperCase()}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5" itemProp="datePublished" content={blog.created_at}>
              <Calendar className="w-4 h-4" /> {formatDate(blog.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {minutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {blog.views || 0} views
            </span>
          </div>

          {blog.description && (
            <p className="text-muted-foreground text-base leading-relaxed mb-8 border-l-4 border-primary/30 pl-4 italic">
              {blog.description}
            </p>
          )}
        </ScrollReveal>

        {/* Thumbnail */}
        {blog.thumbnail_url && (
          <ScrollReveal>
            <div className="rounded-2xl overflow-hidden border border-border mb-10">
              <img src={blog.thumbnail_url} alt={blog.title} className="w-full object-cover max-h-[500px]" itemProp="image" />
            </div>
          </ScrollReveal>
        )}

        {/* Content */}
        <div
          className="prose prose-invert max-w-none blog-content"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Ad Banner after content */}
        

        {/* Tags */}
        {(blog.seo_keywords || []).length > 0 && (
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
            <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
            {(blog.seo_keywords as string[]).map(k => (
              <Link key={k} to={`/blog?tag=${k}`} className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                {k}
              </Link>
            ))}
          </div>
        )}

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": blog.is_faq ? "FAQPage" : "BlogPosting",
          "headline": blog.title,
          "description": blog.seo_description || blog.description,
          "image": blog.thumbnail_url,
          "datePublished": blog.created_at,
          "dateModified": blog.updated_at,
          "keywords": (blog.seo_keywords || []).join(', '),
          "publisher": { "@type": "Organization", "name": "Xtratoon" },
        })}} />

        

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="text-display text-2xl tracking-wider mb-6">MORE ARTICLES</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group brutal-card overflow-hidden">
                  {r.thumbnail_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-primary/5 flex items-center justify-center">
                      <span className="text-2xl font-display text-primary/15">BLOG</span>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{formatDate(r.created_at)}</p>
                    <h4 className="font-display text-sm tracking-wider group-hover:text-primary transition-colors line-clamp-2">{r.title.toUpperCase()}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogDetailPage;

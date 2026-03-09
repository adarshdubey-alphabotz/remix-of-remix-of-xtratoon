import React from 'react';
import AAdsBanner from '@/components/AAdsBanner';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Calendar, ArrowRight, Search, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/ScrollReveal';
import DynamicMeta from '@/components/DynamicMeta';

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const BlogListPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs' as any)
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const allTags = [...new Set(blogs.flatMap((b: any) => b.seo_keywords || []))].slice(0, 15);

  const filtered = blogs.filter((b: any) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || (b.seo_keywords || []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  const featuredBlog = filtered.find((b: any) => !b.is_faq);
  const restBlogs = filtered.filter((b: any) => b !== featuredBlog);

  return (
    <div className="min-h-screen pt-24 pb-32 bg-background">
      <DynamicMeta
        title="Blog — Manhwa News, Guides & FAQ"
        description="Read the latest Xtratoon blog posts — manhwa news, manga guides, FAQs, reading tips, and platform updates. Stay updated with Xtratoon."
        keywords="Xtratoon blog, xtratoons blog, manhwa blog, manga news, webtoon guides, manhwa FAQ, manga tips, Xtratoon news, Xtratoon updates, manhwa reading guide"
        url="https://xtratoon.com/blog"
      />
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-display text-5xl sm:text-7xl tracking-wider mb-4">
              OUR <span className="text-primary">BLOG</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
              News, guides, FAQs, and updates from the Xtratoon team.
            </p>
          </div>
        </ScrollReveal>

        {/* Search + Tags */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedTag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading articles...</div>
        ) : filtered.length === 0 ? (
          <div className="brutal-card p-12 text-center">
            <p className="text-muted-foreground">No articles found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured / Hero blog */}
            {featuredBlog && (
              <ScrollReveal>
                <Link to={`/blog/${featuredBlog.slug}`} className="group block">
                  <div className="brutal-card overflow-hidden grid md:grid-cols-2 gap-0">
                    {featuredBlog.thumbnail_url ? (
                      <div className="aspect-video md:aspect-auto relative overflow-hidden">
                        <img src={featuredBlog.thumbnail_url} alt={featuredBlog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-video md:aspect-auto bg-primary/10 flex items-center justify-center">
                        <span className="text-6xl font-display text-primary/20">BLOG</span>
                      </div>
                    )}
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(featuredBlog.created_at)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {featuredBlog.views || 0} views</span>
                      </div>
                      <h2 className="text-display text-2xl sm:text-3xl tracking-wider mb-3 group-hover:text-primary transition-colors">
                        {featuredBlog.title.toUpperCase()}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{featuredBlog.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Read More <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )}
            {/* Ad Banner between featured and grid */}
            <AAdsBanner className="my-6" />

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restBlogs.map((blog: any, i: number) => (
                <ScrollReveal key={blog.id}>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/blog/${blog.slug}`} className="group block brutal-card overflow-hidden h-full">
                      {blog.thumbnail_url ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img src={blog.thumbnail_url} alt={blog.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-primary/5 flex items-center justify-center">
                          <span className="text-3xl font-display text-primary/15">BLOG</span>
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(blog.created_at)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {blog.views || 0}</span>
                        </div>
                        {blog.is_faq && (
                          <span className="inline-block mb-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">FAQ</span>
                        )}
                        <h3 className="font-display text-lg tracking-wider group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title.toUpperCase()}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{blog.description}</p>
                        {(blog.seo_keywords || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(blog.seo_keywords as string[]).slice(0, 3).map(k => (
                              <span key={k} className="px-2 py-0.5 text-[10px] bg-muted rounded-full text-muted-foreground">{k}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;

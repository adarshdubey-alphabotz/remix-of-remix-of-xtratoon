import { useEffect } from 'react';

interface DynamicMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Dynamically sets OG meta tags and document title for better SEO/social sharing.
 * Restores defaults on unmount.
 */
const DynamicMeta: React.FC<DynamicMetaProps> = ({ title, description, image, url, type = 'article' }) => {
  useEffect(() => {
    const defaultTitle = 'Xtratoon — Premium Manhwa & Manga';
    const defaultDesc = 'Xtratoon is a premium manga and manhwa publishing and reading platform. Discover, read, and publish stunning webtoons.';

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          el.setAttribute('property', property);
        } else {
          el.setAttribute('name', property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (title) {
      document.title = `${title} — Xtratoon`;
      setMeta('og:title', `${title} — Xtratoon`);
      setMeta('twitter:title', `${title} — Xtratoon`);
    }

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description);
      setMeta('twitter:description', description);
    }

    if (image) {
      setMeta('og:image', image);
      setMeta('twitter:image', image);
      setMeta('twitter:card', 'summary_large_image');
    }

    if (url) {
      setMeta('og:url', url);
    }

    setMeta('og:type', type);

    return () => {
      document.title = defaultTitle;
      setMeta('og:title', defaultTitle);
      setMeta('twitter:title', defaultTitle);
      setMeta('description', defaultDesc);
      setMeta('og:description', defaultDesc);
      setMeta('twitter:description', defaultDesc);
    };
  }, [title, description, image, url, type]);

  return null;
};

export default DynamicMeta;

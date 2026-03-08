import { useEffect } from 'react';

interface DynamicMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const SITE = 'Xtratoon';
const DEFAULT_TITLE = `${SITE} — Read Manhwa, Manga & Webtoons Online Free | Premium Comics`;
const DEFAULT_DESC = 'Xtratoon is the #1 platform to read manhwa, manga, webtoons, and comics online for free. Discover trending series, follow top creators, and publish your own manhwa.';
const DEFAULT_KEYWORDS = 'Xtratoon, xtratoons, manhwa, manga, webtoon, read manhwa online, read manga online, free manhwa, Korean comics, Japanese manga, webtoons, comic reader, best manhwa, trending manga, manhwa platform, read comics free, HD manhwa, premium manhwa';

const DynamicMeta: React.FC<DynamicMetaProps> = ({ title, description, image, url, type = 'article', keywords }) => {
  useEffect(() => {
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

    const fullTitle = title ? `${title} — ${SITE}` : DEFAULT_TITLE;
    document.title = fullTitle;
    setMeta('og:title', fullTitle);
    setMeta('twitter:title', fullTitle);

    const desc = description || DEFAULT_DESC;
    setMeta('description', desc);
    setMeta('og:description', desc);
    setMeta('twitter:description', desc);

    setMeta('keywords', keywords || DEFAULT_KEYWORDS);

    if (image) {
      setMeta('og:image', image);
      setMeta('twitter:image', image);
      setMeta('twitter:card', 'summary_large_image');
    }

    if (url) {
      setMeta('og:url', url);
      // Update canonical
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonical) canonical.href = url;
    }

    setMeta('og:type', type);
    setMeta('og:site_name', SITE);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('og:title', DEFAULT_TITLE);
      setMeta('twitter:title', DEFAULT_TITLE);
      setMeta('description', DEFAULT_DESC);
      setMeta('og:description', DEFAULT_DESC);
      setMeta('twitter:description', DEFAULT_DESC);
      setMeta('keywords', DEFAULT_KEYWORDS);
    };
  }, [title, description, image, url, type, keywords]);

  return null;
};

export default DynamicMeta;

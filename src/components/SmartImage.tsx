import React, { useState, useCallback, useRef } from 'react';
import { getImageUrl, triggerImageCache } from '@/lib/imageUrl';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileId?: string | null;
  /** Already-resolved src (if you've called getImageUrl yourself) */
  src?: string;
  fallbackSrc?: string;
}

/**
 * Image component that loads from Storage CDN first.
 * If the image 404s (not cached yet), triggers background caching
 * via the proxy and retries once.
 */
const SmartImage: React.FC<SmartImageProps> = ({
  fileId,
  src: propSrc,
  fallbackSrc,
  alt = '',
  ...rest
}) => {
  const resolvedSrc = fileId ? getImageUrl(fileId) : propSrc;
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc || fallbackSrc || '');
  const retried = useRef(false);
  const originalFileId = useRef(fileId);

  const handleError = useCallback(() => {
    if (retried.current || !originalFileId.current) {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
      return;
    }
    retried.current = true;
    // Trigger caching in background, then retry
    triggerImageCache(originalFileId.current).then((url) => {
      if (url) {
        // Add cache-buster to force reload
        setCurrentSrc(url + '?t=' + Date.now());
      } else if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
    });
  }, [currentSrc, fallbackSrc]);

  if (!currentSrc) return null;

  return <img src={currentSrc} alt={alt} {...rest} onError={handleError} />;
};

export default SmartImage;

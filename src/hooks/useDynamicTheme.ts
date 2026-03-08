import { useEffect, useRef } from 'react';

/**
 * Extracts dominant color from an image URL and sets CSS custom properties
 * on the document root for dynamic theming per manhwa detail page.
 */
export function useDynamicTheme(imageUrl: string | null | undefined) {
  const prevColor = useRef<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    const cleanup = () => {
      document.documentElement.style.removeProperty('--dynamic-accent');
      document.documentElement.style.removeProperty('--dynamic-accent-muted');
      document.documentElement.style.removeProperty('--dynamic-glow');
      prevColor.current = null;
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const data = ctx.getImageData(0, 0, 64, 64).data;
        const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

        for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          // Skip very dark or very light pixels
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 225) continue;
          // Bucket by rounding
          const br = Math.round(r / 32) * 32;
          const bg = Math.round(g / 32) * 32;
          const bb = Math.round(b / 32) * 32;
          const key = `${br},${bg},${bb}`;
          if (!colorBuckets[key]) colorBuckets[key] = { r: 0, g: 0, b: 0, count: 0 };
          colorBuckets[key].r += r;
          colorBuckets[key].g += g;
          colorBuckets[key].b += b;
          colorBuckets[key].count++;
        }

        // Find most saturated dominant color
        let best = { r: 120, g: 80, b: 200, count: 0 };
        let bestScore = 0;
        for (const bucket of Object.values(colorBuckets)) {
          const avg = { r: bucket.r / bucket.count, g: bucket.g / bucket.count, b: bucket.b / bucket.count };
          const max = Math.max(avg.r, avg.g, avg.b);
          const min = Math.min(avg.r, avg.g, avg.b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const score = saturation * 0.6 + (bucket.count / 100) * 0.4;
          if (score > bestScore) {
            bestScore = score;
            best = { ...avg, count: bucket.count };
          }
        }

        const hsl = rgbToHsl(best.r, best.g, best.b);
        const accentHsl = `${hsl.h} ${Math.max(hsl.s, 40)}% ${Math.min(Math.max(hsl.l, 35), 55)}%`;
        const mutedHsl = `${hsl.h} ${Math.max(hsl.s * 0.5, 15)}% ${Math.min(hsl.l + 15, 70)}%`;
        const glowHsl = `${hsl.h} ${Math.max(hsl.s, 50)}% ${Math.min(hsl.l + 5, 50)}%`;

        document.documentElement.style.setProperty('--dynamic-accent', accentHsl);
        document.documentElement.style.setProperty('--dynamic-accent-muted', mutedHsl);
        document.documentElement.style.setProperty('--dynamic-glow', glowHsl);
        prevColor.current = accentHsl;
      } catch {
        // CORS or other error — skip
      }
    };

    return cleanup;
  }, [imageUrl]);
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

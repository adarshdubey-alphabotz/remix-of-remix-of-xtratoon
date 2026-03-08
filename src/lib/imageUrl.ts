/**
 * Resolve a cover/image URL.
 * - If the value is already an HTTP(S) URL, return it directly.
 * - Otherwise treat it as a Telegram file_id and build the **direct Storage CDN URL**.
 *   This avoids exposing the telegram-proxy edge function URL in the browser network tab.
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE = `https://${projectId}.supabase.co`;
const BUCKET = 'manga-images';

function sanitizeFileId(fileId: string): string {
  return fileId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;
  const safeName = sanitizeFileId(fileIdOrUrl);
  return `${BASE}/storage/v1/object/public/${BUCKET}/${safeName}`;
}

/**
 * Trigger caching of a Telegram file_id into Storage via the proxy.
 * Called in the background when a CDN URL 404s (image not yet cached).
 */
const cachingInFlight = new Set<string>();

export async function triggerImageCache(fileId: string): Promise<string | null> {
  if (cachingInFlight.has(fileId)) return null;
  cachingInFlight.add(fileId);
  try {
    const proxyUrl = `${BASE}/functions/v1/telegram-proxy?file_id=${encodeURIComponent(fileId)}&url_only=true`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      return data.url || getImageUrl(fileId);
    }
    return getImageUrl(fileId);
  } catch {
    return null;
  } finally {
    cachingInFlight.delete(fileId);
  }
}

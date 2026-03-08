/**
 * Resolve a cover/image URL.
 * - If the value is already an HTTP(S) URL, return it directly.
 * - Otherwise treat it as a Telegram file_id and return the direct
 *   Supabase Storage CDN URL (pre-cached via precache-images function).
 *   This avoids exposing the telegram-proxy endpoint in network requests.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = 'manga-images';

function sanitizeFileId(fileId: string): string {
  return fileId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;
  // Direct CDN URL — no proxy, no file_id leak in network tab
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${sanitizeFileId(fileIdOrUrl)}`;
}

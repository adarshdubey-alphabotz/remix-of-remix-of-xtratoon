/**
 * Resolve a cover/image URL.
 * - If the value is already an HTTP(S) URL, return it directly.
 * - Otherwise treat it as a Telegram file_id and build the proxy URL.
 *   The proxy will 302-redirect to the CDN-cached copy.
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;
  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?file_id=${encodeURIComponent(fileIdOrUrl)}`;
}

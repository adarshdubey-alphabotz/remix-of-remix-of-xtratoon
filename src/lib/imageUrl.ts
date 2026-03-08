/**
 * Resolve a cover/image URL.
 * - If the value is already an HTTP(S) URL, return it directly.
 * - Otherwise treat it as a Telegram file_id and route through the proxy.
 *   The proxy checks Storage CDN cache first (instant), falls back to Telegram.
 *   The file_id is base64-encoded so it's not plainly visible in network tab.
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;
  // Encode file_id so it's not plain text in network requests
  const encoded = btoa(fileIdOrUrl);
  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?t=${encodeURIComponent(encoded)}`;
}

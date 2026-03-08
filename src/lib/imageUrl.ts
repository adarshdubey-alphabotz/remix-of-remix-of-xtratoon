/**
 * Resolve a cover/image URL.
 * - If the value is already an HTTP(S) URL, return it directly.
 * - Otherwise treat it as a Telegram file_id and build the proxy URL.
 *   In production, uses /api/img rewrite to hide the Supabase URL.
 *   In dev/preview, calls the edge function directly.
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const isProd = import.meta.env.PROD;

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;

  const params = `file_id=${encodeURIComponent(fileIdOrUrl)}`;

  if (isProd) {
    // Vercel rewrite hides the real Supabase URL
    return `/api/img?${params}`;
  }

  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?${params}`;
}

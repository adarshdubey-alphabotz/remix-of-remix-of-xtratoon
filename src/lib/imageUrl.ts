/**
 * Resolve a cover/image URL.
 * 
 * For chapter pages: use page_id (never expose telegram_file_id)
 * For covers: use file_id through proxy
 * 
 * Supports optional size parameter for thumbnails:
 * - 'sm' = small thumbnail (for list views)
 * - 'md' = medium (for cards)
 * - undefined = original
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const isProd = import.meta.env.PROD;

/** Use for chapter pages — hides the telegram_file_id */
export function getPageImageUrl(pageId: string): string {
  const params = `page_id=${encodeURIComponent(pageId)}`;
  if (isProd) {
    return `/api/img?${params}`;
  }
  return `${supabaseUrl}/functions/v1/telegram-proxy?${params}`;
}

/** Use for covers/banners where we only have a file_id or http URL */
export function getImageUrl(fileIdOrUrl: string | null | undefined, size?: 'sm' | 'md'): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;

  const encodedId = encodeURIComponent(fileIdOrUrl);
  let params = `file_id=${encodedId}`;
  if (size) params += `&size=${size}`;

  if (isProd) {
    return `/api/img?${params}`;
  }

  return `${supabaseUrl}/functions/v1/telegram-proxy?${params}`;
}

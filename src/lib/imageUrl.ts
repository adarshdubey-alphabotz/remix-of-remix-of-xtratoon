/**
 * Resolve a cover/image URL.
 * 
 * For chapter pages: use page_id (never expose telegram_file_id)
 * For covers: use file_id through proxy
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const isProd = import.meta.env.PROD;

/** Use for chapter pages — hides the telegram_file_id */
export function getPageImageUrl(pageId: string): string {
  const params = `page_id=${encodeURIComponent(pageId)}`;
  if (isProd) {
    return `/api/img?${params}`;
  }
  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?${params}`;
}

/** Use for covers/banners where we only have a file_id or http URL */
export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;

  const encodedId = encodeURIComponent(fileIdOrUrl);
  const params = `file_id=${encodedId}`;

  if (isProd) {
    return `/api/img?${params}`;
  }

  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?${params}`;
}

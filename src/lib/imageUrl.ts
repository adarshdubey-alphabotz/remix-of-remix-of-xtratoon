/**
 * Resolve a cover/image URL.
 * 
 * Priority:
 * 1. If already an HTTP(S) URL → return as-is
 * 2. Use Supabase edge function (telegram-proxy) which caches to Storage
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const isProd = import.meta.env.PROD;

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

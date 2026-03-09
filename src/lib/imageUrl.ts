/**
 * Resolve a cover/image URL.
 * 
 * Priority:
 * 1. If already an HTTP(S) URL → return as-is
 * 2. If VITE_STREAM_BACKEND_URL is set → use VPS streaming backend
 * 3. Fallback to Supabase edge function (telegram-proxy)
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const isProd = import.meta.env.PROD;
const streamBackend = import.meta.env.VITE_STREAM_BACKEND_URL;

export function getImageUrl(fileIdOrUrl: string | null | undefined): string | null {
  if (!fileIdOrUrl) return null;
  if (fileIdOrUrl.startsWith('http')) return fileIdOrUrl;

  const encodedId = encodeURIComponent(fileIdOrUrl);

  // Use VPS streaming backend if configured
  if (streamBackend) {
    return `${streamBackend}/api/stream?file_id=${encodedId}`;
  }

  // Fallback: Supabase edge function
  const params = `file_id=${encodedId}`;

  if (isProd) {
    return `/api/img?${params}`;
  }

  return `https://${projectId}.supabase.co/functions/v1/telegram-proxy?${params}`;
}


-- Revoke full table SELECT from anon and authenticated
REVOKE SELECT ON public.chapter_pages FROM anon, authenticated;

-- Grant SELECT only on SAFE columns (excluding telegram_file_id)
GRANT SELECT (id, chapter_id, page_number, created_at, width, height, file_size) ON public.chapter_pages TO anon, authenticated;

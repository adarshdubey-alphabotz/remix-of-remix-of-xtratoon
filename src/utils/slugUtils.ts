import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a slug from a title
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens
 * - Remove leading/trailing hyphens
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

/**
 * Validate slug format
 */
export const isValidSlug = (slug: string): boolean => {
  if (!slug || slug.length === 0) return false;
  if (slug.length > 100) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

/**
 * Check if slug is unique in database
 */
export const isSlugUnique = async (
  slug: string,
  excludeMangaId?: string
): Promise<boolean> => {
  try {
    let query = supabase.from('manga').select('id', { count: 'exact', head: true }).eq('slug', slug);

    if (excludeMangaId) {
      query = query.neq('id', excludeMangaId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      return false;
    }

    return count === 0;
  } catch (err) {
    console.error('Error checking slug uniqueness:', err);
    return false;
  }
};

/**
 * Generate unique slug with fallback timestamp if needed
 */
export const generateUniqueSlug = async (title: string): Promise<string> => {
  let baseSlug = generateSlug(title);
  if (!baseSlug) baseSlug = 'untitled';

  let slug = baseSlug;
  let counter = 1;

  // Check uniqueness, add counter if needed
  while (!(await isSlugUnique(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

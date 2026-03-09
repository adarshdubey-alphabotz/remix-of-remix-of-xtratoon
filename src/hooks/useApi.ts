import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Type alias for manga from Supabase
export type Manga = Tables<'manga'> & {
  profiles?: { username: string | null; display_name: string | null } | null;
  chapters?: { chapter_number: number; created_at: string }[];
};

// Format view counts
export const formatViews = (n: number | null | undefined): string => {
  const num = n ?? 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

// Default cover gradient when no cover image
const coverGradients = [
  'gradient-cover-1', 'gradient-cover-2', 'gradient-cover-3', 'gradient-cover-4',
  'gradient-cover-5', 'gradient-cover-6', 'gradient-cover-7', 'gradient-cover-8',
  'gradient-cover-9', 'gradient-cover-10',
];

export const getCoverGradient = (index: number) => coverGradients[index % coverGradients.length];

// Helper to fetch manga with profile join
async function fetchMangaWithProfile(query: any) {
  const { data: mangaData, error } = await query;
  if (error) throw error;
  if (!mangaData || mangaData.length === 0) return [];

  // Get creator IDs
  const creatorIds = [...new Set(mangaData.map((m: any) => m.creator_id as string))].filter(Boolean);
  
  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, display_name')
    .in('user_id', creatorIds as string[]);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return mangaData.map((m: any) => ({
    ...m,
    profiles: profileMap.get(m.creator_id) || null,
  })) as Manga[];
}

// ---- Manga Queries ----
export const useFeaturedManga = () =>
  useQuery({
    queryKey: ['manga', 'featured'],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('is_featured', true)
        .eq('approval_status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(10);
      return fetchMangaWithProfile(query);
    },
  });

export const useLatestManga = (limit = 18) =>
  useQuery({
    queryKey: ['manga', 'latest', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const usePopularManga = (limit = 10) =>
  useQuery({
    queryKey: ['manga', 'popular', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('views', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const useTrendingManga = (limit = 10) =>
  useQuery({
    queryKey: ['manga', 'trending', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('views', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const useRisingManga = (limit = 10) =>
  useQuery({
    queryKey: ['manga', 'rising', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const useMostFollowed = (limit = 10) =>
  useQuery({
    queryKey: ['manga', 'most-followed', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('bookmarks', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const useMostLiked = (limit = 10) =>
  useQuery({
    queryKey: ['manga', 'most-liked', limit],
    queryFn: async () => {
      const query = supabase
        .from('manga')
        .select('*')
        .eq('approval_status', 'approved')
        .order('likes', { ascending: false })
        .limit(limit);
      return fetchMangaWithProfile(query);
    },
  });

export const useSearchManga = (params: { page?: number; limit?: number; search?: string; type?: string; status?: string; sort?: string; genre?: string }) =>
  useQuery({
    queryKey: ['manga', 'search', params],
    queryFn: async () => {
      let query = supabase
        .from('manga')
        .select('*', { count: 'exact' })
        .eq('approval_status', 'approved');

      if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.genre) {
        query = query.contains('genres', [params.genre]);
      }

      // Sorting
      if (params.sort === 'popular') {
        query = query.order('views', { ascending: false });
      } else if (params.sort === 'rating') {
        query = query.order('rating_average', { ascending: false });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch profiles for results
      const creatorIds = [...new Set((data || []).map((m: any) => m.creator_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', creatorIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const manga = (data || []).map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.creator_id) || null,
      })) as Manga[];

      return {
        manga,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      };
    },
  });

export const useMangaBySlug = (slug: string) =>
  useQuery({
    queryKey: ['manga', slug],
    queryFn: async () => {
      const { data: manga, error: mangaError } = await supabase
        .from('manga')
        .select('*')
        .eq('slug', slug)
        .single();
      if (mangaError) throw mangaError;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .eq('user_id', manga.creator_id)
        .single();

      // Fetch chapters
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, created_at, views, is_published')
        .eq('manga_id', manga.id)
        .order('chapter_number', { ascending: false });

      return {
        ...manga,
        profiles: profile || null,
        chapters: chapters || [],
      } as Manga & { chapters: any[] };
    },
    enabled: !!slug,
  });

// ---- Chapter Queries ----
export const useChapter = (mangaSlug: string, chapterNumber: number) =>
  useQuery({
    queryKey: ['chapter', mangaSlug, chapterNumber],
    queryFn: async () => {
      // First get manga by slug
      const { data: manga, error: mangaError } = await supabase
        .from('manga')
        .select('id, title, slug')
        .eq('slug', mangaSlug)
        .single();
      if (mangaError) throw mangaError;

      // Then get chapter
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', manga.id)
        .eq('chapter_number', chapterNumber)
        .single();
      if (chapterError) throw chapterError;

      // Get chapter pages
      const { data: pages } = await supabase
        .from('chapter_pages')
        .select('id, page_number')
        .eq('chapter_id', chapter.id)
        .order('page_number');

      // Get prev/next chapters
      const { data: chapters } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('manga_id', manga.id)
        .eq('is_published', true)
        .order('chapter_number');

      const chapterNumbers = (chapters || []).map(c => c.chapter_number);
      const currentIndex = chapterNumbers.indexOf(chapterNumber);

      return {
        ...chapter,
        chapter_pages: pages || [],
        manga,
        prevChapter: currentIndex > 0 ? chapterNumbers[currentIndex - 1] : null,
        nextChapter: currentIndex < chapterNumbers.length - 1 ? chapterNumbers[currentIndex + 1] : null,
      };
    },
    enabled: !!mangaSlug && !!chapterNumber,
  });

// ---- User Library ----
export const useLibrary = (status = 'all') =>
  useQuery({
    queryKey: ['library', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('user_library')
        .select('*, manga(*)')
        .eq('user_id', user.id);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAddToLibrary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mangaId, status }: { mangaId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_library')
        .upsert({
          user_id: user.id,
          manga_id: mangaId,
          status,
        }, { onConflict: 'user_id,manga_id' });

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
};

// ---- Reading History ----
export const useHistory = () =>
  useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('reading_history')
        .select('*, manga(*)')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      // Get chapter info separately
      const chapterIds = [...new Set((data || []).map(d => d.chapter_id))];
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, chapter_number')
        .in('id', chapterIds);
      const chapterMap = new Map((chapters || []).map(c => [c.id, c]));

      return (data || []).map(d => ({
        ...d,
        chapters: chapterMap.get(d.chapter_id) || null,
      }));
    },
  });

// ---- Creator Queries ----
export const useCreatorManga = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['creator', 'manga', params],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('manga')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('updated_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return { manga: data, total: count || 0 };
    },
  });

export const useCreatorStats = () =>
  useQuery({
    queryKey: ['creator', 'stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: manga, error: mangaError } = await supabase
        .from('manga')
        .select('id')
        .eq('creator_id', user.id);
      if (mangaError) throw mangaError;

      const mangaIds = (manga || []).map(m => m.id);
      let totalChapters = 0;

      if (mangaIds.length > 0) {
        const { count } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true })
          .in('manga_id', mangaIds);
        totalChapters = count || 0;
      }

      return {
        totalManga: manga?.length || 0,
        totalChapters,
      };
    },
  });

// ---- Admin Queries ----
export const useAdminManga = (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
  useQuery({
    queryKey: ['admin', 'manga', params],
    queryFn: async () => {
      let query = supabase
        .from('manga')
        .select('*', { count: 'exact' });

      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
      }
      if (params?.status) {
        query = query.eq('approval_status', params.status);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch profiles
      const creatorIds = [...new Set((data || []).map((m: any) => m.creator_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name')
        .in('user_id', creatorIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const manga = (data || []).map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.creator_id) || null,
      }));

      return { manga, total: count || 0 };
    },
  });

export const useAdminUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (params?.search) {
        query = query.or(`username.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return { users: data, total: count || 0 };
    },
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [mangaRes, usersRes, chaptersRes, reportsRes] = await Promise.all([
        supabase.from('manga').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        totalManga: mangaRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalChapters: chaptersRes.count || 0,
        reports: reportsRes.count || 0,
      };
    },
  });

export const useUpdateMangaStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('manga')
        .update({ approval_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'manga'] }),
  });
};

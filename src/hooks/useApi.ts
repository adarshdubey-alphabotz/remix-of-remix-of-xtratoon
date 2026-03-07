import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mangaApi, chapterApi, userApi, creatorApi, adminApi, type ApiManga } from '@/lib/api';

// ---- Manga Queries ----
export const useFeaturedManga = () =>
  useQuery({ queryKey: ['manga', 'featured'], queryFn: () => mangaApi.featured(), select: d => d.manga });

export const useLatestManga = (limit = 18) =>
  useQuery({ queryKey: ['manga', 'latest', limit], queryFn: () => mangaApi.latest(limit), select: d => d.manga });

export const usePopularManga = (limit = 10) =>
  useQuery({ queryKey: ['manga', 'popular', limit], queryFn: () => mangaApi.popular(limit), select: d => d.manga });

export const useTrendingManga = (limit = 10) =>
  useQuery({ queryKey: ['manga', 'trending', limit], queryFn: () => mangaApi.trending(limit), select: d => d.manga });

export const useRisingManga = (limit = 10) =>
  useQuery({ queryKey: ['manga', 'rising', limit], queryFn: () => mangaApi.rising(limit), select: d => d.manga });

export const useMostFollowed = (limit = 10) =>
  useQuery({ queryKey: ['manga', 'most-followed', limit], queryFn: () => mangaApi.mostFollowed(limit), select: d => d.manga });

export const useMostLiked = (limit = 10) =>
  useQuery({ queryKey: ['manga', 'most-liked', limit], queryFn: () => mangaApi.mostLiked(limit), select: d => d.manga });

export const useSearchManga = (params: { page?: number; limit?: number; search?: string; type?: string; status?: string; sort?: string; genre?: string }) =>
  useQuery({
    queryKey: ['manga', 'search', params],
    queryFn: () => mangaApi.search(params),
  });

export const useMangaBySlug = (slug: string) =>
  useQuery({
    queryKey: ['manga', slug],
    queryFn: () => mangaApi.getBySlug(slug),
    select: d => d.manga,
    enabled: !!slug,
  });

// ---- Chapter Queries ----
export const useChapter = (mangaSlug: string, chapterSlug: string) =>
  useQuery({
    queryKey: ['chapter', mangaSlug, chapterSlug],
    queryFn: () => chapterApi.get(mangaSlug, chapterSlug),
    select: d => d.chapter,
    enabled: !!mangaSlug && !!chapterSlug,
  });

// ---- User Queries ----
export const useLibrary = (status = 'all') =>
  useQuery({
    queryKey: ['library', status],
    queryFn: () => userApi.getLibrary(status),
    select: d => d.library,
  });

export const useHistory = () =>
  useQuery({
    queryKey: ['history'],
    queryFn: () => userApi.getHistory(),
    select: d => d.history,
  });

export const useAddToLibrary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mangaId, status }: { mangaId: string; status: string }) => userApi.addToLibrary(mangaId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
};

// ---- Creator Queries ----
export const useCreatorManga = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['creator', 'manga', params],
    queryFn: () => creatorApi.getManga(params),
  });

export const useCreatorStats = () =>
  useQuery({
    queryKey: ['creator', 'stats'],
    queryFn: () => creatorApi.getStats(),
    select: d => d.stats,
  });

// ---- Admin Queries ----
export const useAdminManga = (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
  useQuery({
    queryKey: ['admin', 'manga', params],
    queryFn: () => adminApi.getManga(params),
  });

export const useAdminUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    select: d => d.stats,
  });

export const useUpdateMangaStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateMangaStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'manga'] }),
  });
};

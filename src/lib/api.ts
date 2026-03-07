// ============================================
// API Service Layer — Xtratoon Backend
// Change this to your deployed backend URL
// ============================================
const API_BASE = 'http://localhost:3001/api';

// ---- Token Management ----
let authToken: string | null = localStorage.getItem('xtratoon_token');

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) localStorage.setItem('xtratoon_token', token);
  else localStorage.removeItem('xtratoon_token');
};

export const getToken = () => authToken;

// ---- Fetch Wrapper ----
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || `API Error ${res.status}`);
  }
  return res.json();
}

// ---- Types (matching backend responses) ----
export interface ApiManga {
  _id: string;
  id?: string;
  slug: string;
  title: string;
  alternativeTitles?: string[];
  description: string;
  cover: string;
  banner?: string | null;
  author?: string;
  artist?: string;
  genres: string[];
  themes?: string[];
  status: string;
  type: string;
  contentRating?: string;
  format?: string;
  readingDirection?: string;
  releaseYear?: number;
  ratingAverage?: number;
  ratingCount?: number;
  views: number;
  likes?: number;
  bookmarks?: number;
  commentCount?: number;
  approvalStatus?: string;
  isFeatured?: boolean;
  isEditorChoice?: boolean;
  creator?: { username: string; kofiId?: string; buymeacoffeeId?: string };
  latestChapters?: ApiChapterMeta[];
  trendingScore?: number;
  rank?: number;
  rankChange?: number;
  isNew?: boolean;
  updatedAt?: string;
  rating?: number;
}

export interface ApiChapterMeta {
  _id?: string;
  id?: string;
  chapterNumber: number;
  number?: number;
  title: string | null;
  createdAt?: string;
  date?: string;
  price?: number;
  freeAt?: string | null;
  views?: number;
  commentCount?: number;
}

export interface ApiChapter {
  id: string;
  chapterNumber: number;
  title: string | null;
  pages: { page: number; img: string }[];
  views: number;
  isPublished: boolean;
  price: number;
  freeAt: string | null;
  createdAt: string;
  manga: { title: string; slug: string };
  prevChapter: number | null;
  nextChapter: number | null;
}

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  coins?: number;
  xp?: number;
  level?: number;
  kofiId?: string | null;
  buymeacoffeeId?: string | null;
  createdAt?: string;
}

export interface ApiLibraryItem {
  id: string;
  slug: string;
  title: string;
  cover: string;
  libraryStatus: string;
  latestChapter?: number;
}

export interface ApiHistoryItem {
  id: string;
  page: number;
  readAt: string;
  manga: { id: string; slug: string; title: string; cover: string };
  chapter: { id: string; chapterNumber: number };
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ success: boolean; token: string; user: ApiUser }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    apiFetch<{ success: boolean; token: string; user: ApiUser }>('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, email, password }),
    }),

  me: () => apiFetch<{ success: boolean; user: ApiUser }>('/auth/me'),

  updateProfile: (data: Partial<{ username: string; avatar: string; kofiId: string; buymeacoffeeId: string }>) =>
    apiFetch<{ success: boolean; user: ApiUser }>('/auth/profile', {
      method: 'PUT', body: JSON.stringify(data),
    }),
};

// ---- Manga ----
export const mangaApi = {
  featured: () =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>('/manga/featured'),

  latest: (limit = 18) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/latest?limit=${limit}`),

  popular: (limit = 10) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/popular?limit=${limit}`),

  trending: (limit = 10) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/trending?limit=${limit}`),

  rising: (limit = 10) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/rising?limit=${limit}`),

  mostFollowed: (limit = 10) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/most-followed?limit=${limit}`),

  mostLiked: (limit = 10) =>
    apiFetch<{ success: boolean; manga: ApiManga[] }>(`/manga/most-liked?limit=${limit}`),

  search: (params: { page?: number; limit?: number; search?: string; type?: string; status?: string; sort?: string; genre?: string }) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    if (params.sort) qs.set('sort', params.sort);
    return apiFetch<{ success: boolean; manga: ApiManga[]; total: number; page: number; pages: number }>(`/manga?${qs.toString()}`);
  },

  getBySlug: (slug: string) =>
    apiFetch<{ success: boolean; manga: ApiManga }>(`/manga/${slug}`),

  recordView: (slug: string, deviceId: string) =>
    apiFetch<{ message: string }>(`/manga/${slug}/view`, {
      method: 'POST', body: JSON.stringify({ deviceId }),
    }),
};

// ---- Chapters ----
export const chapterApi = {
  get: (mangaSlug: string, chapterSlug: string) =>
    apiFetch<{ success: boolean; chapter: ApiChapter }>(`/chapter/${mangaSlug}/${chapterSlug}`),
};

// ---- User ----
export const userApi = {
  getHistory: () =>
    apiFetch<{ success: boolean; history: ApiHistoryItem[] }>('/user/history'),

  saveHistory: (mangaId: string, chapterId: string, page: number) =>
    apiFetch<{ success: boolean }>('/user/history', {
      method: 'POST', body: JSON.stringify({ mangaId, chapterId, page }),
    }),

  clearHistory: () =>
    apiFetch<{ success: boolean }>('/user/history', { method: 'DELETE' }),

  getLibrary: (status = 'all') =>
    apiFetch<{ success: boolean; library: ApiLibraryItem[] }>(`/user/library?status=${status}`),

  addToLibrary: (mangaId: string, status: string) =>
    apiFetch<{ success: boolean }>(`/user/library/${mangaId}`, {
      method: 'POST', body: JSON.stringify({ status }),
    }),

  getProfile: (username: string) =>
    apiFetch<{ user: ApiUser & { stats: { libraryCount: number } } }>(`/user/${username}`),
};

// ---- Creator ----
export const creatorApi = {
  getManga: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    return apiFetch<{ success: boolean; manga: ApiManga[]; total: number }>(`/creator/manga?${qs.toString()}`);
  },

  createManga: (data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; manga: ApiManga }>('/creator/manga', {
      method: 'POST', body: JSON.stringify(data),
    }),

  updateManga: (id: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; manga: ApiManga }>(`/creator/manga/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),

  deleteManga: (id: string) =>
    apiFetch<{ success: boolean }>(`/creator/manga/${id}`, { method: 'DELETE' }),

  getChapters: (mangaId: string) =>
    apiFetch<{ success: boolean; chapters: ApiChapterMeta[] }>(`/creator/manga/${mangaId}/chapter`),

  uploadChapter: (mangaId: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>(`/creator/manga/${mangaId}/chapter`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  deleteChapter: (mangaId: string, chapterId: string) =>
    apiFetch<{ success: boolean }>(`/creator/manga/${mangaId}/chapter?chapterId=${chapterId}`, { method: 'DELETE' }),

  getStats: () =>
    apiFetch<{ success: boolean; stats: { totalManga: number; totalChapters: number } }>('/creator/stats'),
};

// ---- Admin ----
export const adminApi = {
  getManga: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    return apiFetch<{ success: boolean; manga: ApiManga[]; total: number }>(`/admin/manga?${qs.toString()}`);
  },

  updateMangaStatus: (id: string, approvalStatus: string) =>
    apiFetch<{ success: boolean }>(`/admin/manga/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ approvalStatus }),
    }),

  deleteManga: (id: string) =>
    apiFetch<{ success: boolean }>(`/admin/manga?id=${id}`, { method: 'DELETE' }),

  getUsers: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    return apiFetch<{ success: boolean; users: ApiUser[]; total: number }>(`/admin/users?${qs.toString()}`);
  },

  updateUserRole: (id: string, role: string) =>
    apiFetch<{ success: boolean }>('/admin/users', {
      method: 'PUT', body: JSON.stringify({ id, role }),
    }),

  deleteUser: (id: string) =>
    apiFetch<{ success: boolean }>(`/admin/users?id=${id}`, { method: 'DELETE' }),

  getStats: () =>
    apiFetch<{ success: boolean; stats: { totalManga: number; totalUsers: number; totalChapters: number; todayViews: number; reports: number } }>('/admin/stats'),
};

// ---- Helpers ----
export const formatViews = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

// Default cover gradient when no cover image
const coverGradients = [
  'gradient-cover-1', 'gradient-cover-2', 'gradient-cover-3', 'gradient-cover-4',
  'gradient-cover-5', 'gradient-cover-6', 'gradient-cover-7', 'gradient-cover-8',
  'gradient-cover-9', 'gradient-cover-10',
];

export const getCoverGradient = (index: number) => coverGradients[index % coverGradients.length];

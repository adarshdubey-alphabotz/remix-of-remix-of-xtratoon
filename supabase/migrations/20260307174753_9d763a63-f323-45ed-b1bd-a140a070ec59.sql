
-- Manga table
CREATE TABLE public.manga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  cover_url text,
  banner_url text,
  genres text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'ONGOING',
  language text DEFAULT 'Korean',
  approval_status text NOT NULL DEFAULT 'PENDING',
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  bookmarks bigint DEFAULT 0,
  rating_average numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chapters table
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_number int NOT NULL,
  title text,
  views bigint DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manga_id, chapter_number)
);

-- Chapter pages - stores Telegram file IDs
CREATE TABLE public.chapter_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  telegram_file_id text NOT NULL,
  width int,
  height int,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, page_number)
);

-- User library
CREATE TABLE public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reading',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Reading history
CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number int DEFAULT 1,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Updated_at triggers
CREATE TRIGGER update_manga_updated_at BEFORE UPDATE ON public.manga
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_library_updated_at BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Manga policies
CREATE POLICY "Anyone can view approved manga" ON public.manga FOR SELECT USING (approval_status = 'APPROVED' OR creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can insert own manga" ON public.manga FOR INSERT WITH CHECK (auth.uid() = creator_id AND public.has_role(auth.uid(), 'publisher'));
CREATE POLICY "Creators can update own manga" ON public.manga FOR UPDATE USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete own manga" ON public.manga FOR DELETE USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- Chapters policies
CREATE POLICY "Anyone can view chapters of approved manga" ON public.chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.manga m WHERE m.id = manga_id AND (m.approval_status = 'APPROVED' OR m.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can insert chapters" ON public.chapters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.manga m WHERE m.id = manga_id AND m.creator_id = auth.uid())
);
CREATE POLICY "Creators can update own chapters" ON public.chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.manga m WHERE m.id = manga_id AND (m.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can delete own chapters" ON public.chapters FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.manga m WHERE m.id = manga_id AND (m.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Chapter pages policies
CREATE POLICY "Anyone can view pages of approved manga" ON public.chapter_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chapters c JOIN public.manga m ON m.id = c.manga_id WHERE c.id = chapter_id AND (m.approval_status = 'APPROVED' OR m.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Creators can insert pages" ON public.chapter_pages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.chapters c JOIN public.manga m ON m.id = c.manga_id WHERE c.id = chapter_id AND m.creator_id = auth.uid())
);
CREATE POLICY "Creators can delete own pages" ON public.chapter_pages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.chapters c JOIN public.manga m ON m.id = c.manga_id WHERE c.id = chapter_id AND (m.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Library policies
CREATE POLICY "Users can view own library" ON public.user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own library" ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own library" ON public.user_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from library" ON public.user_library FOR DELETE USING (auth.uid() = user_id);

-- History policies
CREATE POLICY "Users can view own history" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for manga
ALTER PUBLICATION supabase_realtime ADD TABLE public.manga;

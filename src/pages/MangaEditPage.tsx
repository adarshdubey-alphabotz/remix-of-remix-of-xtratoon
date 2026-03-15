import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X, Image, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { generateSlug, isValidSlug, isSlugUnique } from '@/utils/slugUtils';

const allGenres = [
  'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Mystery', 'Horror', 'Slice of Life', 'Adventure', 'Historical', 'School',
];

const MangaEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [manga, setManga] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [status, setStatus] = useState('ONGOING');
  const [language, setLanguage] = useState('Korean');
  const [isNsfw, setIsNsfw] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Slug management
  const [slugIsAuto, setSlugIsAuto] = useState(true);
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [slugValidating, setSlugValidating] = useState(false);

  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load manga data
  useEffect(() => {
    const loadManga = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('manga')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Check authorization: only creator and admins can edit
        if (data.creator_id !== user.id) {
          const profile = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile.data?.role !== 'admin') {
            toast.error('You can only edit your own manga');
            navigate('/dashboard');
            return;
          }
        }

        setManga(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setGenres(data.genres || []);
        setStatus(data.status || 'ONGOING');
        setLanguage(data.language || 'Korean');
        setIsNsfw(data.is_nsfw || false);
        setSlugIsAuto(data.slug_is_auto_generated !== false);
        setSlug(data.slug);

        // Extract custom tags from genres (ones that aren't in allGenres)
        const genreList = data.genres || [];
        const custom = genreList.filter((g: string) => !allGenres.includes(g));
        setCustomTags(custom);

        // Set cover preview from URL if exists
        if (data.cover_url) {
          setCoverPreview(data.cover_url);
        }
      } catch (err: any) {
        console.error('Error loading manga:', err);
        toast.error(err.message || 'Failed to load manga');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadManga();
  }, [id, user, navigate]);

  // Auto-generate slug when title changes and auto mode is on
  useEffect(() => {
    if (slugIsAuto && title) {
      const generatedSlug = generateSlug(title) + '-' + Date.now().toString(36);
      setSlug(generatedSlug);
      setSlugError('');
    }
  }, [title, slugIsAuto]);

  // Validate slug in real-time when manual
  useEffect(() => {
    if (!slugIsAuto && slug) {
      const validateSlug = async () => {
        setSlugValidating(true);

        if (!isValidSlug(slug)) {
          setSlugError('Slug must be lowercase, contain only letters, numbers, and hyphens');
          setSlugValidating(false);
          return;
        }

        const isUnique = await isSlugUnique(slug, id);
        if (!isUnique) {
          setSlugError('This slug is already taken');
        } else {
          setSlugError('');
        }

        setSlugValidating(false);
      };

      validateSlug();
    }
  }, [slug, slugIsAuto, id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const toggleGenre = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manga || !user) return;

    // Validation
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!slugIsAuto && slugError) {
      toast.error(slugError);
      return;
    }

    setSaving(true);

    try {
      let coverUrl = manga.cover_url;

      // Upload new cover if provided
      if (coverFile) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Not authenticated');
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

        const coverForm = new FormData();
        coverForm.append('type', 'cover');
        coverForm.append('manga_id', manga.id);
        coverForm.append('cover', coverFile);

        const coverRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/telegram-upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: coverForm,
          }
        );

        const coverResult = await coverRes.json();
        if (!coverResult.success) {
          console.error('Cover upload failed:', coverResult.error);
          toast.error('Cover upload failed, but manga details will be saved');
        }
      }

      // Combine genres with custom tags
      const allGenresList = [
        ...genres,
        ...customTags.filter(t => !genres.includes(t)),
      ];

      // Update manga
      const { error } = await supabase
        .from('manga')
        .update({
          title,
          slug: slugIsAuto ? slug : slug,
          description,
          genres: allGenresList,
          status,
          language,
          is_nsfw: isNsfw,
          slug_is_auto_generated: slugIsAuto,
        })
        .eq('id', manga.id);

      if (error) throw error;

      toast.success('Manga details updated successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error saving manga:', err);
      toast.error(err.message || 'Failed to save manga');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen pt-28 pb-12 px-4 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Manga not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-display text-3xl tracking-wider">EDIT MANGA</h1>
            <p className="text-sm text-muted-foreground">{manga.title}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="brutal-card p-8 space-y-6">
          {/* Cover */}
          <div>
            <label className="text-sm font-semibold block mb-2">Cover Image</label>
            <label className="border-2 border-dashed border-foreground p-6 text-center hover:border-primary transition-colors cursor-pointer block">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-24 h-36 object-cover mx-auto border border-foreground/20"
                />
              ) : (
                <>
                  <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload new cover</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Slug Management */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slugIsAuto}
                  onChange={e => setSlugIsAuto(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm font-semibold">Auto-generate slug from title</span>
              </label>
            </div>

            <div className="pl-6">
              {slugIsAuto ? (
                <div className="p-3 bg-muted border border-foreground/10 rounded text-sm text-muted-foreground">
                  <span className="font-mono">{slug}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase())}
                    className={`w-full px-3 py-2.5 bg-background border-2 text-sm focus:outline-none transition-colors ${
                      slugError
                        ? 'border-destructive focus:border-destructive'
                        : 'border-foreground focus:border-primary'
                    }`}
                    placeholder="my-manga-slug"
                  />
                  {slugValidating && (
                    <p className="text-xs text-muted-foreground">Validating...</p>
                  )}
                  {slugError && (
                    <p className="text-xs text-destructive">{slugError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only. No spaces.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Description / Synopsis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Status & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary"
              >
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="HIATUS">Hiatus</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Language</label>
              <input
                type="text"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                placeholder="e.g. Korean, Japanese, English"
                className="w-full px-3 py-2.5 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Content Rating */}
          <div>
            <label className="text-sm font-semibold block mb-2">Content Rating</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNsfw(false)}
                className={`px-4 py-2.5 text-sm font-bold border-2 transition-all ${
                  !isNsfw
                    ? 'border-green-500 bg-green-500/10 text-green-600'
                    : 'border-foreground/20 text-muted-foreground hover:border-foreground'
                }`}
              >
                All Ages
              </button>
              <button
                type="button"
                onClick={() => setIsNsfw(true)}
                className={`px-4 py-2.5 text-sm font-bold border-2 transition-all ${
                  isNsfw
                    ? 'border-red-500 bg-red-500/10 text-red-600'
                    : 'border-foreground/20 text-muted-foreground hover:border-foreground'
                }`}
              >
                🔞 NSFW / 18+
              </button>
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="text-sm font-semibold block mb-2">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {allGenres.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-2.5 py-1 text-xs border transition-all font-medium ${
                    genres.includes(g)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-foreground/20 hover:border-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              Custom Tags <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tag = tagInput.trim().toLowerCase();
                    if (tag && !customTags.includes(tag) && customTags.length < 10) {
                      setCustomTags(prev => [...prev, tag]);
                      setTagInput('');
                    }
                  }
                }}
                className="flex-1 px-3 py-2 bg-background border-2 border-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Type a tag and press Enter"
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => {
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !customTags.includes(tag) && customTags.length < 10) {
                    setCustomTags(prev => [...prev, tag]);
                    setTagInput('');
                  }
                }}
                className="px-3 py-2 text-xs font-bold border-2 border-foreground hover:border-primary transition-colors"
              >
                Add
              </button>
            </div>
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-primary bg-primary/10 text-primary font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setCustomTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-3 border-2 border-foreground rounded-none text-sm font-bold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (slugError && !slugIsAuto)}
              className="flex-1 btn-accent rounded-none py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MangaEditPage;

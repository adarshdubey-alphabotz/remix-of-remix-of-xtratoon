import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Calendar, BookOpen, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DynamicMeta from '@/components/DynamicMeta';

interface ChapterDetail {
  id: string;
  manga_id: string;
  chapter_number: number;
  title: string | null;
  description: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  pages_count?: number;
}

interface MangaInfo {
  id: string;
  title: string;
  slug: string;
}

const ChapterDetailsPage: React.FC = () => {
  const { id: chapterId, mangaId } = useParams<{ id: string; mangaId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch chapter details
  const { data: chapter, isLoading: chapterLoading, error: chapterError } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) throw new Error('Chapter ID required');
      
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          id, manga_id, chapter_number, title, description, status, scheduled_at, created_at,
          chapter_pages(count)
        `)
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return {
        ...data,
        pages_count: data.chapter_pages?.[0]?.count || 0,
      } as ChapterDetail;
    },
    enabled: !!chapterId,
  });

  // Fetch manga info
  const { data: manga, isLoading: mangaLoading } = useQuery({
    queryKey: ['manga-for-chapter', chapter?.manga_id],
    queryFn: async () => {
      if (!chapter?.manga_id) return null;

      const { data, error } = await supabase
        .from('manga')
        .select('id, title, slug')
        .eq('id', chapter.manga_id)
        .single();

      if (error) throw error;
      return data as MangaInfo;
    },
    enabled: !!chapter?.manga_id,
  });

  // Update chapter mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<ChapterDetail>) => {
      if (!chapterId) throw new Error('Chapter ID required');
      
      const { error } = await supabase
        .from('chapters')
        .update({
          title: updates.title,
          description: updates.description,
        })
        .eq('id', chapterId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Chapter updated successfully');
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update chapter');
    },
  });

  const handleSaveChanges = () => {
    updateMutation.mutate({
      title: editTitle,
      description: editDescription,
    });
  };

  const handleStartEdit = () => {
    if (chapter) {
      setEditTitle(chapter.title || '');
      setEditDescription(chapter.description || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Check if user owns this chapter
  const isOwner = chapter && manga && user;

  if (chapterLoading || mangaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading chapter details...</p>
        </div>
      </div>
    );
  }

  if (chapterError || !chapter || !manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-foreground">Chapter not found</h2>
          <p className="text-sm text-muted-foreground">
            {chapterError ? 'Failed to load chapter details' : 'The chapter you're looking for doesn't exist'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicMeta
        title={`Chapter ${chapter.chapter_number} — ${manga.title}`}
        description={`Read and manage ${manga.title} Chapter ${chapter.chapter_number}`}
      />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="space-y-2">
            <Link
              to={`/title/${manga.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
            >
              {manga.title}
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Chapter {chapter.chapter_number}
              {chapter.title && ` — ${chapter.title}`}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chapter Metadata */}
            <div className="border border-border rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Chapter Details</h2>
                {isOwner && (
                  <button
                    onClick={isEditing ? handleCancel : handleStartEdit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isEditing
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Title (Optional)</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="E.g., The Secret Revealed"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Description (Optional)</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="What happens in this chapter..."
                      rows={5}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveChanges}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex-1"
                    >
                      <Save className="w-4 h-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-muted text-foreground font-semibold rounded-lg text-sm hover:bg-muted/80 transition-colors flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapter.title && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Title</label>
                      <p className="text-foreground">{chapter.title}</p>
                    </div>
                  )}
                  {chapter.description && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Description</label>
                      <p className="text-foreground whitespace-pre-wrap">{chapter.description}</p>
                    </div>
                  )}
                  {!chapter.title && !chapter.description && (
                    <p className="text-sm text-muted-foreground italic">No additional details provided</p>
                  )}
                </div>
              )}
            </div>

            {/* Pages Info */}
            <div className="border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Pages</h3>
              <div className="flex items-center gap-3 text-foreground">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">{chapter.pages_count}</span>
                <span className="text-muted-foreground">{chapter.pages_count === 1 ? 'page' : 'pages'}</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <p className="text-foreground font-semibold capitalize">
                    {chapter.status || 'Draft'}
                  </p>
                </div>
                {chapter.scheduled_at && (
                  <div>
                    <label className="text-xs text-muted-foreground">Scheduled For</label>
                    <p className="text-foreground font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(chapter.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates Card */}
            <div className="border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Published</h3>
              <p className="text-foreground text-sm">
                {new Date(chapter.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Actions */}
            {isOwner && (
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/publisher`)}
                  className="w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterDetailsPage;

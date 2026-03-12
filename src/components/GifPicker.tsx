import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const TENOR_API_KEY = 'AIzaSyA3rMEqMHhnQjQ0e2MXx8e3y7WBDP2t3Gs'; // Free public Tenor API key
const TENOR_CLIENT_KEY = 'komixora';

interface GifResult {
  id: string;
  url: string; // tinygif URL for preview
  fullUrl: string; // gif URL for posting
}

interface Props {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

const GifPicker: React.FC<Props> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<GifResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load trending on mount
  useEffect(() => {
    inputRef.current?.focus();
    fetchTrending();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => searchGifs(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const parseResults = (data: any): GifResult[] => {
    return (data?.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.tinygif?.url || r.media_formats?.nanogif?.url || '',
      fullUrl: r.media_formats?.gif?.url || r.media_formats?.mediumgif?.url || '',
    })).filter((g: GifResult) => g.url);
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&contentfilter=high&media_filter=gif,tinygif,nanogif&limit=20`
      );
      const data = await res.json();
      setTrending(parseResults(data));
    } catch {}
  };

  const searchGifs = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&contentfilter=high&media_filter=gif,tinygif,nanogif&limit=20`
      );
      const data = await res.json();
      setResults(parseResults(data));
    } catch {}
    setLoading(false);
  };

  const gifs = query.trim() ? results : trending;

  return (
    <div className="border border-border rounded-xl bg-card shadow-lg overflow-hidden w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-border/30">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-8 pr-3 py-1.5 bg-muted/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/40 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Grid */}
      <div className="h-[220px] overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            {query.trim() ? 'No GIFs found' : 'Loading...'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {gifs.map(gif => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.fullUrl)}
                className="rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all aspect-video bg-muted/20"
              >
                <img src={gif.url} alt="GIF" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Powered by Tenor */}
      <div className="px-2 py-1 border-t border-border/30 text-[10px] text-muted-foreground text-center">
        Powered by Tenor
      </div>
    </div>
  );
};

export default GifPicker;

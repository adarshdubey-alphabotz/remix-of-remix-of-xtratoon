import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <div className="text-6xl font-bold text-primary">404</div>
          <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Browse Manga
          </Link>
        </div>
      </div>
    </div>
  );
}

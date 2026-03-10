import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AuthModal from "@/components/AuthModal";
import PageTransition from "@/components/PageTransition";
import SpotlightSearch from "@/components/SpotlightSearch";
import ErrorBoundary from "@/components/ErrorBoundary";
import BanNotice from "@/components/BanNotice";
import OnboardingModal from "@/components/OnboardingModal";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import NetworkStatus from "@/components/NetworkStatus";
import { lazy, Suspense, useEffect } from "react";

// Lazy-loaded route components — each becomes its own JS chunk
const Index = lazy(() => import("./pages/Index"));
const ManhwaDetail = lazy(() => import("./pages/ManhwaDetail"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const TopChartsPage = lazy(() => import("./pages/TopChartsPage"));
const PublisherProfile = lazy(() => import("./pages/PublisherProfile"));
const PublisherDashboard = lazy(() => import("./pages/PublisherDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const MyLibrary = lazy(() => import("./pages/MyLibrary"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SearchCreators = lazy(() => import("./pages/SearchCreators"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const MyPostsPage = lazy(() => import("./pages/MyPostsPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ContentGuidelines = lazy(() => import("./pages/ContentGuidelines"));
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const DMCAPage = lazy(() => import("./pages/DMCAPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 30000,
    },
  },
});

const AntiPiracy = () => {
  useEffect(() => {
    // Disable right-click
    const ctxHandler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', ctxHandler);

    // Detect DevTools via debugger timing
    let devToolsOpen = false;
    const checkDevTools = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      const end = performance.now();
      if (end - start > 100 && !devToolsOpen) {
        devToolsOpen = true;
      }
    };
    const devToolsInterval = setInterval(checkDevTools, 2000);

    // Disable common screenshot shortcuts
    const keyHandler = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') { e.preventDefault(); }
      // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+U (View Source)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); }
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); }
      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); }
      // Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); }
    };
    document.addEventListener('keydown', keyHandler);

    // Disable drag on images
    const dragHandler = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'CANVAS' || (e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('dragstart', dragHandler);

    return () => {
      document.removeEventListener('contextmenu', ctxHandler);
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('dragstart', dragHandler);
      clearInterval(devToolsInterval);
    };
  }, []);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Track SPA page views in Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', 'G-ZVXWVDJDQG', { page_path: pathname });
    }
  }, [pathname]);
  return null;
};

const ReaderErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-4">
    <div className="text-center space-y-4 max-w-md">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
        <span className="text-3xl">💥</span>
      </div>
      <h2 className="text-xl font-bold text-white">Reader crashed</h2>
      <p className="text-sm text-white/50">Something went wrong while loading the chapter. This could be a temporary issue.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Reload Page</button>
        <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm">Go Back</button>
      </div>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <>
      <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/about" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/manhwa/:id" element={<PageTransition><ManhwaDetail /></PageTransition>} />
          <Route path="/read/:id/:chapter" element={<PageTransition><ErrorBoundary fallback={<ReaderErrorFallback />}><ReaderPage /></ErrorBoundary></PageTransition>} />
          <Route path="/browse" element={<PageTransition><BrowsePage /></PageTransition>} />
          <Route path="/charts" element={<PageTransition><TopChartsPage /></PageTransition>} />
          <Route path="/publisher/:id" element={<PageTransition><PublisherProfile /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><PublisherDashboard /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />
          <Route path="/library" element={<PageTransition><MyLibrary /></PageTransition>} />
          <Route path="/home" element={<PageTransition><ExplorePage /></PageTransition>} />
          <Route path="/explore" element={<PageTransition><Navigate to="/home" replace /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/creators" element={<PageTransition><SearchCreators /></PageTransition>} />
          <Route path="/community" element={<PageTransition><CommunityPage /></PageTransition>} />
          <Route path="/community/post/:postId" element={<PageTransition><PostDetailPage /></PageTransition>} />
          <Route path="/community/my-posts" element={<PageTransition><MyPostsPage /></PageTransition>} />
          <Route path="/community/bookmarks" element={<PageTransition><BookmarksPage /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
           <Route path="/content-guidelines" element={<PageTransition><ContentGuidelines /></PageTransition>} />
           <Route path="/disclaimer" element={<PageTransition><DisclaimerPage /></PageTransition>} />
           <Route path="/dmca" element={<PageTransition><DMCAPage /></PageTransition>} />
           <Route path="/cookie-policy" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
           <Route path="/blog" element={<PageTransition><BlogListPage /></PageTransition>} />
           <Route path="/blog/:slug" element={<PageTransition><BlogDetailPage /></PageTransition>} />
           <Route path="/admin/blog" element={<PageTransition><AdminBlogEditor /></PageTransition>} />
           <Route path="/admin/settings" element={<PageTransition><AdminSettings /></PageTransition>} />
          
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
        </Suspense>
    </>
  );
};

const AppLayout = () => (
  <>
    <AntiPiracy />
    <JsonLd />
    <BanNotice />
    <Navbar />
    <AnnouncementBanner />
    <AuthModal />
    <SpotlightSearch />
    <OnboardingModal />
    <TermsAcceptanceModal />
    <ErrorBoundary>
      <AnimatedRoutes />
    </ErrorBoundary>
    <NetworkStatus />
    <Footer />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

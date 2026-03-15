import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AuthModal from "@/components/AuthModal";
import SpotlightSearch from "@/components/SpotlightSearch";
import ErrorBoundary from "@/components/ErrorBoundary";
import BanNotice from "@/components/BanNotice";
import CookieConsent from "@/components/CookieConsent";
import GoogleOnboardingModal from "@/components/GoogleOnboardingModal";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import NetworkStatus from "@/components/NetworkStatus";
import { lazy, Suspense, useEffect } from "react";

// ExplorePage loaded eagerly — it's the default route, no blank screen
import ExplorePage from "./pages/ExplorePage";

// Lazy-loaded route components
const Index = lazy(() => import("./pages/Index"));
const ManhwaDetail = lazy(() => import("./pages/ManhwaDetail"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const TopChartsPage = lazy(() => import("./pages/TopChartsPage"));
const PublisherProfile = lazy(() => import("./pages/PublisherProfile"));
const PublisherDashboard = lazy(() => import("./pages/PublisherDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const MyLibrary = lazy(() => import("./pages/MyLibrary"));
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
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const UpcomingPage = lazy(() => import("./pages/UpcomingPage"));
const UpcomingDetailPage = lazy(() => import("./pages/UpcomingDetailPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const TapasAlternativePage = lazy(() => import("./pages/TapasAlternativePage"));
const WebtoonAlternativePage = lazy(() => import("./pages/WebtoonAlternativePage"));
const PublishManhwaPage = lazy(() => import("./pages/PublishManhwaPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

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
    const ctxHandler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', ctxHandler);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
      if (e.ctrlKey && e.key === 's') e.preventDefault();
      if (e.ctrlKey && e.key === 'p') e.preventDefault();
    };
    document.addEventListener('keydown', keyHandler);

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
    };
  }, []);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
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
      <p className="text-sm text-white/50">Something went wrong while loading the chapter.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Reload Page</button>
        <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm">Go Back</button>
      </div>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-sm text-muted-foreground">Loading page…</p>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/title/:id" element={<ManhwaDetail />} />
          <Route path="/manhwa/:id" element={<ManhwaDetail />} />
          <Route path="/read/:id/:chapter" element={<ErrorBoundary fallback={<ReaderErrorFallback />}><ReaderPage /></ErrorBoundary>} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/charts" element={<TopChartsPage />} />
          <Route path="/publisher/:id" element={<PublisherProfile />} />
          <Route path="/reader/:id" element={<UserProfilePage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
          <Route path="/dashboard" element={<PublisherDashboard />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/upcoming/:slug/:chapter" element={<UpcomingDetailPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/library" element={<MyLibrary />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/creators" element={<SearchCreators />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/post/:postId" element={<PostDetailPage />} />
          <Route path="/community/my-posts" element={<MyPostsPage />} />
          <Route path="/community/bookmarks" element={<BookmarksPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/content-guidelines" element={<ContentGuidelines />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/dmca" element={<DMCAPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/admin/blog" element={<AdminBlogEditor />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/genre/:genreName" element={<GenrePage />} />
          <Route path="/tapas-alternative" element={<TapasAlternativePage />} />
          <Route path="/webtoon-alternative" element={<WebtoonAlternativePage />} />
          <Route path="/publish-manhwa" element={<PublishManhwaPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
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
    <VerifyEmailBanner />
    <AuthModal />
    <SpotlightSearch />
    <GoogleOnboardingModal />
    <ErrorBoundary>
      <AnimatedRoutes />
    </ErrorBoundary>
    <NetworkStatus />
    <Footer />
    <CookieConsent />
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

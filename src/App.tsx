import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
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
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AntiPiracy = () => {
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

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
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition>{loading ? <div className="min-h-screen" /> : user ? <Navigate to="/home" replace /> : <Index />}</PageTransition>} />
          <Route path="/manhwa/:id" element={<PageTransition><ManhwaDetail /></PageTransition>} />
          <Route path="/read/:id/:chapter" element={<PageTransition><ReaderPage /></PageTransition>} />
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
          <Route path="/blog" element={<PageTransition><BlogListPage /></PageTransition>} />
          <Route path="/blog/:slug" element={<PageTransition><BlogDetailPage /></PageTransition>} />
          <Route path="/admin/blog" element={<PageTransition><AdminBlogEditor /></PageTransition>} />
          <Route path="/admin/settings" element={<PageTransition><AdminSettings /></PageTransition>} />
          
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
};

const AppLayout = () => (
  <>
    <AntiPiracy />
    <JsonLd />
    <BanNotice />
    <Navbar />
    <AuthModal />
    <SpotlightSearch />
    <OnboardingModal />
    <ErrorBoundary>
      <AnimatedRoutes />
    </ErrorBoundary>
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

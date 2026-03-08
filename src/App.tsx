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
import Index from "./pages/Index";
import ManhwaDetail from "./pages/ManhwaDetail";
import ReaderPage from "./pages/ReaderPage";
import BrowsePage from "./pages/BrowsePage";
import TopChartsPage from "./pages/TopChartsPage";
import PublisherProfile from "./pages/PublisherProfile";
import PublisherDashboard from "./pages/PublisherDashboard";
import AdminPanel from "./pages/AdminPanel";
import MyLibrary from "./pages/MyLibrary";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import SearchCreators from "./pages/SearchCreators";
import CommunityPage from "./pages/CommunityPage";
import PostDetailPage from "./pages/PostDetailPage";
import MyPostsPage from "./pages/MyPostsPage";
import BookmarksPage from "./pages/BookmarksPage";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContentGuidelines from "./pages/ContentGuidelines";
import BlogListPage from "./pages/BlogListPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import AdminBlogEditor from "./pages/AdminBlogEditor";
import AdminSettings from "./pages/AdminSettings";

import NotFound from "./pages/NotFound";
import { useEffect } from "react";

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

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
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

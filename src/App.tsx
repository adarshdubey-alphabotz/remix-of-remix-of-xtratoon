import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AuthModal from "@/components/AuthModal";
import PageTransition from "@/components/PageTransition";
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
import ProfileSettings from "./pages/ProfileSettings";
import SearchCreators from "./pages/SearchCreators";
import ResetPassword from "./pages/ResetPassword";
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
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/manhwa/:id" element={<PageTransition><ManhwaDetail /></PageTransition>} />
        <Route path="/read/:id/:chapter" element={<PageTransition><ReaderPage /></PageTransition>} />
        <Route path="/browse" element={<PageTransition><BrowsePage /></PageTransition>} />
        <Route path="/charts" element={<PageTransition><TopChartsPage /></PageTransition>} />
        <Route path="/publisher/:id" element={<PageTransition><PublisherProfile /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><PublisherDashboard /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />
        <Route path="/library" element={<PageTransition><MyLibrary /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><ProfileSettings /></PageTransition>} />
        <Route path="/creators" element={<PageTransition><SearchCreators /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
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
    <Navbar />
    <AuthModal />
    <AnimatedRoutes />
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

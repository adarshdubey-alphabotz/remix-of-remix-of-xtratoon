import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import Index from "./pages/Index";
import ManhwaDetail from "./pages/ManhwaDetail";
import ReaderPage from "./pages/ReaderPage";
import BrowsePage from "./pages/BrowsePage";
import TopChartsPage from "./pages/TopChartsPage";
import PublisherProfile from "./pages/PublisherProfile";
import PublisherDashboard from "./pages/PublisherDashboard";
import AdminPanel from "./pages/AdminPanel";
import MyLibrary from "./pages/MyLibrary";
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

const AppLayout = () => (
  <>
    <AntiPiracy />
    <Navbar />
    <AuthModal />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/manhwa/:id" element={<ManhwaDetail />} />
      <Route path="/read/:id/:chapter" element={<ReaderPage />} />
      <Route path="/browse" element={<BrowsePage />} />
      <Route path="/charts" element={<TopChartsPage />} />
      <Route path="/publisher/:id" element={<PublisherProfile />} />
      <Route path="/dashboard" element={<PublisherDashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/library" element={<MyLibrary />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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

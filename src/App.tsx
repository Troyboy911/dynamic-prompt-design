import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SupportChatbot from "@/components/SupportChatbot";
import AdsterraSocialBar from "@/components/AdsterraSocialBar";

// TODO: Replace with your actual Adsterra Social Bar ad key
const ADSTERRA_AD_KEY = "YOUR_ADSTERRA_AD_KEY";
const ADSTERRA_PUBLISHER_ID = "YOUR_PUBLISHER_ID";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Contact from "./pages/Contact";
import Solutions from "./pages/Solutions";
import AppDevelopment from "./pages/AppDevelopment";
import Automation from "./pages/Automation";
import WebsiteDevelopment from "./pages/WebsiteDevelopment";
import AIAgents from "./pages/AIAgents";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/solutions/app-development" element={<AppDevelopment />} />
        <Route path="/solutions/automation" element={<Automation />} />
        <Route path="/solutions/website-development" element={<WebsiteDevelopment />} />
        <Route path="/solutions/ai-agents" element={<AIAgents />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && <SupportChatbot />}
      {!isAdminRoute && ADSTERRA_AD_KEY !== "YOUR_ADSTERRA_AD_KEY" && (
        <AdsterraSocialBar publisherId={ADSTERRA_PUBLISHER_ID} adKey={ADSTERRA_AD_KEY} />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import Homepage from "./pages/Homepage";
import CharacterDashboard from "./pages/CharacterDashboard";
import { QuickPlanning } from "./pages/QuickPlanning";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function QuickPlanningWrapper() {
  const navigate = useNavigate();
  return (
    <QuickPlanning 
      onNavigateHome={() => navigate('/')}
    />
  );
}

function AppContent() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <div className="min-h-screen w-full">
      <AppNavbar />
      
      {/* Announcement Banner */}
      <div className="container mx-auto px-4 pt-2">
        <AnnouncementBanner />
      </div>
      
      {/* Main Content */}
      <main className={isHomepage ? "" : "p-4 sm:p-6 pb-16 min-h-screen"}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/characters" element={<CharacterDashboard />} />
          <Route path="/quick-planning" element={<QuickPlanningWrapper />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Footer with signature */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Made by Idan Rossman
          </p>
        </div>
      </footer>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

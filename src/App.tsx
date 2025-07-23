import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import Homepage from "./pages/Homepage";
import Overview from "./pages/Overview";
import Characters from "./pages/Characters";
import CharacterDashboard from "./pages/CharacterDashboard";
import Planning from "./pages/Planning";
import { QuickPlanning } from "./pages/QuickPlanning";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function QuickPlanningWrapper() {
  const navigate = useNavigate();
  return (
    <QuickPlanning 
      onNavigateHome={() => navigate('/')}
      onNavigateToOverview={() => navigate('/overview')}
    />
  );
}

function AppContent() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <div className="min-h-screen w-full">
      <AppNavbar />
      
      {/* Main Content */}
      <main className={isHomepage ? "" : "p-4 sm:p-6 pb-16 min-h-screen"}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters-new" element={<CharacterDashboard />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/quick-planning" element={<QuickPlanningWrapper />} />
          <Route path="/settings" element={<Settings />} />
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

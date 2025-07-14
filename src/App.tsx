import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import Overview from "./pages/Overview";
import Characters from "./pages/Characters";
import Planning from "./pages/Planning";
import ImportExport from "./pages/ImportExport";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen w-full">
        <HashRouter>
          <AppNavbar />
          
          {/* Main Content */}
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </HashRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

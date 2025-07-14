import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <HashRouter>
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              {/* Header with Sidebar Toggle */}
              <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="ml-4" />
              </header>
              
              {/* Main Content */}
              <main className="flex-1 p-6">
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
            </div>
          </HashRouter>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

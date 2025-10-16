import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import SimpleNav from "@/components/ui/simple-nav";
import VantaWaves from "@/components/ui/vanta-waves";
import { SiCurseforge } from 'react-icons/si';
import Homepage from "./pages/Homepage";
import CharacterDashboard from "./pages/CharacterDashboard-new";
import { QuickPlanning } from "./pages/QuickPlanning";
import NewCharacter from "./pages/NewCharacter";
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
  const isQuickPlanning = location.pathname === '/quick-planning';
  const previousPathRef = useRef(location.pathname);

  // Determine slide direction based on route order
  const getSlideDirection = () => {
    const routes = ['/', '/quick-planning', '/characters'];
    const currentIndex = routes.indexOf(location.pathname);
    const previousIndex = routes.indexOf(previousPathRef.current);
    
    // If moving forward (right), slide in from right (100%)
    // If moving backward (left), slide in from left (-100%)
    return currentIndex > previousIndex ? 100 : -100;
  };

  const direction = getSlideDirection();

  // Update previous path after render
  useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Quick Planning', href: '/quick-planning' },
    { label: 'Characters', href: '/characters' }
  ];

  const pageVariants = {
    initial: (direction: number) => ({
      x: direction,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: -direction,
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <VantaWaves
      color={0x0e141b}
      waveHeight={20}
      waveSpeed={0.75}
      shininess={40}
      zoom={0.9}
    >
      <div className={`w-full relative z-50 ${isHomepage || isQuickPlanning ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        {/* Simple Clean Navigation */}
        <SimpleNav
          items={navItems}
          activeHref={location.pathname}
          brandText=""
          logoIcon={<SiCurseforge className="simple-nav-icon" />}
        />
        
        {/* Main Content */}
        <main className={isHomepage ? "" : isQuickPlanning ? "pt-24 h-screen overflow-hidden relative z-50" : "pt-24 pb-32 min-h-screen relative z-50"}>
          <AnimatePresence mode="wait" custom={direction}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Homepage />
                </motion.div>
              } />
              <Route path="/characters" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CharacterDashboard />
                </motion.div>
              } />
              <Route path="/quick-planning" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <QuickPlanningWrapper />
                </motion.div>
              } />
              <Route path="/character/new" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <NewCharacter />
                </motion.div>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <NotFound />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Footer with signature - Pill style at bottom */}
        <footer className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 shadow-xl">
            <p className="text-center text-sm shiny-footer-text">
              Made by Idan Rossman
            </p>
          </div>
        </footer>
      </div>
    </VantaWaves>
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

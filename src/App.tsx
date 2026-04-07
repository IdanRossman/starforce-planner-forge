import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Home, Calculator, Users, Globe } from "lucide-react";
import SimpleNav from "@/components/ui/simple-nav";
import VantaWaves from "@/components/ui/vanta-waves";
import Logo3D from "@/components/ui/Logo3D";
import Homepage from "./pages/Homepage";
import CommunityPage from "./pages/CommunityPage";
import CharacterDashboard from "./pages/CharacterDashboard";
import { QuickPlanning } from "./pages/QuickPlanning";
import NewCharacter from "./pages/NewCharacter";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const isHomepage = location.pathname === '/';
  const isQuickPlanning = location.pathname === '/quick-planning';
  const previousPathRef = useRef(location.pathname);
  const { isPasswordRecovery } = useAuth();

  // Redirect to reset password page when Supabase fires PASSWORD_RECOVERY
  useEffect(() => {
    if (isPasswordRecovery) navigate('/reset-password', { replace: true });
  }, [isPasswordRecovery, navigate]);

  // Determine slide direction based on route order
  const getSlideDirection = () => {
    const routes = ['/', '/quick-planning', '/community', '/characters'];
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
    { label: 'Home', href: '/', icon: Home },
    { label: 'Quick Planning', href: '/quick-planning', icon: Calculator },
    { label: 'Community', href: '/community', icon: Globe },
    { label: 'Characters', href: '/characters', icon: Users }
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
      enableMovement={false}
    >
      <div className={`w-full relative z-50 ${isQuickPlanning ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'}`}>
        {/* Simple Clean Navigation */}
        <SimpleNav
          items={navItems}
          activeHref={location.pathname}
          brandText=""
          logoIcon={<Logo3D />}
        />
        
        {/* Main Content */}
        <main className={isHomepage ? "" : isQuickPlanning ? "pt-24 h-screen overflow-hidden relative z-50" : "pt-24 pb-24 min-h-screen relative z-50"}>
          <AnimatePresence mode="wait" custom={direction}>
            <Routes location={location} key={location.pathname}>
              <Route path="/auth" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <AuthPage />
                </motion.div>
              } />
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
                  <ProtectedRoute><CharacterDashboard /></ProtectedRoute>
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
                  <ProtectedRoute><NewCharacter /></ProtectedRoute>
                </motion.div>
              } />
              <Route path="/reset-password" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ResetPasswordPage />
                </motion.div>
              } />
              <Route path="/community" element={
                <motion.div
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <CommunityPage />
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
        
        {/* Footer */}
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <p className="text-white/20 text-xs font-maplestory tracking-wide">Made by Idan Rossman</p>
        </footer>
      </div>
    </VantaWaves>
  );
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <HashRouter>
      <AppContent />
    </HashRouter>
  </TooltipProvider>
);

export default App;

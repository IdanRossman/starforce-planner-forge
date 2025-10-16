import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  icon: LucideIcon;
  description?: string;
}

interface StepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  children: ReactNode;
  showNavigation?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onBack?: () => void; // New: custom back handler (e.g., navigate home)
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  className?: string;
  contentClassName?: string;
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  showNavigation = true,
  onNext,
  onPrevious,
  onBack,
  canGoNext = true,
  canGoPrevious = true,
  nextLabel = "Next",
  previousLabel = "Back",
  className = "",
  contentClassName = ""
}: StepWizardProps) {
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    }
    if (canGoNext && currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      onStepChange?.(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 0 && onBack) {
      onBack();
    } else if (canGoPrevious && currentStep > 0) {
      const prevStep = currentStep - 1;
      onStepChange?.(prevStep);
      onPrevious?.();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Navigation Bar with Progress - Top positioned like QuickPlanning */}
      {showNavigation && (
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoPrevious && !onBack}
            className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {previousLabel}
          </Button>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                  ${currentStep === index ? 'bg-primary text-primary-foreground scale-110' : 
                    currentStep > index ? 'bg-primary/50 text-primary-foreground' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 transition-all ${currentStep > index ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Next/Finish Button */}
          <div className="w-[100px]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!canGoNext}
              className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={contentClassName}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper component for step content (no card wrapper, just passes through children)
interface StepContentProps {
  children: ReactNode;
  className?: string;
}

export function StepContent({ children, className = "" }: StepContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

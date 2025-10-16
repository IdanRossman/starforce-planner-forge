import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";

export interface WizardIntroStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface WizardIntroProps {
  title: string;
  subtitle?: string;
  steps: WizardIntroStep[];
  onStart: () => void;
  startButtonText?: string;
  className?: string;
  children?: ReactNode; // For custom content
}

export function WizardIntro({
  title,
  subtitle,
  steps,
  onStart,
  startButtonText = "Get Started",
  className = "",
  children
}: WizardIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`max-w-4xl mx-auto bg-card/20 backdrop-blur-md border-white/20 ${className}`}>
        <CardContent className="p-12 text-center space-y-10">
          {/* Title Section */}
          <div className="space-y-3">
            <motion.h2 
              className="text-4xl font-bold text-white font-maplestory"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p 
                className="text-muted-foreground text-lg font-maplestory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Custom Children Content */}
          {children && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {children}
            </motion.div>
          )}

          {/* Workflow Steps Preview */}
          <motion.div 
            className="flex items-center justify-center gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={index} className="flex items-center gap-6">
                  {/* Step Card */}
                  <motion.div 
                    className="flex-1 text-center space-y-3 min-w-[140px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                  >
                    {/* Icon Circle */}
                    <motion.div 
                      className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mx-auto backdrop-blur-sm"
                      whileHover={{ scale: 1.1, borderColor: "rgba(255,255,255,0.5)" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <StepIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    {/* Step Info */}
                    <div>
                      <h3 className="font-bold text-lg text-white font-maplestory">{step.title}</h3>
                      <p className="text-muted-foreground text-sm font-maplestory">{step.description}</p>
                    </div>
                  </motion.div>

                  {/* Arrow (except after last step) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + (index * 0.1) }}
                    >
                      <ArrowRight className="w-8 h-8 text-white/50 flex-shrink-0 mt-6" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all font-maplestory"
              onClick={onStart}
            >
              {startButtonText}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

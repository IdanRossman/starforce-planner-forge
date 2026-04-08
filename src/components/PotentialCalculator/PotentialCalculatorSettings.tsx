import React from 'react';
import { Settings, Sparkles, Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export interface PotentialSettings {
  smartCubeOptimization: boolean;
}

export interface PotentialCalculatorSettingsProps {
  potentialSettings: PotentialSettings;
  onUpdatePotentialSettings: (settings: PotentialSettings) => void;
  isCalculating: boolean;
}

/**
 * Settings Panel Component for Potential Calculator
 * Handles global potential enhancement settings and recalculation
 */
export function PotentialCalculatorSettings({
  potentialSettings,
  onUpdatePotentialSettings,
  isCalculating
}: PotentialCalculatorSettingsProps) {
  
  const handleSettingChange = <K extends keyof PotentialSettings>(
    key: K,
    value: PotentialSettings[K]
  ) => {
    onUpdatePotentialSettings({
      ...potentialSettings,
      [key]: value
    });
  };

  return (
    <div className="border border-white/10 bg-[hsl(217_33%_12%)] rounded-xl px-4 pt-3 pb-4 flex flex-col gap-3">
      <p className="text-[9px] text-white/40 uppercase tracking-widest font-maplestory">Settings</p>
      <button
        onClick={() => handleSettingChange('smartCubeOptimization', !potentialSettings.smartCubeOptimization)}
        className={`w-full py-2 rounded-lg text-xs font-maplestory border transition-all ${
          potentialSettings.smartCubeOptimization
            ? 'bg-primary/20 border-primary/40 text-primary'
            : 'bg-white/[0.05] border-white/15 text-white/55 hover:text-white/80 hover:border-white/30'
        }`}
      >
        Smart Cube Optimization
      </button>
    </div>
  );
}

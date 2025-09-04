import React from 'react';
import { Settings, Sparkles, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-maplestory">
          <Settings className="w-5 h-5 text-primary" />
          Potential Enhancement Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhancement Settings */}
        <div>
          <h4 className="font-medium text-sm mb-3 text-muted-foreground font-maplestory">
            Calculation Options
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="smart-cube-optimization"
                checked={potentialSettings.smartCubeOptimization}
                onCheckedChange={(checked) => handleSettingChange('smartCubeOptimization', checked)}
              />
              <Label htmlFor="smart-cube-optimization" className="text-sm cursor-pointer font-maplestory">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Smart Cube Optimization
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Equipment with optimized cube recommendations will show a sparkle icon (✨) next to the cube type.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Automatically recommend the most cost-effective cube type
                </div>
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Settings, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarforceStrategy } from '@/services/starforceService';
import { useStarforceStrategy } from '@/hooks/useStarforceStrategy';

interface StarforceSettingsProps {
  onStrategyChange?: (strategy: StarforceStrategy) => void;
  className?: string;
}

export function StarforceSettings({ onStrategyChange, className = '' }: StarforceSettingsProps) {
  const [strategy, updateStrategy] = useStarforceStrategy();

  const handleStrategyChange = (newStrategy: StarforceStrategy) => {
    updateStrategy(newStrategy);
    
    // Notify parent component of the change
    if (onStrategyChange) {
      onStrategyChange(newStrategy);
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-blue-500/5 to-primary/5 border-blue-500/20 ${className}`}>
      <CardContent className="py-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-muted-foreground font-maplestory">StarForce System</span>
          </div>
          
          <Select value={strategy} onValueChange={handleStrategyChange}>
            <SelectTrigger className="w-full max-w-md h-12 border-blue-500/30 bg-background/80 backdrop-blur-sm font-maplestory text-center">
              <SelectValue>
                {strategy && (
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className={`w-5 h-5 rounded-full ${
                      strategy === StarforceStrategy.LEGACY 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-purple-500 to-violet-500'
                    } flex items-center justify-center`}>
                      {strategy === StarforceStrategy.LEGACY ? (
                        <Target className="w-3 h-3 text-white" />
                      ) : (
                        <Zap className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium font-maplestory text-base">
                      {strategy === StarforceStrategy.LEGACY ? 'Legacy System' : 'New KMS System'}
                    </span>
                    <span className="text-sm px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-maplestory">
                      {strategy === StarforceStrategy.LEGACY ? '25-star' : '30-star'}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={StarforceStrategy.LEGACY}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Target className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-medium font-maplestory">Legacy System</span>
                    <span className="text-xs text-muted-foreground font-maplestory">Current 25-star system</span>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={StarforceStrategy.NEW_KMS}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-medium font-maplestory">New KMS System</span>
                    <span className="text-xs text-muted-foreground font-maplestory">30-star enhancement system</span>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}



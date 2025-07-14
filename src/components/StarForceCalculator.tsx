import { StarForceCalculation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface StarForceCalculatorProps {
  calculation: StarForceCalculation;
}

// Mock StarForce calculation - you can replace this with actual formulas
export function calculateStarForce(currentLevel: number, targetLevel: number, tier: string): StarForceCalculation {
  const levels = targetLevel - currentLevel;
  if (levels <= 0) {
    return {
      currentLevel,
      targetLevel,
      averageCost: 0,
      averageBooms: 0,
      successRate: 100,
      boomRate: 0,
      costPerAttempt: 0
    };
  }

  // Simplified calculation - replace with actual MapleStory formulas
  const baseCost = currentLevel < 15 ? 100000 : currentLevel < 20 ? 500000 : 1000000;
  const successRate = Math.max(5, 100 - (currentLevel * 4));
  const boomRate = currentLevel >= 15 ? Math.min(20, (currentLevel - 14) * 2) : 0;
  
  const averageCost = baseCost * levels * (100 / successRate) * (tier === 'legendary' ? 2 : 1);
  const averageBooms = levels * (boomRate / 100);

  return {
    currentLevel,
    targetLevel,
    averageCost,
    averageBooms,
    successRate,
    boomRate,
    costPerAttempt: baseCost
  };
}

export function StarForceCalculator({ calculation }: StarForceCalculatorProps) {
  const formatMesos = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const getDangerLevel = () => {
    if (calculation.currentLevel >= 20) return { color: 'text-starforce-danger', bg: 'bg-starforce-danger/20' };
    if (calculation.currentLevel >= 15) return { color: 'text-starforce-caution', bg: 'bg-starforce-caution/20' };
    return { color: 'text-starforce-safe', bg: 'bg-starforce-safe/20' };
  };

  const dangerLevel = getDangerLevel();
  const progress = (calculation.currentLevel / 25) * 100;

  return (
    <Card className="bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          StarForce Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Level</span>
            <Badge className={`${dangerLevel.bg} ${dangerLevel.color} border-current/30`}>
              ★{calculation.currentLevel}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>★0</span>
            <span>★25 (Max)</span>
          </div>
        </div>

        {/* Target and Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              Target Level
            </div>
            <div className="text-2xl font-bold text-primary">
              ★{calculation.targetLevel}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-starforce-safe">
              {calculation.successRate}%
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold text-foreground">Cost Analysis</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Per Attempt</span>
              <p className="font-semibold text-maple-gold">
                {formatMesos(calculation.costPerAttempt)} mesos
              </p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Average Total</span>
              <p className="font-semibold text-maple-gold">
                {formatMesos(calculation.averageCost)} mesos
              </p>
            </div>
          </div>
          
          {calculation.boomRate > 0 && (
            <div className="flex items-center gap-2 p-2 bg-starforce-danger/10 border border-starforce-danger/20 rounded">
              <AlertTriangle className="w-4 h-4 text-starforce-danger" />
              <div className="text-sm">
                <span className="text-muted-foreground">Expected Booms: </span>
                <span className="font-semibold text-starforce-danger">
                  {calculation.averageBooms.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
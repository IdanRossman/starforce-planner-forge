import { StarForceCalculation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface StarForceCalculatorProps {
  calculation: StarForceCalculation;
}

// Mock StarForce calculation - you can replace this with actual formulas
export function calculateStarForce(
  currentLevel: number, 
  targetLevel: number, 
  tier: string,
  events?: { 
    costMultiplier?: number; 
    successRateBonus?: number;
    starCatching?: boolean;
    safeguard?: boolean;
  }
): StarForceCalculation {
  const { 
    costMultiplier = 1, 
    successRateBonus = 0, 
    starCatching = false, 
    safeguard = false 
  } = events || {};
  
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

  // More realistic base costs per tier and star level
  const baseCosts: { [key: string]: number[] } = {
    rare: [100, 200, 300, 500, 800, 1300, 2100, 3400, 5500, 8900, 14400, 23400, 38000, 61700, 100200, 162900, 264500, 429600, 0, 0, 0, 0, 0, 0, 0],
    epic: [500, 1000, 1500, 2500, 4000, 6500, 10500, 17000, 27500, 44500, 72000, 117000, 190000, 308500, 501000, 814500, 1322500, 2148000, 3487000, 5664000, 9201000, 14942000, 24267000, 39421000, 64060000],
    unique: [1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000, 144000, 234000, 380000, 617000, 1002000, 1629000, 2645000, 4296000, 6975000, 11328000, 18403000, 29885000, 48534000, 78842000, 128121000],
    legendary: [2500, 5000, 7500, 12500, 20000, 32500, 52500, 85000, 137500, 222500, 360000, 585000, 950000, 1542500, 2505000, 4072500, 6612500, 10740000, 17437500, 28320000, 46007500, 74712500, 121335000, 197105000, 320210000]
  };
  
  const baseSuccessRates = [0.95, 0.9, 0.85, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.03, 0.02, 0.01, 0.005];
  const boomChances = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.02, 0.02, 0.03, 0.03, 0.03, 0.04, 0.04, 0.1, 0.1, 0.2, 0.2, 0.3];
  
  let totalCost = 0;
  let totalAttempts = 0;
  let totalBooms = 0;
  
  for (let star = currentLevel; star < targetLevel; star++) {
    const costs = baseCosts[tier] || baseCosts.rare;
    const baseCost = costs[star] || 1000000;
    
    // Apply safeguard cost multiplier for 15->16 and 16->17
    let starCostMultiplier = costMultiplier;
    if (safeguard && (star === 15 || star === 16)) {
      starCostMultiplier *= 2;
    }
    
    const cost = Math.round(baseCost * starCostMultiplier);
    
    let successRate = baseSuccessRates[star] || 0.3;
    
    // Apply success rate bonus for 5/10/15 events at specific levels
    if (successRateBonus > 0 && (star === 4 || star === 9 || star === 14)) {
      successRate = Math.min(1, successRate + successRateBonus);
    }
    
    // Apply star catching 5% success rate bonus globally
    if (starCatching) {
      successRate = Math.min(1, successRate + 0.05);
    }
    
    let boomChance = boomChances[star] || 0;
    
    // Remove boom chance for 15->16 and 16->17 with safeguard
    if (safeguard && (star === 15 || star === 16)) {
      boomChance = 0;
    }
    
    // Calculate expected attempts for this star level
    let expectedAttempts;
    if (boomChance > 0) {
      expectedAttempts = 1 / (successRate + boomChance);
    } else {
      expectedAttempts = 1 / successRate;
    }
    
    totalAttempts += expectedAttempts;
    totalCost += expectedAttempts * cost;
    totalBooms += expectedAttempts * boomChance;
  }
  
  const averageSuccessRate = totalAttempts > 0 ? (targetLevel - currentLevel) / totalAttempts * 100 : 100;
  const averageBoomRate = totalAttempts > 0 ? totalBooms / totalAttempts * 100 : 0;

  return {
    currentLevel,
    targetLevel,
    averageCost: Math.round(totalCost),
    averageBooms: Math.round(totalBooms * 100) / 100,
    successRate: Math.round(averageSuccessRate * 100) / 100,
    boomRate: Math.round(averageBoomRate * 100) / 100,
    costPerAttempt: Math.round(totalCost / Math.max(1, totalAttempts))
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
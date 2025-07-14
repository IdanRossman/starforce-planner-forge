```typescript
import { useState } from "react";
import { StarForceCalculation } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface StarForceCalculatorProps {
  initialCalculation?: StarForceCalculation;
}

// Enhanced StarForce calculation with item level and simulation
export function calculateStarForce(
  itemLevel: number,
  currentLevel: number,
  targetLevel: number,
  tier: string,
  serverType: "Regular" | "Reboot",
  events: {
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
    safeguard = false,
  } = events || {};

  // Input validation
  if (currentLevel >= targetLevel || itemLevel < 1 || targetLevel > 25 || currentLevel < 0) {
    return {
      currentLevel,
      targetLevel,
      averageCost: 0,
      averageBooms: 0,
      successRate: 100,
      boomRate: 0,
      costPerAttempt: 0,
    };
  }

  // Success rates (GMS, simplified from MapleStory Wiki)
  const baseSuccessRates: number[] = [
    0.95, 0.9, 0.85, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55,
    0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
    0.3, 0.03, 0.02, 0.01, 0.005,
  ];

  // Destruction rates (0% for stars < 12 or with Safeguard for 12-17)
  const boomChances: number[] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0-11
    0.006, 0.01, 0.02, 0.03, 0.04, // 12-16
    0.05, 0.06, 0.07, 0.08, 0.09, // 17-21
    0.14, 0.147, 0.196, 0.294, // 22-25
  ];

  // Tier multipliers for costs
  const tierMultipliers: { [key: string]: number } = {
    rare: 0.8,
    epic: 1.0,
    unique: 1.2,
    legendary: 1.5,
  };

  // Monte Carlo simulation
  const simulations = 1000;
  let totalCost = 0;
  let totalAttempts = 0;
  let totalBooms = 0;
  let successes = 0;

  for (let i = 0; i < simulations; i++) {
    let currentStar = currentLevel;
    let attemptCost = 0;
    let attemptCount = 0;
    let boomCount = 0;

    while (currentStar < targetLevel) {
      // Calculate cost per attempt
      const divisor = serverType === "Regular" ? 400 : 200;
      const baseCost = 1000 + Math.pow(itemLevel, 2) * Math.pow(currentStar + 1, 2.3) / divisor;
      const tierCost = baseCost * (tierMultipliers[tier] || 1.0);
      const safeguardMultiplier = safeguard && currentStar >= 12 && currentStar <= 16 ? 2 : 1;
      const cost = Math.round(tierCost * safeguardMultiplier * costMultiplier);

      // Calculate success and boom rates
      let successRate = baseSuccessRates[currentStar] || 0.3;
      if (successRateBonus > 0 && [4, 9, 14].includes(currentStar)) {
        successRate = Math.min(1, successRate + successRateBonus);
      }
      if (starCatching) {
        successRate = Math.min(1, successRate * 1.05); // 5% multiplicative boost
      }
      const boomRate = (safeguard && currentStar >= 12 && currentStar <= 16) ? 0 : (boomChances[currentStar] || 0);
      const failRate = 1 - successRate - boomRate;

      // Simulate enhancement
      attemptCost += cost;
      attemptCount++;
      const rand = Math.random();
      if (rand < successRate) {
        currentStar++;
      } else if (rand < successRate + boomRate) {
        boomCount++;
        break; // Item destroyed
      } else if (currentStar >= 12) {
        currentStar--; // Drop a star on failure for 12+ stars
      }
    }

    if (currentStar >= targetLevel) {
      successes++;
    }
    totalCost += attemptCost;
    totalAttempts += attemptCount;
    totalBooms += boomCount;
  }

  return {
    currentLevel,
    targetLevel,
    averageCost: Math.round(totalCost / simulations),
    averageBooms: Math.round((totalBooms / simulations) * 100) / 100,
    successRate: Math.round((successes / simulations) * 10000) / 100,
    boomRate: Math.round((totalBooms / simulations) * 10000) / 100,
    costPerAttempt: Math.round(totalCost / Math.max(1, totalAttempts)),
  };
}

export function StarForceCalculator({ initialCalculation }: StarForceCalculatorProps) {
  // State for input fields
  const [itemLevel, setItemLevel] = useState(150);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(10);
  const [tier, setTier] = useState("epic");
  const [serverType, setServerType] = useState<"Regular" | "Reboot">("Regular");
  const [safeguard, setSafeguard] = useState(false);
  const [starCatching, setStarCatching] = useState(false);
  const [costDiscount, setCostDiscount] = useState(0);
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );

  // Format Mesos for display
  const formatMesos = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  // Determine danger level for styling
  const getDangerLevel = (level: number) => {
    if (level >= 20) return { color: "text-starforce-danger", bg: "bg-starforce-danger/20" };
    if (level >= 15) return { color: "text-starforce-caution", bg: "bg-starforce-caution/20" };
    return { color: "text-starforce-safe", bg: "bg-starforce-safe/20" };
  };

  // Handle form submission
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateStarForce(itemLevel, currentLevel, targetLevel, tier, serverType, {
      costMultiplier: 1 - costDiscount / 100,
      successRateBonus: 0, // Add support for 5/10/15 events if needed
      starCatching,
      safeguard,
    });
    setCalculation(result);
  };

  // Render progress bar
  const progress = calculation ? (calculation.currentLevel / 25) * 100 : 0;
  const dangerLevel = calculation ? getDangerLevel(calculation.currentLevel) : getDangerLevel(currentLevel);

  return (
    <Card className="bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          StarForce Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Item Level</label>
              <Input
                type="number"
                value={itemLevel}
                onChange={(e) => setItemLevel(Number(e.target.value))}
                min={1}
                max={300}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Equipment Tier</label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="unique">Unique</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Current Star</label>
              <Input
                type="number"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(Number(e.target.value))}
                min={0}
                max={24}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Target Star</label>
              <Input
                type="number"
                value={targetLevel}
                onChange={(e) => setTargetLevel(Number(e.target.value))}
                min={1}
                max={25}
                className="mt-1"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Server Type</label>
            <Select value={serverType} onValueChange={setServerType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Reboot">Reboot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={safeguard} onCheckedChange={setSafeguard} />
              <label className="text-sm text-muted-foreground">Safeguard (12-17)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={starCatching} onCheckedChange={setStarCatching} />
              <label className="text-sm text-muted-foreground">Star Catching (+5%)</label>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Cost Discount (%)</label>
            <Input
              type="number"
              value={costDiscount}
              onChange={(e) => setCostDiscount(Number(e.target.value))}
              min={0}
              max={30}
              step={5}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Calculate
          </Button>
        </form>

        {/* Results */}
        {calculation && (
          <>
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
                  <span className="text-muted-foreground">Per Attempt (Avg)</span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
```
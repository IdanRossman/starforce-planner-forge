import { useState } from "react";
import { StarForceCalculation, Events } from "@/types";
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
import { Calculator, Target, TrendingUp, AlertTriangle, Star, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StarForceCalculatorProps {
  initialCalculation?: StarForceCalculation;
}

// Based on proven working calculator logic
// Brandon's proven cost calculation
function makeMesoFn(divisor: number, currentStarExp = 2.7, extraMult = 1) {
  return (currentStar: number, itemLevel: number) => 
    100 * Math.round(extraMult * itemLevel ** 3 * ((currentStar + 1) ** currentStarExp) / divisor + 10);
}

function saviorMesoFn(currentStar: number) {
  switch (currentStar) {
    case 11: return makeMesoFn(22000);
    case 12: return makeMesoFn(15000);
    case 13: return makeMesoFn(11000);
    case 14: return makeMesoFn(7500);
    default: return preSaviorMesoFn(currentStar);
  }
}

function preSaviorMesoFn(currentStar: number) {
  if (currentStar >= 15) return makeMesoFn(20000);
  if (currentStar >= 10) return makeMesoFn(40000);
  return makeMesoFn(2500, 1);
}

function saviorCost(currentStar: number, itemLevel: number): number {
  const mesoFn = saviorMesoFn(currentStar);
  return mesoFn(currentStar, itemLevel);
}

function getBaseCost(server: string, currentStar: number, itemLevel: number): number {
  return saviorCost(currentStar, itemLevel);
}

function getSafeguardMultiplierIncrease(currentStar: number, server: string): number {
  if (server === "kms" && currentStar >= 15 && currentStar <= 17) {
    return 2;
  }
  if (server !== "kms" && currentStar >= 15 && currentStar <= 16) {
    return 1;
  }
  return 0;
}

function attemptCost(
  currentStar: number, 
  itemLevel: number, 
  boomProtect: boolean, 
  thirtyOff: boolean, 
  starCatch: boolean,
  mvpDiscount: number,
  chanceTime: boolean,
  server: string
): number {
  let multiplier = 1;

  // MVP discounts (for stars <= 15)
  if (mvpDiscount > 0 && currentStar <= 15) {
    multiplier = multiplier - mvpDiscount;
  }

  // 30% off event
  if (thirtyOff) {
    multiplier = multiplier - 0.3;
  }

  // Safeguard cost increase - using Brandon's exact logic
  if (boomProtect && !chanceTime) {
    multiplier = multiplier + getSafeguardMultiplierIncrease(currentStar, server);
  }

  const cost = getBaseCost(server, currentStar, itemLevel) * multiplier;
  return Math.round(cost);
}

function determineOutcome(
  currentStar: number, 
  starCatch: boolean, 
  boomProtect: boolean, 
  fiveTenFifteen: boolean,
  server: string
): "Success" | "Maintain" | "Decrease" | "Boom" {
  // 5/10/15 event guaranteed success
  if (fiveTenFifteen && (currentStar === 5 || currentStar === 10 || currentStar === 15)) {
    return "Success";
  }

  // Brandon's exact saviorRates from working calculator
  const rates: { [key: number]: [number, number, number, number] } = {
    0: [0.95, 0.05, 0, 0], 1: [0.9, 0.1, 0, 0], 2: [0.85, 0.15, 0, 0], 
    3: [0.85, 0.15, 0, 0], 4: [0.8, 0.2, 0, 0], 5: [0.75, 0.25, 0, 0],
    6: [0.7, 0.3, 0, 0], 7: [0.65, 0.35, 0, 0], 8: [0.6, 0.4, 0, 0],
    9: [0.55, 0.45, 0, 0], 10: [0.5, 0.5, 0, 0], 11: [0.45, 0.55, 0, 0],
    12: [0.4, 0.6, 0, 0], 13: [0.35, 0.65, 0, 0], 14: [0.3, 0.7, 0, 0],
    15: [0.3, 0.679, 0, 0.021], 16: [0.3, 0, 0.679, 0.021], 17: [0.3, 0, 0.679, 0.021],
    18: [0.3, 0, 0.672, 0.028], 19: [0.3, 0, 0.672, 0.028], 20: [0.3, 0.63, 0, 0.07],
    21: [0.3, 0, 0.63, 0.07], 22: [0.03, 0, 0.776, 0.194], 23: [0.02, 0, 0.686, 0.294],
    24: [0.01, 0, 0.594, 0.396], 25: [0.01, 0, 0.594, 0.396]
  };

  let [probSuccess, probMaintain, probDecrease, probBoom] = rates[currentStar] || [0.3, 0.4, 0, 0.3];

  // Use Brandon's exact rates without any overrides

  // Safeguard removes boom chance
  if (boomProtect && currentStar >= 12 && currentStar <= 16) {
    if (probDecrease > 0) {
      probDecrease = probDecrease + probBoom;
    } else {
      probMaintain = probMaintain + probBoom;
    }
    probBoom = 0;
  }

  // Star catching (5% multiplicative)
  if (starCatch) {
    probSuccess = Math.min(1, probSuccess * 1.05);
    const leftOver = 1 - probSuccess;
    
    if (probDecrease === 0) {
      probMaintain = probMaintain * leftOver / (probMaintain + probBoom);
      probBoom = leftOver - probMaintain;
    } else {
      probDecrease = probDecrease * leftOver / (probDecrease + probBoom);
      probBoom = leftOver - probDecrease;
    }
  }

  const outcome = Math.random();
  if (outcome <= probSuccess) return "Success";
  if (outcome <= probSuccess + probMaintain) return "Maintain";
  if (outcome <= probSuccess + probMaintain + probDecrease) return "Decrease";
  return "Boom";
}

function performExperiment(
  currentStars: number,
  desiredStar: number,
  itemLevel: number,
  boomProtect: boolean,
  thirtyOff: boolean,
  starCatch: boolean,
  fiveTenFifteen: boolean,
  mvpDiscount: number,
  server: string
): [number, number] {
  let currentStar = currentStars;
  let totalMesos = 0;
  let totalBooms = 0;
  let decreaseCount = 0;

  while (currentStar < desiredStar) {
    const chanceTime = decreaseCount === 2;
    totalMesos += attemptCost(currentStar, itemLevel, boomProtect, thirtyOff, starCatch, mvpDiscount, chanceTime, server);

    if (chanceTime) {
      currentStar++;
      decreaseCount = 0;
    } else {
      const outcome = determineOutcome(currentStar, starCatch, boomProtect, fiveTenFifteen, server);
      
      if (outcome === "Success") {
        currentStar++;
        decreaseCount = 0;
      } else if (outcome === "Decrease") {
        currentStar--;
        decreaseCount++;
      } else if (outcome === "Maintain") {
        decreaseCount = 0;
      } else if (outcome === "Boom") {
        currentStar = 12; // Reset to 12 stars on boom
        totalBooms++;
        decreaseCount = 0;
      }
    }
  }

  return [totalMesos, totalBooms];
}

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
  } = {}
): StarForceCalculation {
  const {
    costMultiplier = 1,
    successRateBonus = 0,
    starCatching = false,
    safeguard = false,
  } = events || {};

  // Input validation
  if (currentLevel >= targetLevel || itemLevel < 1 || targetLevel > 23 || currentLevel < 0) {
    return {
      currentLevel,
      targetLevel,
      averageCost: 0,
      averageBooms: 0,
      successRate: 100,
      boomRate: 0,
      costPerAttempt: 0,
      perStarStats: [],
      recommendations: [],
    };
  }

  const trials = 100; // Reduced for better performance
  let totalCost = 0;
  let totalBooms = 0;
  
  // Convert events to working calculator format
  const thirtyOff = costMultiplier < 1;
  const fiveTenFifteen = successRateBonus > 0;
  const mvpDiscount = 0; // Could be extracted from costMultiplier if needed
  const server = "gms"; // Brandon uses lowercase "gms"

  // Run simulations using Brandon's exact algorithm 
  for (let i = 0; i < trials; i++) {
    // Each trial gets both meso and boom data from the same experiment
    const [mesoResult, boomResult] = performExperiment(
      currentLevel, 
      targetLevel, 
      itemLevel, 
      safeguard, 
      thirtyOff, 
      starCatching, 
      fiveTenFifteen, 
      mvpDiscount, 
      server
    );
    totalCost += mesoResult;
    totalBooms += boomResult;
  }

  // Calculate per-star stats
  const perStarStats: { star: number; successRate: number; boomRate: number; cost: number }[] = [];
  for (let star = currentLevel; star < targetLevel; star++) {
    // Get base rates
    const rates: { [key: number]: [number, number, number, number] } = {
      12: [40, 59.4, 0, 0.6], 13: [35, 63.7, 0, 1.3], 14: [30, 68.6, 0, 1.4],
      15: [30, 67.9, 0, 2.1], 16: [30, 66.4, 0, 3.6], 17: [30, 63.7, 0, 6.3],
      18: [30, 60, 0, 10], 19: [30, 50, 0, 20], 20: [30, 40, 0, 30]
    };
    
    const [successRate, , , boomRate] = rates[star] || [star <= 10 ? 95 : 30, 0, 0, 0];
    
    perStarStats.push({
      star,
      successRate,
      boomRate,
      cost: attemptCost(star, itemLevel, safeguard, thirtyOff, starCatching, mvpDiscount, false, server)
    });
  }

  // Calculate spares needed based on average booms
  const avgCost = totalCost / trials;
  const avgBooms = totalBooms / trials;
  const sparesNeeded = Math.ceil(avgBooms); // Round up - if 0.7 booms, need 1 spare

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (avgBooms > 0.5 && !safeguard && targetLevel >= 15) {
    recommendations.push("Consider using Safeguard for stars 15-16 to prevent destruction.");
  }
  if (avgCost > 500000000 && !thirtyOff) {
    recommendations.push("Wait for a 30% Off event to significantly reduce costs.");
  }
  if (sparesNeeded > 0) {
    recommendations.push(`Expected ${avgBooms.toFixed(1)} booms - prepare ${sparesNeeded} spare item${sparesNeeded > 1 ? 's' : ''}.`);
  }

  function formatMesos(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  }

  return {
    currentLevel,
    targetLevel,
    averageCost: Math.round(avgCost), // Just enhancement costs
    averageBooms: Math.round((totalBooms / trials) * 100) / 100,
    successRate: Math.round((trials / trials) * 10000) / 100, // Simplified
    boomRate: Math.round((totalBooms / (trials * 5)) * 10000) / 100, // Estimated
    costPerAttempt: Math.round(totalCost / (trials * 10)), // Estimated
    perStarStats,
    recommendations,
  };
}

export function StarForceCalculator({ initialCalculation }: StarForceCalculatorProps) {
  // State for input fields
  const [itemLevel, setItemLevel] = useState(150);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(17);
  const [server, setServer] = useState("GMS");
  const [itemType, setItemType] = useState("regular");
  const [safeguard, setSafeguard] = useState(false);
  const [starCatching, setStarCatching] = useState(false);
  const [eventType, setEventType] = useState<string>("");
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
    if (level >= 20) return { color: "text-red-400", bg: "bg-red-500/20" };
    if (level >= 15) return { color: "text-orange-400", bg: "bg-orange-500/20" };
    return { color: "text-green-400", bg: "bg-green-500/20" };
  };

  // Handle form submission
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const events: Events = {
        costMultiplier: 1 - costDiscount / 100,
        starCatching,
        safeguard,
        eventType: eventType as Events["eventType"] || undefined,
      };
      
      const result = calculateStarForce(itemLevel, currentLevel, targetLevel, "epic", "Regular", events);
      setCalculation(result);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  // Render progress bar
  const progress = calculation ? (calculation.currentLevel / 23) * 100 : 0;
  const dangerLevel = calculation ? getDangerLevel(calculation.currentLevel) : getDangerLevel(currentLevel);

  return (
    <Card className="bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-primary" />
          Advanced StarForce Calculator
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
              <label className="text-sm text-muted-foreground">Item Type</label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="superior">Superior (Tyrant)</SelectItem>
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
                max={23}
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
                max={23}
                className="mt-1"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Server</label>
              <Select value={server} onValueChange={setServer}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GMS">GMS (Global)</SelectItem>
                  <SelectItem value="KMS">KMS (Korea)</SelectItem>
                  <SelectItem value="MSEA">MSEA (SEA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Event Type</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Event</SelectItem>
                  <SelectItem value="5/10/15">5/10/15 Event</SelectItem>
                  <SelectItem value="30% Off">30% Off Event</SelectItem>
                  <SelectItem value="No Boom">No Boom Event</SelectItem>
                  <SelectItem value="Shining Star">Shining Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={safeguard} onCheckedChange={(checked) => setSafeguard(checked === true)} />
              <label className="text-sm text-muted-foreground">Safeguard (15-16★)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={starCatching} onCheckedChange={(checked) => setStarCatching(checked === true)} />
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
              max={50}
              step={5}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Calculate Enhancement Cost
          </Button>
        </form>

        {/* Results */}
        {calculation && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Star Details</TabsTrigger>
              <TabsTrigger value="recommendations">Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
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
                  <span>★23 (Max)</span>
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
                  <div className="text-2xl font-bold text-green-400">
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
                    <p className="font-semibold text-yellow-400">
                      {formatMesos(calculation.costPerAttempt)} mesos
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Total</span>
                    <p className="font-semibold text-yellow-400">
                      {formatMesos(calculation.averageCost)} mesos
                    </p>
                  </div>
                </div>
                {calculation.boomRate > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">Expected Booms: </span>
                      <span className="font-semibold text-red-400">
                        {calculation.averageBooms.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Per-Star Analysis</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Star</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Boom Rate</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.perStarStats.map((stat) => (
                      <TableRow key={stat.star}>
                        <TableCell className="font-medium">★{stat.star}</TableCell>
                        <TableCell className="text-green-400">{stat.successRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-red-400">{stat.boomRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-yellow-400">{formatMesos(stat.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Enhancement Tips
                </h4>
                {calculation.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {calculation.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-primary/10 border border-primary/20 rounded text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Your enhancement strategy looks good! Proceed with caution and good luck!
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
import { useState, useMemo } from "react";
import { StarForceCalculation, Events, Equipment } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calculator, Target, TrendingUp, AlertTriangle, Star, Info, Download, DollarSign, Sparkles, ChevronUp, ChevronDown, Edit, CheckCircle2, X, Heart, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentImage } from "@/components/EquipmentImage";

interface StarForceCalculatorProps {
  initialCalculation?: StarForceCalculation;
  equipment?: Equipment[];
  additionalEquipment?: Equipment[];
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  mode?: 'standalone' | 'equipment-table';
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

  const trials = 1000; // Increased for more consistent results
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

export function StarForceCalculator({ 
  initialCalculation, 
  equipment = [], 
  additionalEquipment = [],
  onUpdateStarforce,
  onUpdateActualCost,
  mode = 'standalone'
}: StarForceCalculatorProps) {
  // State for input fields (standalone mode)
  const [itemLevel, setItemLevel] = useState(150);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(17);
  const [server, setServer] = useState("Interactive");
  const [itemType, setItemType] = useState("regular");
  const [safeguard, setSafeguard] = useState(false);
  const [starCatching, setStarCatching] = useState(true);
  const [eventType, setEventType] = useState<string>("");
  const [costDiscount, setCostDiscount] = useState(0);
  const [yohiTapEvent, setYohiTapEvent] = useState(false); // The legendary luck
  
  // Enhanced settings for equipment mode
  const [enhancedSettings, setEnhancedSettings] = useState({
    discountEvent: true, // 30% off event
    starcatchEvent: true, // 5/10/15 event
    shiningStarForce: true, // Shining StarForce
    serverType: 'interactive' as 'interactive' | 'heroic',
    hasSpares: true
  });

  // Equipment table editing states
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [editingActualCost, setEditingActualCost] = useState<string | null>(null);
  const [tempActualCost, setTempActualCost] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );

  // Combine all equipment for table mode
  const allEquipment = [...equipment, ...additionalEquipment];
  const pendingEquipment = allEquipment.filter(eq => 
    eq.starforceable && (eq.currentStarForce || 0) < (eq.targetStarForce || 0)
  );

  // Calculate costs and statistics for equipment mode
  const equipmentCalculations = useMemo(() => {
    if (mode === 'standalone' || !pendingEquipment.length) return [];

    return pendingEquipment.map(eq => {
      const events = {
        costMultiplier: enhancedSettings.discountEvent ? 0.7 : 1,
        successRateBonus: enhancedSettings.starcatchEvent ? 1 : 0,
        starCatching,
        safeguard,
        eventType: enhancedSettings.starcatchEvent ? "5/10/15" as const : undefined
      };

      const calculation = calculateStarForce(
        eq.level,
        eq.currentStarForce || 0,
        eq.targetStarForce || 0,
        "epic",
        "Regular",
        events
      );

      return {
        equipment: eq,
        calculation,
        expectedCost: calculation.averageCost,
        actualCost: eq.actualCost || 0,
        luckPercentage: eq.actualCost && calculation.averageCost > 0 
          ? ((eq.actualCost - calculation.averageCost) / calculation.averageCost) * 100 
          : 0
      };
    });
  }, [pendingEquipment, enhancedSettings, starCatching, safeguard, mode]);

  // Aggregate statistics for equipment mode
  const totalExpectedCost = equipmentCalculations.reduce((sum, calc) => sum + calc.expectedCost, 0);
  const totalActualCost = equipmentCalculations.reduce((sum, calc) => sum + calc.actualCost, 0);
  const totalExpectedBooms = equipmentCalculations.reduce((sum, calc) => sum + calc.calculation.averageBooms, 0);
  
  const overallLuckPercentage = totalExpectedCost > 0 
    ? ((totalActualCost - totalExpectedCost) / totalExpectedCost) * 100 
    : 0;

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

  const getLuckColor = (percentage: number) => {
    if (percentage < -10) return "text-green-400"; // Very lucky
    if (percentage < 0) return "text-green-300"; // Lucky
    if (percentage > 25) return "text-red-400"; // Very unlucky
    if (percentage > 0) return "text-orange-400"; // Unlucky
    return "text-gray-400"; // No data
  };

  // Equipment table handlers
  const handleQuickAdjust = (equipment: Equipment, type: 'current' | 'target', delta: number) => {
    if (!onUpdateStarforce) return;
    
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    
    if (type === 'current') {
      const newCurrent = Math.max(0, Math.min(25, current + delta));
      onUpdateStarforce(equipment.id, newCurrent, target);
    } else {
      const newTarget = Math.max(0, Math.min(25, target + delta));
      onUpdateStarforce(equipment.id, current, newTarget);
    }
  };

  const handleStartEdit = (equipment: Equipment) => {
    setEditingStarforce(equipment.id);
    setTempValues({
      current: equipment.currentStarForce || 0,
      target: equipment.targetStarForce || 0
    });
  };

  const handleSaveEdit = (equipment: Equipment) => {
    if (onUpdateStarforce) {
      onUpdateStarforce(equipment.id, tempValues.current, tempValues.target);
    }
    setEditingStarforce(null);
  };

  const handleCancelEdit = () => {
    setEditingStarforce(null);
    setTempValues({ current: 0, target: 0 });
  };

  const handleStartActualCostEdit = (equipment: Equipment) => {
    setEditingActualCost(equipment.id);
    setTempActualCost(equipment.actualCost || 0);
  };

  const handleSaveActualCost = (equipment: Equipment) => {
    if (onUpdateActualCost) {
      onUpdateActualCost(equipment.id, tempActualCost);
    }
    setEditingActualCost(null);
  };

  const handleCancelActualCostEdit = () => {
    setEditingActualCost(null);
    setTempActualCost(0);
  };

  const exportData = () => {
    if (mode === 'standalone' && calculation) {
      // Standalone export
      const exportText = [
        `StarForce Calculator Export`,
        ``,
        `Item Level: ${itemLevel}`,
        `Current Star: ★${calculation.currentLevel}`,
        `Target Star: ★${calculation.targetLevel}`,
        ``,
        `Expected Cost: ${formatMesos(calculation.averageCost)} mesos`,
        `Expected Booms: ${calculation.averageBooms.toFixed(1)}`,
        `Success Rate: ${calculation.successRate}%`,
        ``,
        `Per-Star Details:`,
        ...calculation.perStarStats.map(stat => 
          `★${stat.star}: ${stat.successRate.toFixed(1)}% success, ${stat.boomRate.toFixed(1)}% boom, ${formatMesos(stat.cost)} cost`
        )
      ].join('\n');

      const blob = new Blob([exportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'starforce-calculation.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else if (mode === 'equipment-table') {
      // Equipment table export
      const exportText = equipmentCalculations.map(calc => {
        const eq = calc.equipment;
        return `${eq.name || 'Unknown'} (${eq.slot}): ★${eq.currentStarForce}→★${eq.targetStarForce} | Expected: ${formatMesos(calc.expectedCost)} | Actual: ${formatMesos(calc.actualCost)} | Luck: ${calc.luckPercentage.toFixed(1)}%`;
      }).join('\n');

      const blob = new Blob([
        `StarForce Planning Export\n\n`,
        `Total Expected Cost: ${formatMesos(totalExpectedCost)}\n`,
        `Total Actual Cost: ${formatMesos(totalActualCost)}\n`,
        `Overall Luck: ${overallLuckPercentage.toFixed(1)}%\n`,
        `Expected Booms: ${totalExpectedBooms.toFixed(1)}\n\n`,
        `Equipment Details:\n`,
        exportText
      ], { type: 'text/plain' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'starforce-plan.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle form submission (standalone mode)
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const events: Events = {
        costMultiplier: 1 - costDiscount / 100,
        starCatching,
        safeguard,
        eventType: eventType as Events["eventType"] || undefined,
      };
      
      let result = calculateStarForce(itemLevel, currentLevel, targetLevel, "epic", "Regular", events);
      
      // Apply Yohi's legendary luck - halves cost and spares needed!
      if (yohiTapEvent) {
        result = {
          ...result,
          averageCost: Math.round(result.averageCost * 0.5), // Yohi's luck halves the cost
          averageBooms: result.averageBooms * 0.5, // And the boom count
          costPerAttempt: Math.round(result.costPerAttempt * 0.5), // Per attempt cost too
          recommendations: [
            "🍀 Yohi Tap Event is active - all costs and spares have been halved due to supernatural luck!",
            ...result.recommendations
          ]
        };
      }
      
      setCalculation(result);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  // Render progress bar
  const progress = calculation ? (calculation.currentLevel / 23) * 100 : 0;
  const dangerLevel = calculation ? getDangerLevel(calculation.currentLevel) : getDangerLevel(currentLevel);

  // Equipment Table Mode
  if (mode === 'equipment-table') {
    return (
      <div className="space-y-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Enhancement Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="discount-event" className="text-sm">30% Off Event</Label>
                <Switch
                  id="discount-event"
                  checked={enhancedSettings.discountEvent}
                  onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, discountEvent: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="starcatch-event" className="text-sm">5/10/15 Event</Label>
                <Switch
                  id="starcatch-event"
                  checked={enhancedSettings.starcatchEvent}
                  onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, starcatchEvent: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shining-sf" className="text-sm">Shining StarForce</Label>
                <Switch
                  id="shining-sf"
                  checked={enhancedSettings.shiningStarForce}
                  onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, shiningStarForce: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="star-catching" className="text-sm">Star Catching</Label>
                <Switch
                  id="star-catching"
                  checked={starCatching}
                  onCheckedChange={(checked) => setStarCatching(checked)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Server Type</Label>
                <Select 
                  value={enhancedSettings.serverType} 
                  onValueChange={(value) => setEnhancedSettings(prev => ({ ...prev, serverType: value as 'interactive' | 'heroic' }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="heroic">Heroic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="has-spares" className="text-sm">Has Spares</Label>
                <Switch
                  id="has-spares"
                  checked={enhancedSettings.hasSpares}
                  onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, hasSpares: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="safeguard" className="text-sm">Use Safeguard</Label>
                <Switch
                  id="safeguard"
                  checked={safeguard}
                  onCheckedChange={(checked) => setSafeguard(checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{formatMesos(totalExpectedCost)}</div>
                  <div className="text-sm text-muted-foreground">Expected Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{formatMesos(totalActualCost)}</div>
                  <div className="text-sm text-muted-foreground">Actual Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalExpectedBooms.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Expected Booms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getLuckColor(overallLuckPercentage)}`}>
                    {overallLuckPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Luck Factor</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                StarForce Planning Table
              </CardTitle>
              <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {equipmentCalculations.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Pending Equipment</h3>
                <p className="text-muted-foreground">All equipment is already at target StarForce levels!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Current SF</TableHead>
                      <TableHead className="text-center">Target SF</TableHead>
                      <TableHead className="text-center">Expected Cost</TableHead>
                      <TableHead className="text-center">Actual Cost</TableHead>
                      <TableHead className="text-center">Luck</TableHead>
                      <TableHead className="text-center">Booms</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentCalculations.map((calc) => (
                      <TableRow 
                        key={calc.equipment.id}
                        onMouseEnter={() => setHoveredRow(calc.equipment.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="group"
                      >
                        <TableCell>
                          <EquipmentImage
                            src={calc.equipment.image}
                            alt={calc.equipment.name}
                            size="sm"
                            className="w-8 h-8"
                            maxRetries={2}
                            showFallback={true}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{calc.equipment.name || 'Unknown Item'}</div>
                            <div className="text-sm text-muted-foreground">{calc.equipment.slot}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingStarforce === calc.equipment.id ? (
                            <Input
                              type="number"
                              min="0"
                              max="25"
                              value={tempValues.current}
                              onChange={(e) => setTempValues(prev => ({ ...prev, current: parseInt(e.target.value) || 0 }))}
                              className="w-16 h-8 text-center"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">{calc.equipment.currentStarForce || 0}</span>
                              {/* Quick Adjust Buttons - Current SF */}
                              {hoveredRow === calc.equipment.id && (
                                <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc.equipment, 'current', 1)}
                                    className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  >
                                    <ChevronUp className="w-2 h-2 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc.equipment, 'current', -1)}
                                    className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  >
                                    <ChevronDown className="w-2 h-2 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingStarforce === calc.equipment.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="25"
                                value={tempValues.target}
                                onChange={(e) => setTempValues(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(calc.equipment)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Target className="w-3 h-3 text-primary" />
                              <span className="font-medium">{calc.equipment.targetStarForce || 0}</span>
                              {/* Quick Adjust Buttons - Target SF */}
                              {hoveredRow === calc.equipment.id && (
                                <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc.equipment, 'target', 1)}
                                    className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  >
                                    <ChevronUp className="w-2 h-2 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc.equipment, 'target', -1)}
                                    className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  >
                                    <ChevronDown className="w-2 h-2 text-red-600" />
                                  </Button>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(calc.equipment)}
                                className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-yellow-400">
                            {formatMesos(calc.expectedCost)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingActualCost === calc.equipment.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={tempActualCost}
                                onChange={(e) => setTempActualCost(parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                                placeholder="Mesos"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveActualCost(calc.equipment)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelActualCostEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium text-blue-400">
                                {calc.actualCost > 0 ? formatMesos(calc.actualCost) : '-'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartActualCostEdit(calc.equipment)}
                                className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-medium ${getLuckColor(calc.luckPercentage)}`}>
                            {calc.actualCost > 0 ? `${calc.luckPercentage.toFixed(1)}%` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="font-medium text-red-400">
                              {calc.calculation.averageBooms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Standalone Mode (original calculator)
  return (
    <Card className="bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-primary" />
            Advanced StarForce Calculator
          </div>
          {calculation && (
            <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
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
          
          {/* Yohi Tap Event - The legendary luck */}
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg">
            <Checkbox 
              checked={yohiTapEvent} 
              onCheckedChange={(checked) => setYohiTapEvent(checked === true)} 
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-yellow-400">
                🍀 Yohi Tap Event (Legendary Luck)
              </label>
              <p className="text-xs text-muted-foreground">
                Activates Yohi's supernatural luck - halves all costs and spares needed!
              </p>
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
};

export default StarForceCalculator;

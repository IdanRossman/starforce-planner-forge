import { useState, useMemo, useCallback, useEffect } from "react";
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
import { Calculator, Target, TrendingUp, TrendingDown, AlertTriangle, Star, Info, Download, DollarSign, Sparkles, ChevronUp, ChevronDown, Edit, CheckCircle2, X, Heart, Settings, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
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
  characterId?: string; // For per-character localStorage
  characterName?: string; // Fallback for characters without ID
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
      medianCost: 0,
      p75Cost: 0,
      averageBooms: 0,
      medianBooms: 0,
      p75Booms: 0,
      successRate: 100,
      boomRate: 0,
      costPerAttempt: 0,
      perStarStats: [],
      recommendations: [],
    };
  }

  const trials = 1000; // Increased for more consistent results
  const costResults: number[] = []; // Store all cost results for median calculation
  const boomResults: number[] = []; // Store all boom results for median calculation
  
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
    costResults.push(mesoResult);
    boomResults.push(boomResult);
  }

  // Calculate average values
  const avgCost = costResults.reduce((sum, cost) => sum + cost, 0) / trials;
  const avgBooms = boomResults.reduce((sum, booms) => sum + booms, 0) / trials;

  // Calculate median values
  const sortedCosts = [...costResults].sort((a, b) => a - b);
  const sortedBooms = [...boomResults].sort((a, b) => a - b);
  
  const medianCost = trials % 2 === 0
    ? (sortedCosts[trials / 2 - 1] + sortedCosts[trials / 2]) / 2
    : sortedCosts[Math.floor(trials / 2)];
    
  const medianBooms = trials % 2 === 0
    ? (sortedBooms[trials / 2 - 1] + sortedBooms[trials / 2]) / 2
    : sortedBooms[Math.floor(trials / 2)];

  // Calculate 75th percentile values
  const p75Index = Math.floor(trials * 0.75);
  const p75Cost = sortedCosts[p75Index];
  const p75Booms = sortedBooms[p75Index];

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
    averageBooms: Math.round(avgBooms * 100) / 100,
    medianCost: Math.round(medianCost),
    medianBooms: Math.round(medianBooms * 100) / 100,
    p75Cost: Math.round(p75Cost),
    p75Booms: Math.round(p75Booms * 100) / 100,
    successRate: Math.round((trials / trials) * 10000) / 100, // Simplified
    boomRate: Math.round((avgBooms / 5) * 10000) / 100, // Estimated
    costPerAttempt: Math.round(avgCost / 10), // Estimated
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
  mode = 'standalone',
  characterId,
  characterName
}: StarForceCalculatorProps) {
  // Helper functions for per-character localStorage
  const getCharacterStorageKey = useCallback((key: string) => {
    if (mode === 'equipment-table') {
      if (characterId) {
        return `starforce-${key}-${characterId}`;
      } else if (characterName) {
        // Use character name as fallback for existing characters without ID
        return `starforce-${key}-${characterName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    }
    return `starforce-${key}`;
  }, [characterId, characterName, mode]);

  const loadCharacterSettings = useCallback((key: string, defaultValue: unknown) => {
    try {
      const storageKey = getCharacterStorageKey(key);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  }, [getCharacterStorageKey]);

  const saveCharacterSettings = useCallback((key: string, value: unknown) => {
    try {
      const storageKey = getCharacterStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, [getCharacterStorageKey]);
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
  
  // Enhanced settings for equipment mode with localStorage persistence
  const [enhancedSettings, setEnhancedSettings] = useState(() => {
    const defaultSettings = {
      discountEvent: false, // 30% off event
      starcatchEvent: false, // 5/10/15 event
      starCatching: true, // Star catching enabled globally
      isInteractive: false, // Interactive server toggle
      spareCount: 0, // Number of spares
      sparePrice: 0, // Price per spare in mesos
    };
    
    return loadCharacterSettings('settings', defaultSettings);
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveCharacterSettings('settings', enhancedSettings);
  }, [enhancedSettings, saveCharacterSettings]);

  // Equipment table editing states
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [editingActualCost, setEditingActualCost] = useState<string | null>(null);
  const [tempActualCost, setTempActualCost] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  // Per-item safeguard settings
  const [itemSafeguard, setItemSafeguard] = useState<{ [equipmentId: string]: boolean }>(() => {
    return loadCharacterSettings('item-safeguard', {}) as { [equipmentId: string]: boolean };
  });
  
  // Per-item spare count
  const [itemSpares, setItemSpares] = useState<{ [equipmentId: string]: number }>(() => {
    return loadCharacterSettings('item-spares', {}) as { [equipmentId: string]: number };
  });
  
  // Per-item spare prices (for Interactive server)
  const [itemSparePrices, setItemSparePrices] = useState<{ [equipmentId: string]: { value: number; unit: 'M' | 'B' } }>(() => {
    return loadCharacterSettings('item-spare-prices', {}) as { [equipmentId: string]: { value: number; unit: 'M' | 'B' } };
  });
  
  // Per-item actual costs with units
  const [itemActualCosts, setItemActualCosts] = useState<{ [equipmentId: string]: { value: number; unit: 'M' | 'B' } }>(() => {
    return loadCharacterSettings('item-actual-costs', {}) as { [equipmentId: string]: { value: number; unit: 'M' | 'B' } };
  });
  
  // Column sorting state
  type SortField = 'name' | 'currentStarForce' | 'targetStarForce' | 'averageCost' | 'medianCost' | 'p75Cost' | 'averageBooms' | 'medianBooms' | 'p75Booms' | 'actualCost' | 'luckPercentage';
  type SortDirection = 'asc' | 'desc' | null;
  
  const [sortField, setSortField] = useState<SortField | null>(() => {
    return loadCharacterSettings('sort-field', null) as SortField | null;
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    return loadCharacterSettings('sort-direction', null) as SortDirection;
  });
  
  // Per-item include/exclude state (default to included)
  const [itemIncluded, setItemIncluded] = useState<{ [equipmentId: string]: boolean }>(() => {
    return loadCharacterSettings('item-included', {}) as { [equipmentId: string]: boolean };
  });
  
  // Save per-item settings to localStorage
  useEffect(() => {
    saveCharacterSettings('item-safeguard', itemSafeguard);
  }, [itemSafeguard, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-spares', itemSpares);
  }, [itemSpares, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-spare-prices', itemSparePrices);
  }, [itemSparePrices, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-actual-costs', itemActualCosts);
  }, [itemActualCosts, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('sort-field', sortField);
  }, [sortField, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('sort-direction', sortDirection);
  }, [sortDirection, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-included', itemIncluded);
  }, [itemIncluded, saveCharacterSettings]);
  
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );

  // Combine all equipment for table mode - memoized to prevent recalculation on hover
  const pendingEquipment = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.filter(eq => 
      eq.starforceable && (eq.currentStarForce || 0) < (eq.targetStarForce || 0)
    );
  }, [equipment, additionalEquipment]);

  // Calculate costs and statistics for equipment mode
  const equipmentCalculations = useMemo(() => {
    if (mode === 'standalone' || !pendingEquipment.length) return [];

    const calculations = pendingEquipment.map(eq => {
      const events = {
        costMultiplier: enhancedSettings.discountEvent ? 0.7 : 1,
        successRateBonus: enhancedSettings.starcatchEvent ? 1 : 0,
        starCatching: enhancedSettings.starCatching !== false, // Use global star catching setting
        safeguard: itemSafeguard[eq.id] || false, // Use per-item safeguard
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

      // Calculate spare costs for Interactive server
      let spareCostMultiplier = 0;
      if (enhancedSettings.isInteractive && itemSparePrices[eq.id]) {
        const sparePrice = itemSparePrices[eq.id];
        const sparePriceInMesos = sparePrice.unit === 'B' 
          ? sparePrice.value * 1000000000 
          : sparePrice.value * 1000000;
        spareCostMultiplier = sparePriceInMesos;
      }

      // Calculate total costs including spare items
      const enhancementCost = calculation.averageCost;
      const totalAverageCost = enhancementCost + (calculation.averageBooms * spareCostMultiplier);
      const totalMedianCost = calculation.medianCost + (calculation.medianBooms * spareCostMultiplier);
      const totalP75Cost = calculation.p75Cost + (calculation.p75Booms * spareCostMultiplier);

      return {
        equipment: eq,
        calculation: {
          ...calculation,
          averageCost: Math.round(totalAverageCost),
          medianCost: Math.round(totalMedianCost),
          p75Cost: Math.round(totalP75Cost),
        },
        expectedCost: Math.round(totalAverageCost),
        actualCost: eq.actualCost || 0,
        luckPercentage: eq.actualCost && totalAverageCost > 0 
          ? ((eq.actualCost - totalAverageCost) / totalAverageCost) * 100 
          : 0,
        spareCostBreakdown: {
          enhancementCost,
          averageSpareCost: calculation.averageBooms * spareCostMultiplier,
          medianSpareCost: calculation.medianBooms * spareCostMultiplier,
          p75SpareCost: calculation.p75Booms * spareCostMultiplier
        },
        // Pre-calculate spare status and related UI data
        spareStatus: (() => {
          const spares = itemSpares[eq.id] || 0;
          const boomChance = calculation.averageBooms;
          
          if (boomChance === 0) return "none-needed";
          if (spares === 0) return "none-available";
          if (spares < Math.ceil(boomChance)) return "insufficient";
          if (spares >= Math.ceil(boomChance * 1.5)) return "excess";
          return "adequate";
        })(),
        spareClassName: (() => {
          const spares = itemSpares[eq.id] || 0;
          const boomChance = calculation.averageBooms;
          
          if (boomChance === 0) return "";
          if (spares === 0) return boomChance > 0 ? "border-orange-500 bg-orange-950/30 text-orange-200" : "";
          if (spares < Math.ceil(boomChance)) return "border-red-500 bg-red-950/30 text-red-200";
          if (spares >= Math.ceil(boomChance * 1.5)) return "border-blue-500 bg-blue-950/30 text-blue-200";
          return "border-green-500 bg-green-950/30 text-green-200";
        })(),
        spareTitle: (() => {
          const spares = itemSpares[eq.id] || 0;
          const expectedBooms = calculation.averageBooms;
          
          if (expectedBooms === 0) return "No booms expected";
          if (spares === 0) return expectedBooms > 0 ? `${expectedBooms.toFixed(1)} booms expected - consider getting spares` : "";
          if (spares < Math.ceil(expectedBooms)) return `Need ${Math.ceil(expectedBooms)} spares (${expectedBooms.toFixed(1)} expected booms)`;
          if (spares >= Math.ceil(expectedBooms * 1.5)) return `More than enough spares`;
          return `Good! ${Math.ceil(expectedBooms)} spares recommended`;
        })()
      };
    });

    // Apply sorting if specified
    if (sortField && sortDirection) {
      calculations.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case 'name':
            aValue = (a.equipment.name || '').toLowerCase();
            bValue = (b.equipment.name || '').toLowerCase();
            break;
          case 'currentStarForce':
            aValue = a.equipment.currentStarForce || 0;
            bValue = b.equipment.currentStarForce || 0;
            break;
          case 'targetStarForce':
            aValue = a.equipment.targetStarForce || 0;
            bValue = b.equipment.targetStarForce || 0;
            break;
          case 'averageCost':
            aValue = a.expectedCost;
            bValue = b.expectedCost;
            break;
          case 'medianCost':
            aValue = a.calculation.medianCost;
            bValue = b.calculation.medianCost;
            break;
          case 'p75Cost':
            aValue = a.calculation.p75Cost;
            bValue = b.calculation.p75Cost;
            break;
          case 'averageBooms':
            aValue = a.calculation.averageBooms;
            bValue = b.calculation.averageBooms;
            break;
          case 'medianBooms':
            aValue = a.calculation.medianBooms;
            bValue = b.calculation.medianBooms;
            break;
          case 'p75Booms':
            aValue = a.calculation.p75Booms;
            bValue = b.calculation.p75Booms;
            break;
          case 'actualCost':
            aValue = a.actualCost;
            bValue = b.actualCost;
            break;
          case 'luckPercentage':
            aValue = a.luckPercentage;
            bValue = b.luckPercentage;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue as string)
            : (bValue as string).localeCompare(aValue);
        } else {
          return sortDirection === 'asc' 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        }
      });
    }

    return calculations;
  }, [pendingEquipment, enhancedSettings, itemSafeguard, itemSparePrices, itemSpares, mode, sortField, sortDirection]);

  // Aggregate statistics for equipment mode - memoized to prevent recalculation on hover
  const aggregateStats = useMemo(() => {
    // Only include equipment that is marked as included (default to included if not set)
    const includedCalculations = equipmentCalculations.filter(calc => 
      itemIncluded[calc.equipment.id] !== false // Include by default
    );

    const totalExpectedCost = includedCalculations.reduce((sum, calc) => sum + calc.expectedCost, 0);
    const totalActualCost = includedCalculations.reduce((sum, calc) => sum + calc.actualCost, 0);
    const totalExpectedBooms = includedCalculations.reduce((sum, calc) => sum + calc.calculation.averageBooms, 0);
    const totalMedianBooms = includedCalculations.reduce((sum, calc) => sum + calc.calculation.medianBooms, 0);
    const totalP75Cost = includedCalculations.reduce((sum, calc) => sum + calc.calculation.p75Cost, 0);
    const totalP75Booms = includedCalculations.reduce((sum, calc) => sum + calc.calculation.p75Booms, 0);
    
    const overallLuckPercentage = totalExpectedCost > 0 && totalActualCost > 0
      ? ((totalActualCost - totalExpectedCost) / totalExpectedCost) * 100 
      : 0;

    // Check if any actual costs have been entered
    const hasActualCosts = totalActualCost > 0;

    return {
      totalExpectedCost,
      totalActualCost,
      totalExpectedBooms,
      totalMedianBooms,
      totalP75Cost,
      totalP75Booms,
      overallLuckPercentage,
      hasActualCosts,
      includedCount: includedCalculations.length,
      totalCount: equipmentCalculations.length
    };
  }, [equipmentCalculations, itemIncluded]);

  // Sorting helper functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycling through: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-primary" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 text-primary" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
  };

  // Include/exclude helper functions
  const toggleItemIncluded = (equipmentId: string) => {
    setItemIncluded(prev => ({ 
      ...prev, 
      [equipmentId]: prev[equipmentId] === false ? true : false 
    }));
  };

  const isItemIncluded = (equipmentId: string) => {
    return itemIncluded[equipmentId] !== false; // Default to included
  };

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

  const getLuckText = (percentage: number) => {
    if (percentage === 0) return "";
    if (percentage < -25) return "Far below avg";
    if (percentage < -10) return "Below avg";
    if (percentage < 0) return "Below avg";
    if (percentage <= 10) return "Above avg";
    if (percentage <= 25) return "Above avg";
    return "Far above avg";
  };

  // Helper function to check if safeguard is applicable for an item
  const isSafeguardEligible = useCallback((equipment: Equipment) => {
    if (!equipment.starforceable) return false;
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    // Safeguard is useful for attempting 15★ and 16★
    return target > 15;
  }, []);

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
    // Initialize with current value or convert from legacy actualCost
    const currentCost = itemActualCosts[equipment.id];
    if (currentCost) {
      setTempActualCost(currentCost.value);
    } else if (equipment.actualCost && equipment.actualCost > 0) {
      // Convert legacy actualCost to M/B format
      const value = equipment.actualCost >= 1000000000 ? equipment.actualCost / 1000000000 : equipment.actualCost / 1000000;
      const unit = equipment.actualCost >= 1000000000 ? 'B' : 'M';
      setTempActualCost(Math.round(value * 10) / 10); // Round to 1 decimal
      setItemActualCosts(prev => ({ ...prev, [equipment.id]: { value: Math.round(value * 10) / 10, unit } }));
    } else {
      setTempActualCost(0);
    }
  };

  const handleSaveActualCost = (equipment: Equipment) => {
    const unit = itemActualCosts[equipment.id]?.unit || 'M';
    const rawValue = unit === 'B' ? tempActualCost * 1000000000 : tempActualCost * 1000000;
    
    if (onUpdateActualCost) {
      onUpdateActualCost(equipment.id, rawValue);
    }
    
    // Update our local state
    setItemActualCosts(prev => ({ 
      ...prev, 
      [equipment.id]: { value: tempActualCost, unit } 
    }));
    
    setEditingActualCost(null);
  };

  const handleCancelActualCostEdit = () => {
    setEditingActualCost(null);
    setTempActualCost(0);
  };

  const exportData = () => {
    // Helper function to convert raw mesos to unitized format
    const formatMesosForExport = (amount: number): string => {
      if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
      return amount.toString();
    };

    if (mode === 'standalone' && calculation) {
      // Standalone export - CSV format with unitized values
      const csvRows = [
        ['StarForce Calculator Export'],
        [''],
        ['Setting', 'Value'],
        ['Item Level', itemLevel.toString()],
        ['Current Star', `★${calculation.currentLevel}`],
        ['Target Star', `★${calculation.targetLevel}`],
        [''],
        ['Cost Statistics', 'Amount (Unitized)'],
        ['Average Cost', formatMesosForExport(calculation.averageCost)],
        ['Median Cost', formatMesosForExport(calculation.medianCost)],
        ['75th Percentile Cost', formatMesosForExport(calculation.p75Cost)],
        [''],
        ['Boom Statistics', 'Count'],
        ['Average Booms', calculation.averageBooms.toFixed(1)],
        ['Median Booms', calculation.medianBooms.toFixed(1)],
        ['75th Percentile Booms', calculation.p75Booms.toFixed(1)],
        [''],
        ['Per-Star Details', 'Success Rate (%)', 'Boom Rate (%)', 'Cost (Unitized)'],
        ...calculation.perStarStats.map(stat => 
          [`★${stat.star}`, stat.successRate.toFixed(1), stat.boomRate.toFixed(1), formatMesosForExport(stat.cost)]
        )
      ];

      const csvContent = csvRows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'starforce-calculation.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (mode === 'equipment-table') {
      // Equipment table export - CSV format with unitized values
      const summaryRows = [
        ['StarForce Planning Summary'],
        [''],
        ['Statistic', 'Value (Unitized)', 'Status'],
        ['Total Expected Cost', formatMesosForExport(aggregateStats.totalExpectedCost), ''],
        ['Total Actual Cost', formatMesosForExport(aggregateStats.totalActualCost), ''],
        ['Overall Luck Percentage', `${aggregateStats.overallLuckPercentage.toFixed(1)}%`, getLuckText(aggregateStats.overallLuckPercentage)],
        ['Total Average Booms', aggregateStats.totalExpectedBooms.toFixed(1), ''],
        ['Total Median Booms', aggregateStats.totalMedianBooms.toFixed(1), ''],
        ['Total 75th Percentile Cost', formatMesosForExport(aggregateStats.totalP75Cost), ''],
        ['Total 75th Percentile Booms', aggregateStats.totalP75Booms.toFixed(1), ''],
        [''],
        ['Equipment Details'],
        ['Item Name', 'Slot', 'Current SF', 'Target SF', 'Safeguard', 'Spares', 
         ...(enhancedSettings.isInteractive ? ['Spare Price'] : []),
         'Expected Cost', 'Median Cost', '75th % Cost', 'Average Booms', 'Median Booms', '75th % Booms',
         'Actual Cost', 'Luck %', 'Luck Status'],
        ...equipmentCalculations.map(calc => {
          const eq = calc.equipment;
          const sparePriceInfo = itemSparePrices[eq.id];
          const sparePriceFormatted = sparePriceInfo ? `${sparePriceInfo.value}${sparePriceInfo.unit}` : '0';

          return [
            eq.name || 'Unknown',
            eq.slot || '',
            `★${eq.currentStarForce || 0}`,
            `★${eq.targetStarForce || 0}`,
            itemSafeguard[eq.id] ? 'Yes' : 'No',
            (itemSpares[eq.id] || 0).toString(),
            ...(enhancedSettings.isInteractive ? [sparePriceFormatted] : []),
            formatMesosForExport(calc.expectedCost),
            formatMesosForExport(calc.calculation.medianCost),
            formatMesosForExport(calc.calculation.p75Cost),
            calc.calculation.averageBooms.toFixed(1),
            calc.calculation.medianBooms.toFixed(1),
            calc.calculation.p75Booms.toFixed(1),
            calc.actualCost > 0 ? formatMesosForExport(calc.actualCost) : '0',
            calc.actualCost > 0 ? calc.luckPercentage.toFixed(1) : '0',
            calc.actualCost > 0 ? getLuckText(calc.luckPercentage) : 'No data'
          ];
        })
      ];

      const csvContent = summaryRows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'starforce-plan.csv';
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
            {/* Event Settings */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Enhancement Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="discount-event"
                    checked={enhancedSettings.discountEvent}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, discountEvent: checked }))}
                  />
                  <Label htmlFor="discount-event" className="text-sm cursor-pointer">30% Off Event</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="starcatch-event"
                    checked={enhancedSettings.starcatchEvent}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, starcatchEvent: checked }))}
                  />
                  <Label htmlFor="starcatch-event" className="text-sm cursor-pointer">5/10/15 Event</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="star-catching"
                    checked={enhancedSettings.starCatching !== false}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, starCatching: checked }))}
                  />
                  <Label htmlFor="star-catching" className="text-sm cursor-pointer">Star Catching</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="interactive-server"
                    checked={enhancedSettings.isInteractive}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, isInteractive: checked }))}
                  />
                  <Label htmlFor="interactive-server" className="text-sm cursor-pointer">Interactive Server</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Status Summary */}
        {aggregateStats.totalCount > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {aggregateStats.includedCount} of {aggregateStats.totalCount} items included
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {aggregateStats.totalCount - aggregateStats.includedCount > 0 
                        ? `${aggregateStats.totalCount - aggregateStats.includedCount} items excluded from calculations`
                        : 'All items included in calculations'
                      }
                    </div>
                  </div>
                </div>
                {aggregateStats.totalCount - aggregateStats.includedCount > 0 && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
                    Some items excluded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Overview */}
        <div className={`grid grid-cols-${aggregateStats.hasActualCosts ? '5' : '4'} gap-4`}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{formatMesos(aggregateStats.totalExpectedCost)}</div>
                  <div className="text-sm text-muted-foreground">Average Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{formatMesos(aggregateStats.totalExpectedCost * 0.85)}</div>
                  <div className="text-sm text-muted-foreground">Median Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{formatMesos(aggregateStats.totalP75Cost)}</div>
                  <div className="text-sm text-muted-foreground">75th % Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{formatMesos(aggregateStats.totalActualCost)}</div>
                  <div className="text-sm text-muted-foreground">Actual Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {aggregateStats.hasActualCosts && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    aggregateStats.overallLuckPercentage > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                  }`}>
                    {aggregateStats.overallLuckPercentage > 0 ? 
                      <TrendingDown className="w-5 h-5 text-red-500" /> :
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getLuckColor(aggregateStats.overallLuckPercentage)} flex flex-col`}>
                      <span>{aggregateStats.overallLuckPercentage.toFixed(1)}%</span>
                      {getLuckText(aggregateStats.overallLuckPercentage) && (
                        <span className="text-sm opacity-75">{getLuckText(aggregateStats.overallLuckPercentage)}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">vs Average Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('name')}
                        >
                          <span className="flex items-center gap-1">
                            Item
                            {getSortIcon('name')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('currentStarForce')}
                        >
                          <span className="flex items-center gap-1">
                            Current SF
                            {getSortIcon('currentStarForce')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('targetStarForce')}
                        >
                          <span className="flex items-center gap-1">
                            Target SF
                            {getSortIcon('targetStarForce')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">Safeguard</TableHead>
                      <TableHead className="text-center">Spares</TableHead>
                      {enhancedSettings.isInteractive && (
                        <TableHead className="text-center">Spare Price</TableHead>
                      )}
                      <TableHead className="text-center" title={enhancedSettings.isInteractive ? "Enhancement cost + expected spare costs" : "Expected enhancement cost only"}>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('averageCost')}
                        >
                          <span className="flex items-center gap-1">
                            Average Cost
                            {getSortIcon('averageCost')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center" title={enhancedSettings.isInteractive ? "Enhancement cost + median spare costs" : "Median enhancement cost only"}>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('medianCost')}
                        >
                          <span className="flex items-center gap-1">
                            Median Cost
                            {getSortIcon('medianCost')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center" title={enhancedSettings.isInteractive ? "Enhancement cost + 75th percentile spare costs" : "75th percentile enhancement cost only"}>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('p75Cost')}
                        >
                          <span className="flex items-center gap-1">
                            75th % Cost
                            {getSortIcon('p75Cost')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('averageBooms')}
                        >
                          <span className="flex items-center gap-1">
                            Avg Booms
                            {getSortIcon('averageBooms')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('medianBooms')}
                        >
                          <span className="flex items-center gap-1">
                            Med Booms
                            {getSortIcon('medianBooms')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('p75Booms')}
                        >
                          <span className="flex items-center gap-1">
                            75th % Booms
                            {getSortIcon('p75Booms')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('actualCost')}
                        >
                          <span className="flex items-center gap-1">
                            Actual Cost
                            {getSortIcon('actualCost')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent"
                          onClick={() => handleSort('luckPercentage')}
                        >
                          <span className="flex items-center gap-1">
                            Luck
                            {getSortIcon('luckPercentage')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentCalculations.map((calc) => {
                      const included = isItemIncluded(calc.equipment.id);
                      return (
                        <TableRow 
                          key={calc.equipment.id}
                          onMouseEnter={() => setHoveredRow(calc.equipment.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`group transition-opacity ${included ? '' : 'opacity-50 bg-muted/30'}`}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <div className="relative flex-shrink-0">
                                <EquipmentImage
                                  src={calc.equipment.image}
                                  alt={calc.equipment.name}
                                  size="sm"
                                  className="w-8 h-8"
                                  maxRetries={2}
                                  showFallback={true}
                                />
                                {!included && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                    <EyeOff className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
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
                          {/* Safeguard Toggle */}
                          <div className="flex items-center justify-center">
                            {isSafeguardEligible(calc.equipment) ? (
                              <Switch
                                checked={itemSafeguard[calc.equipment.id] || false}
                                onCheckedChange={(checked) => {
                                  console.log(`Setting safeguard for ${calc.equipment.id}: ${checked}`);
                                  setItemSafeguard(prev => ({ ...prev, [calc.equipment.id]: checked }));
                                }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground" title="Safeguard only applies when targeting 15-16★">
                                N/A
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Spares Input */}
                          <div className="flex items-center justify-center gap-1">
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="99"
                                value={itemSpares[calc.equipment.id] || 0}
                                onChange={(e) => {
                                  const spares = parseInt(e.target.value) || 0;
                                  setItemSpares(prev => ({ ...prev, [calc.equipment.id]: spares }));
                                }}
                                className={`w-16 h-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${calc.spareClassName}`}
                                placeholder="0"
                                title={calc.spareTitle}
                              />
                            </div>
                            {/* Quick Adjust Buttons - Spares */}
                            {hoveredRow === calc.equipment.id && (
                              <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const current = itemSpares[calc.equipment.id] || 0;
                                    setItemSpares(prev => ({ ...prev, [calc.equipment.id]: Math.min(99, current + 1) }));
                                  }}
                                  className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                >
                                  <ChevronUp className="w-2 h-2 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const current = itemSpares[calc.equipment.id] || 0;
                                    setItemSpares(prev => ({ ...prev, [calc.equipment.id]: Math.max(0, current - 1) }));
                                  }}
                                  className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <ChevronDown className="w-2 h-2 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {enhancedSettings.isInteractive && (
                          <TableCell className="text-center">
                            {/* Spare Price Input */}
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={itemSparePrices[calc.equipment.id]?.value || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setItemSparePrices(prev => ({ 
                                    ...prev, 
                                    [calc.equipment.id]: { 
                                      value, 
                                      unit: prev[calc.equipment.id]?.unit || 'M' 
                                    } 
                                  }));
                                }}
                                className="w-16 h-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                placeholder="0"
                              />
                              <Select
                                value={itemSparePrices[calc.equipment.id]?.unit || 'M'}
                                onValueChange={(unit: 'M' | 'B') => {
                                  setItemSparePrices(prev => ({ 
                                    ...prev, 
                                    [calc.equipment.id]: { 
                                      value: prev[calc.equipment.id]?.value || 0, 
                                      unit 
                                    } 
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-16 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">M</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-yellow-400">
                              {formatMesos(calc.expectedCost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.averageSpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos(calc.spareCostBreakdown.enhancementCost)} + Spares: ${formatMesos(calc.spareCostBreakdown.averageSpareCost)}`}>
                                (+{formatMesos(calc.spareCostBreakdown.averageSpareCost)} spares)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-orange-400">
                              {formatMesos(calc.calculation.medianCost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.medianSpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos(calc.calculation.medianCost - calc.spareCostBreakdown.medianSpareCost)} + Spares: ${formatMesos(calc.spareCostBreakdown.medianSpareCost)}`}>
                                (+{formatMesos(calc.spareCostBreakdown.medianSpareCost)} spares)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-red-400">
                              {formatMesos(calc.calculation.p75Cost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.p75SpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos(calc.calculation.p75Cost - calc.spareCostBreakdown.p75SpareCost)} + Spares: ${formatMesos(calc.spareCostBreakdown.p75SpareCost)}`}>
                                (+{formatMesos(calc.spareCostBreakdown.p75SpareCost)} spares)
                              </span>
                            )}
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
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="font-medium text-orange-400">
                              {calc.calculation.medianBooms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span className="font-medium text-red-600">
                              {calc.calculation.p75Booms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingActualCost === calc.equipment.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={tempActualCost}
                                onChange={(e) => setTempActualCost(parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                placeholder="0"
                                step="0.1"
                              />
                              <Select
                                value={itemActualCosts[calc.equipment.id]?.unit || 'M'}
                                onValueChange={(unit: 'M' | 'B') => {
                                  setItemActualCosts(prev => ({ 
                                    ...prev, 
                                    [calc.equipment.id]: { 
                                      value: prev[calc.equipment.id]?.value || 0, 
                                      unit 
                                    } 
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-16 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">M</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                </SelectContent>
                              </Select>
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
                            {calc.actualCost > 0 ? (
                              <div className="flex flex-col">
                                <span>{calc.luckPercentage.toFixed(1)}%</span>
                                {getLuckText(calc.luckPercentage) && (
                                  <span className="text-xs opacity-75">{getLuckText(calc.luckPercentage)}</span>
                                )}
                              </div>
                            ) : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Actions */}
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleItemIncluded(calc.equipment.id)}
                              className={`h-7 w-7 p-0 ${
                                included 
                                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                              }`}
                              title={included ? "Exclude from calculations" : "Include in calculations"}
                            >
                              {included ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (onUpdateStarforce) {
                                  onUpdateStarforce(calc.equipment.id, calc.equipment.targetStarForce || 0, calc.equipment.targetStarForce || 0);
                                }
                              }}
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Mark as completed (set current = target)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (onUpdateStarforce) {
                                  onUpdateStarforce(calc.equipment.id, 0, 0);
                                }
                              }}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Remove from planning (set target = current)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
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
                  <div>
                    <span className="text-muted-foreground">Median Total</span>
                    <p className="font-semibold text-orange-400">
                      {formatMesos(calculation.medianCost)} mesos
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">75th % Total</span>
                    <p className="font-semibold text-red-400">
                      {formatMesos(calculation.p75Cost)} mesos
                    </p>
                  </div>
                </div>
                {calculation.boomRate > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <div className="text-sm">
                        <span className="text-muted-foreground">Average Booms: </span>
                        <span className="font-semibold text-red-400">
                          {calculation.averageBooms.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <div className="text-sm">
                        <span className="text-muted-foreground">Median Booms: </span>
                        <span className="font-semibold text-orange-400">
                          {calculation.medianBooms.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-600/10 border border-red-600/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <div className="text-sm">
                        <span className="text-muted-foreground">75th % Booms: </span>
                        <span className="font-semibold text-red-600">
                          {calculation.p75Booms.toFixed(1)}
                        </span>
                      </div>
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

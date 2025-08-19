import { useState, useEffect, useMemo, useCallback } from 'react';
import { Equipment, StarForceCalculation } from '../../types';
import { 
  calculateBulkStarforce, 
  convertToMesos, 
  BulkEnhancedStarforceRequestDto, 
  LuckAnalysisDto 
} from '../../services/starforceService';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// Types
export interface EquipmentCalculation {
  // Equipment identification
  id: string;
  name?: string;
  slot: string;
  type: string;
  level: number;
  image?: string;
  
  // Star force progression
  currentStarForce: number;
  targetStarForce: number;
  starforceable: boolean;
  
  // Cost calculations
  averageCost: number;
  medianCost: number;
  p75Cost: number;
  
  // Boom/spare calculations
  averageBooms: number;
  medianBooms: number;
  p75Booms: number;
  
  // User tracking data
  actualCost: number;
  luckPercentage: number;
  luckAnalysis?: LuckAnalysisDto;
  
  // Spare cost breakdown
  spareCostBreakdown: {
    enhancementCost: number;
    averageSpareCost: number;
    medianSpareCost: number;
    p75SpareCost: number;
  };
  
  // UI-specific pre-calculated data
  spareStatus: string;
  spareClassName: string;
  spareTitle: string;
}

export type SortField = 'name' | 'currentStarForce' | 'targetStarForce' | 'averageCost' | 'medianCost' | 'p75Cost' | 'averageBooms' | 'medianBooms' | 'p75Booms' | 'actualCost' | 'luckPercentage';
export type SortDirection = 'asc' | 'desc' | null;

export interface GlobalSettings {
  thirtyPercentOff: boolean;  // 30% cost reduction event
  fiveTenFifteenEvent: boolean;  // 100% success at ★5, ★10, ★15 event
  starCatching: boolean;
  isInteractive: boolean;
}

export interface ItemSettings {
  [equipmentId: string]: boolean;
}

export interface ItemSpares {
  [equipmentId: string]: number;
}

export interface ItemPrices {
  [equipmentId: string]: { value: number; unit: 'M' | 'B' };
}

export interface UseStarForceCalculationOptions {
  mode?: 'standalone' | 'equipment-table';
  equipment?: Equipment[];
  additionalEquipment?: Equipment[];
  globalSettings: GlobalSettings;
  itemSafeguard: ItemSettings;
  itemSpares: ItemSpares;
  itemSparePrices: ItemPrices;
  itemActualCosts: ItemPrices;
  itemIncluded: ItemSettings;
  sortField: SortField | null;
  sortDirection: SortDirection;
  initialCalculation?: StarForceCalculation;
}

export interface UseSortingReturn {
  handleSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => JSX.Element;
}

export function useStarForceCalculation({
  mode = 'standalone',
  equipment = [],
  additionalEquipment = [],
  globalSettings,
  itemSafeguard,
  itemSpares,
  itemSparePrices,
  itemActualCosts,
  itemIncluded,
  sortField,
  sortDirection,
  initialCalculation
}: UseStarForceCalculationOptions) {
  
  // Calculation state
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);
  const [equipmentCalculations, setEquipmentCalculations] = useState<EquipmentCalculation[]>([]);

  // Combine all equipment for table mode - memoized to prevent recalculation
  const pendingEquipment = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.filter(eq => 
      eq.starforceable && (eq.currentStarForce || 0) < (eq.targetStarForce || 0)
    );
  }, [equipment, additionalEquipment]);

  // Enhanced luck rating helper
  const getEnhancedLuckRating = useCallback((percentile: number) => {
    if (percentile <= 10) return { 
      rating: "Godlike luck 🍀", 
      color: "text-emerald-400",
      shareMessage: `🍀 Godlike luck! Spent less than ${percentile.toFixed(1)}% of players - absolutely legendary RNG!`
    };
    if (percentile <= 30) return { 
      rating: "Very lucky ✨", 
      color: "text-green-400",
      shareMessage: `✨ Very lucky! Spent less than ${percentile.toFixed(1)}% of players - exceptional RNG!`
    };
    if (percentile <= 50) return { 
      rating: "Above average 🍂", 
      color: "text-green-300",
      shareMessage: `🍂 Above average luck! Spent less than ${percentile.toFixed(1)}% of players - better than most!`
    };
    if (percentile <= 70) return { 
      rating: "Unlucky 😕", 
      color: "text-orange-400",
      shareMessage: `😕 Unlucky! Spent more than ${(100-percentile).toFixed(1)}% of players - below average RNG.`
    };
    if (percentile <= 90) return { 
      rating: "Very unlucky 😩", 
      color: "text-red-400",
      shareMessage: `😩 Very unlucky! Spent more than ${(100-percentile).toFixed(1)}% of players - rough RNG.`
    };
    return { 
      rating: "Nightmare RNG 💀", 
      color: "text-red-600",
      shareMessage: `💀 Nightmare RNG! Spent more than ${(100-percentile).toFixed(1)}% of players - absolutely brutal luck!`
    };
  }, []);

  // Main calculation effect
  useEffect(() => {
    async function calculateEquipmentCosts() {
      if (mode === 'standalone' || !pendingEquipment.length) {
        setEquipmentCalculations([]);
        setIsCalculating(false);
        setCalculationError(null);
        return;
      }

      setIsCalculating(true);
      setCalculationError(null);

      try {
        // Build API request
        const request: BulkEnhancedStarforceRequestDto = {
          isInteractive: globalSettings.isInteractive,
          events: {
            thirtyOff: globalSettings.thirtyPercentOff,
            fiveTenFifteen: globalSettings.fiveTenFifteenEvent,
            starCatching: globalSettings.starCatching !== false,
            mvpDiscount: 0
          },
          items: pendingEquipment.map(eq => {
            const actualCostData = itemActualCosts[eq.id];
            const actualCostInMesos = actualCostData ? convertToMesos(actualCostData) : 0;

            const spareCostData = itemSparePrices[eq.id];
            const spareCostInMesos = spareCostData ? convertToMesos(spareCostData) : 0;

            return {
              itemLevel: eq.level,
              fromStar: eq.currentStarForce || 0,
              toStar: eq.targetStarForce || 0,
              safeguardEnabled: itemSafeguard[eq.id] || false,
              spareCount: itemSpares[eq.id] || 0,
              spareCost: spareCostInMesos,
              actualCost: actualCostInMesos,
              itemName: eq.name
            };
          })
        };

        // Call backend API
        const { response } = await calculateBulkStarforce(request);
        
        // Transform response to calculation format
        const calculations: EquipmentCalculation[] = response.results.map((result, index) => {
          const equipment = pendingEquipment[index];
          
          // Calculate luck percentage from API response
          const luckPercentage = result.luckAnalysis 
            ? result.luckAnalysis.percentile <= 50 
              ? -(50 - result.luckAnalysis.percentile) * 2  // Lucky: negative percentage
              : (result.luckAnalysis.percentile - 50) * 2   // Unlucky: positive percentage
            : 0;

          // Get actual cost from our local state
          const actualCostData = itemActualCosts[equipment.id];
          const actualCost = actualCostData ? convertToMesos(actualCostData) : (equipment.actualCost || 0);

          // Calculate spare cost breakdown
          const enhancementCost = result.averageCost;
          const averageSpareCost = (result.averageSpareCount || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);
          const medianSpareCost = (result.medianSpareCount || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);
          const p75SpareCost = (result.percentile75SpareCount || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);

          return {
            // Equipment identification
            id: equipment.id,
            name: equipment.name,
            slot: equipment.slot,
            type: equipment.type,
            level: equipment.level,
            image: equipment.image,
            
            // Star force progression
            currentStarForce: equipment.currentStarForce || 0,
            targetStarForce: equipment.targetStarForce || 0,
            starforceable: equipment.starforceable,
            
            // Cost calculations
            averageCost: result.averageCost,
            medianCost: result.medianCost,
            p75Cost: result.percentile75Cost,
            
            // Boom/spare calculations
            averageBooms: result.averageSpareCount || 0,
            medianBooms: result.medianSpareCount || 0,
            p75Booms: result.percentile75SpareCount || 0,
            
            // User tracking data
            actualCost,
            luckPercentage,
            luckAnalysis: result.luckAnalysis,
            
            // Spare cost breakdown
            spareCostBreakdown: {
              enhancementCost,
              averageSpareCost,
              medianSpareCost,
              p75SpareCost
            },
            
            // Pre-calculate spare status and related UI data
            spareStatus: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const boomChance = result.averageSpareCount || 0;
              
              if (boomChance === 0) return "none-needed";
              if (spares === 0) return "none-available";
              if (spares < Math.ceil(boomChance)) return "insufficient";
              if (spares >= Math.ceil(boomChance * 1.5)) return "excess";
              return "adequate";
            })(),
            spareClassName: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const boomChance = result.averageSpareCount || 0;
              
              if (boomChance === 0) return "";
              if (spares === 0) return boomChance > 0 ? "border-orange-500 bg-orange-950/30 text-orange-200" : "";
              if (spares < Math.ceil(boomChance)) return "border-red-500 bg-red-950/30 text-red-200";
              if (spares >= Math.ceil(boomChance * 1.5)) return "border-blue-500 bg-blue-950/30 text-blue-200";
              return "border-green-500 bg-green-950/30 text-green-200";
            })(),
            spareTitle: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const expectedBooms = result.averageSpareCount || 0;
              
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
                aValue = (a.name || '').toLowerCase();
                bValue = (b.name || '').toLowerCase();
                break;
              case 'currentStarForce':
                aValue = a.currentStarForce || 0;
                bValue = b.currentStarForce || 0;
                break;
              case 'targetStarForce':
                aValue = a.targetStarForce || 0;
                bValue = b.targetStarForce || 0;
                break;
              case 'averageCost':
                aValue = a.averageCost;
                bValue = b.averageCost;
                break;
              case 'medianCost':
                aValue = a.medianCost;
                bValue = b.medianCost;
                break;
              case 'p75Cost':
                aValue = a.p75Cost;
                bValue = b.p75Cost;
                break;
              case 'averageBooms':
                aValue = a.averageBooms;
                bValue = b.averageBooms;
                break;
              case 'medianBooms':
                aValue = a.medianBooms;
                bValue = b.medianBooms;
                break;
              case 'p75Booms':
                aValue = a.p75Booms;
                bValue = b.p75Booms;
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

        setEquipmentCalculations(calculations);
      } catch (error) {
        console.error('Failed to calculate equipment costs:', error);
        setCalculationError(error instanceof Error ? error.message : 'Failed to calculate costs');
        setEquipmentCalculations([]);
      } finally {
        setIsCalculating(false);
      }
    }

    calculateEquipmentCosts();
  }, [
    pendingEquipment,
    globalSettings,
    itemSafeguard,
    itemSparePrices,
    itemActualCosts,
    itemSpares,
    mode,
    sortField,
    sortDirection,
    recalculationTrigger
  ]);

  // Aggregate statistics calculation
  const aggregateStats = useMemo(() => {
    const includedCalculations = equipmentCalculations.filter(calc => 
      itemIncluded[calc.id] !== false
    );

    const totalExpectedCost = includedCalculations.reduce((sum, calc) => sum + calc.averageCost, 0);
    const totalActualCost = includedCalculations.reduce((sum, calc) => sum + calc.actualCost, 0);
    const totalExpectedBooms = includedCalculations.reduce((sum, calc) => sum + calc.averageBooms, 0);
    const totalMedianBooms = includedCalculations.reduce((sum, calc) => sum + calc.medianBooms, 0);
    const totalP75Cost = includedCalculations.reduce((sum, calc) => sum + calc.p75Cost, 0);
    const totalP75Booms = includedCalculations.reduce((sum, calc) => sum + calc.p75Booms, 0);
    
    const overallLuckPercentage = totalExpectedCost > 0 && totalActualCost > 0
      ? ((totalActualCost - totalExpectedCost) / totalExpectedCost) * 100 
      : 0;

    // Calculate enhanced overall luck using weighted average
    const itemsWithLuck = includedCalculations.filter(calc => 
      calc.actualCost > 0 && calc.luckAnalysis
    );
    
    let overallLuck: {
      percentile: number;
      rating: string;
      color: string;
      shareMessage: string;
      description: string;
    } | null = null;
    if (itemsWithLuck.length > 0) {
      const totalActualCostWithLuck = itemsWithLuck.reduce((sum, calc) => sum + calc.actualCost, 0);
      
      const weightedPercentile = itemsWithLuck.reduce((sum, calc) => {
        const weight = calc.actualCost / totalActualCostWithLuck;
        return sum + (calc.luckAnalysis!.percentile * weight);
      }, 0);
      
      const enhancedRating = getEnhancedLuckRating(weightedPercentile);
      
      overallLuck = {
        percentile: weightedPercentile,
        rating: enhancedRating.rating,
        color: enhancedRating.color,
        shareMessage: enhancedRating.shareMessage,
        description: `Overall spending luck across ${itemsWithLuck.length} items (cost-weighted average)`
      };
    }

    const hasActualCosts = totalActualCost > 0;

    return {
      totalExpectedCost,
      totalActualCost,
      totalExpectedBooms,
      totalMedianBooms,
      totalP75Cost,
      totalP75Booms,
      overallLuckPercentage,
      overallLuck,
      hasActualCosts,
      includedCount: includedCalculations.length,
      totalCount: equipmentCalculations.length
    };
  }, [equipmentCalculations, itemIncluded, getEnhancedLuckRating]);

  // Manual recalculation trigger
  const triggerRecalculation = useCallback(() => {
    setRecalculationTrigger(prev => prev + 1);
  }, []);

  return {
    // State
    calculation,
    isCalculating,
    calculationError,
    equipmentCalculations,
    pendingEquipment,
    aggregateStats,
    
    // Actions
    setCalculation,
    triggerRecalculation,
    
    // Helpers
    getEnhancedLuckRating
  };
}

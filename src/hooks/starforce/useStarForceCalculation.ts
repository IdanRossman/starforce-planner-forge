import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Equipment, StarForceCalculation } from '../../types';
import {
  calculateBulkStarforce,
  convertToMesos,
  BulkEnhancedStarforceRequestDto,
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

  // Spare cost breakdown
  spareCostBreakdown: {
    enhancementCost: number;
    averageSpareCost: number;
    medianSpareCost: number;
    p75SpareCost: number;
  };
  
  // Transfer fields
  transferredTo?: string; // ID of equipment that was transferred to (for transfer sources)
  transferredFrom?: string; // ID of equipment that was transferred from (for transfer targets)
  transferredStars?: number; // Number of stars transferred
  isTransferSource?: boolean; // Flag indicating this equipment will be destroyed after transfer
  
  // UI-specific pre-calculated data
  spareStatus: string;
  spareClassName: string;
  spareTitle: string;
}

export type SortField = 'name' | 'currentStarForce' | 'targetStarForce' | 'averageCost' | 'medianCost' | 'p75Cost' | 'averageBooms' | 'medianBooms' | 'p75Booms';
export type SortDirection = 'asc' | 'desc' | null;

export interface GlobalSettings {
  thirtyPercentOff: boolean;  // 30% cost reduction event
  thirtyPercentBoomReduction: boolean;  // 30% boom reduction event
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
  equipment?: Equipment[];
  additionalEquipment?: Equipment[];
  globalSettings: GlobalSettings;
  itemSafeguard: ItemSettings;
  itemSpares: ItemSpares;
  itemSparePrices: ItemPrices;
  itemIncluded: ItemSettings;
  sortField: SortField | null;
  sortDirection: SortDirection;
  initialCalculation?: StarForceCalculation;
  manualMode?: boolean;
}

export interface UseSortingReturn {
  handleSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => JSX.Element;
}

export function useStarForceCalculation({
  equipment = [],
  additionalEquipment = [],
  globalSettings,
  itemSafeguard,
  itemSpares,
  itemSparePrices,
  itemIncluded,
  sortField,
  sortDirection,
  initialCalculation,
  manualMode = false
}: UseStarForceCalculationOptions) {
  
  // Calculation state
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);
  const [equipmentCalculations, setEquipmentCalculations] = useState<EquipmentCalculation[]>([]);
  const hasInitiallyCalculated = useRef(false);
  const shouldCalculate = useRef(true); // Control flag for calculations
  const lastRecalculationTrigger = useRef(0); // Track last manual trigger value
  const isInitializing = useRef(true); // Track if we're still in initialization phase

  // Combine all equipment for table mode - memoized to prevent recalculation
  const pendingEquipment = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.filter(eq => 
      eq.starforceable && (eq.currentStarForce || 0) < (eq.targetStarForce || 0)
    );
  }, [equipment, additionalEquipment]);

  // Main calculation effect
  useEffect(() => {
    async function calculateEquipmentCosts() {
      if (!pendingEquipment.length) {
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
          events: {
            thirtyPercentMesoReduction: globalSettings.thirtyPercentOff,
            thirtyPercentBoomReduction: globalSettings.thirtyPercentBoomReduction,
            mvpDiscount: 'None',
          },
          items: pendingEquipment.map(eq => {
            const spareCostData = itemSparePrices[eq.id];
            const spareCostInMesos = spareCostData ? convertToMesos(spareCostData) : 0;

            return {
              itemLevel: eq.level,
              fromStar: eq.currentStarForce || 0,
              toStar: eq.targetStarForce || 0,
              starCatching: globalSettings.starCatching !== false,
              safeguard: itemSafeguard[eq.id] || false,
              spareCount: 999,
              spareCost: spareCostInMesos,
              itemName: eq.name,
            };
          })
        };

        // Call backend API
        const { response } = await calculateBulkStarforce(request);
        console.log('[Boom debug] First result:', JSON.stringify(response.results[0], null, 2));
        console.log('[Boom debug] Summary:', JSON.stringify(response.summary, null, 2));
        
        // Transform response to calculation format — match by itemName, fall back to index
        const calculations: EquipmentCalculation[] = pendingEquipment.map((equipment, index) => {
          const result = response.results.find(r => r.itemName != null && r.itemName === equipment.name)
            ?? response.results[index];
          
          // Calculate spare cost breakdown
          const enhancementCost = result.averageCost;
          const averageSpareCost = (result.averageBooms || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);
          const medianSpareCost = (result.medianBooms || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);
          const p75SpareCost = (result.percentile75Booms || 0) * (convertToMesos(itemSparePrices[equipment.id]) || 0);

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
            averageBooms: result.averageBooms || 0,
            medianBooms: result.medianBooms || 0,
            p75Booms: result.percentile75Booms || 0,

            // Spare cost breakdown
            spareCostBreakdown: {
              enhancementCost,
              averageSpareCost,
              medianSpareCost,
              p75SpareCost
            },
            
            // Transfer fields
            transferredTo: equipment.transferredTo,
            transferredFrom: equipment.transferredFrom,
            transferredStars: equipment.transferredStars,
            isTransferSource: equipment.isTransferSource,
            
            // Pre-calculate spare status and related UI data
            spareStatus: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const boomChance = result.averageBooms || 0;

              if (boomChance === 0) return "none-needed";
              if (spares === 0) return "none-available";
              if (spares < Math.ceil(boomChance)) return "insufficient";
              if (spares >= Math.ceil(boomChance * 1.5)) return "excess";
              return "adequate";
            })(),
            spareClassName: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const boomChance = result.averageBooms || 0;

              if (boomChance === 0) return "";
              if (spares === 0) return boomChance > 0 ? "border-orange-500 bg-orange-950/30 text-orange-200" : "";
              if (spares < Math.ceil(boomChance)) return "border-red-500 bg-red-950/30 text-red-200";
              if (spares >= Math.ceil(boomChance * 1.5)) return "border-blue-500 bg-blue-950/30 text-blue-200";
              return "border-green-500 bg-green-950/30 text-green-200";
            })(),
            spareTitle: (() => {
              const spares = itemSpares[equipment.id] || 0;
              const expectedBooms = result.averageBooms || 0;

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
        
        // Mark initialization as complete after first successful calculation
        if (isInitializing.current) {
          isInitializing.current = false;
        }
      } catch (error) {
        console.error('Failed to calculate equipment costs:', error);
        setCalculationError(error instanceof Error ? error.message : 'Failed to calculate costs');
        setEquipmentCalculations([]);
      } finally {
        setIsCalculating(false);
      }
    }

    // In manual mode, allow initial calculation and manual triggers, but block equipment-specific auto-calcs
    const isManualTrigger = recalculationTrigger > lastRecalculationTrigger.current;
    
    if (manualMode && hasInitiallyCalculated.current && !isManualTrigger) {
      // Only set hasChanges for actual user changes, not during initialization
      if (!isInitializing.current) {
        setHasChanges(true);
      }
      // Skip equipment-related changes in manual mode after initial calculation
      return;
    }

    // Update the last trigger value
    lastRecalculationTrigger.current = recalculationTrigger;

    shouldCalculate.current = true;

    // Mark that we've done the initial calculation
    if (pendingEquipment.length > 0) {
      hasInitiallyCalculated.current = true;
    }

    calculateEquipmentCosts();
  }, [
    pendingEquipment,
    globalSettings,
    itemSafeguard,
    itemSparePrices,
    itemSpares,
    sortField,
    sortDirection,
    recalculationTrigger,
    manualMode
  ]);

  // Sync star values in-place when equipment changes in manual mode (no API call)
  useEffect(() => {
    if (!manualMode || !hasInitiallyCalculated.current) return;

    setEquipmentCalculations(prev => {
      const needsUpdate = prev.some(calc => {
        const eq = pendingEquipment.find(e => e.id === calc.id);
        return eq && (
          (eq.currentStarForce || 0) !== calc.currentStarForce ||
          (eq.targetStarForce || 0) !== calc.targetStarForce
        );
      });
      if (!needsUpdate) return prev;

      return prev.map(calc => {
        const eq = pendingEquipment.find(e => e.id === calc.id);
        if (!eq) return calc;
        return {
          ...calc,
          currentStarForce: eq.currentStarForce || 0,
          targetStarForce: eq.targetStarForce || 0,
        };
      });
    });
  }, [pendingEquipment, manualMode]);

  // Aggregate statistics calculation
  const aggregateStats = useMemo(() => {
    const includedCalculations = equipmentCalculations.filter(calc => 
      itemIncluded[calc.id] !== false
    );

    const totalExpectedCost = includedCalculations.reduce((sum, calc) => sum + calc.averageCost, 0);
    const totalMedianCost = includedCalculations.reduce((sum, calc) => sum + calc.medianCost, 0);
    const totalExpectedBooms = includedCalculations.reduce((sum, calc) => sum + calc.averageBooms, 0);
    const totalMedianBooms = includedCalculations.reduce((sum, calc) => sum + calc.medianBooms, 0);
    const totalP75Cost = includedCalculations.reduce((sum, calc) => sum + calc.p75Cost, 0);
    const totalP75Booms = includedCalculations.reduce((sum, calc) => sum + calc.p75Booms, 0);

    return {
      totalExpectedCost,
      totalMedianCost,
      totalExpectedBooms,
      totalMedianBooms,
      totalP75Cost,
      totalP75Booms,
      includedCount: includedCalculations.length,
      totalCount: equipmentCalculations.length
    };
  }, [equipmentCalculations, itemIncluded]);

  // Manual recalculation trigger
  const triggerRecalculation = useCallback(() => {
    if (manualMode) {
      setHasChanges(false);
    }
    setRecalculationTrigger(prev => prev + 1);
  }, [manualMode]);

  return {
    // State
    calculation,
    isCalculating,
    calculationError,
    equipmentCalculations,
    pendingEquipment,
    aggregateStats,
    hasChanges,
    
    // Actions
    setCalculation,
    triggerRecalculation,
  };
}

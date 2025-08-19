import { useState, useMemo, useCallback, useEffect } from "react";
import { StarForceCalculation, Events, Equipment } from "@/types";
import { 
  useStarForceCalculation,
  useStarForceItemSettings,
  useEquipmentManagement,
  type GlobalSettings,
  type SortField,
  type SortDirection,
  type EquipmentCalculation
} from "@/hooks/starforce";
import { useFormatting } from "@/hooks/display/useFormatting";
import { useTable } from "@/hooks/utils/useTable";
import { calculateBulkStarforce } from "@/services/starforceService";
import { 
  useSelectedCharacter, 
  useSelectedCharacterEquipment
} from "@/hooks/useCharacterContext";
import { useEquipment } from "@/hooks";
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
  equipment?: Equipment[]; // Optional - will use context if not provided
  additionalEquipment?: Equipment[];
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onUpdateSafeguard?: (equipmentId: string, safeguard: boolean) => void;
  mode?: 'standalone' | 'equipment-table';
  characterId?: string; // For per-character localStorage - optional if using context
  characterName?: string; // Fallback for characters without ID
}


export function StarForceCalculator({ 
  initialCalculation, 
  equipment: propEquipment, // Rename to avoid confusion
  additionalEquipment = [],
  onUpdateStarforce: propOnUpdateStarforce, // Rename to distinguish from context
  onUpdateActualCost: propOnUpdateActualCost,
  onUpdateSafeguard: propOnUpdateSafeguard,
  mode = 'standalone',
  characterId: propCharacterId, // Use prop or context
  characterName: propCharacterName
}: StarForceCalculatorProps) {
  // Get character data from context
  const selectedCharacter = useSelectedCharacter();
  const contextEquipment = useSelectedCharacterEquipment();
  const {
    updateEquipment,
  } = useEquipment();

  // Determine data source: props vs context
  const equipment = propEquipment || contextEquipment;
  const characterId = propCharacterId || selectedCharacter?.id;
  const characterName = propCharacterName || selectedCharacter?.name;
  
  // Create wrapper functions for the new hook API
  const onUpdateStarforce = propOnUpdateStarforce || ((equipmentId: string, current: number, target: number) => {
    updateEquipment(equipmentId, { currentStarForce: current, targetStarForce: target });
  });
  
  const onUpdateActualCost = propOnUpdateActualCost || ((equipmentId: string, cost: number) => {
    updateEquipment(equipmentId, { actualCost: cost });
  });
  
  const onUpdateSafeguard = propOnUpdateSafeguard || ((equipmentId: string, useSafeguard: boolean) => {
    updateEquipment(equipmentId, { safeguard: useSafeguard });
  });

  // Use hooks for settings and item management
  const {
    itemSafeguard,
    setItemSafeguard,
    itemSpares,
    setItemSpares,
    itemSparePrices,
    setItemSparePrices,
    itemActualCosts,
    setItemActualCosts
  } = useStarForceItemSettings(characterId);

  // Use formatting hook for display utilities
  const {
    formatMesos,
    getDangerLevel,
    getLuckColor,
    getEnhancedLuckRating,
    getLuckText
  } = useFormatting();

  // Use table hook for sorting and filtering
  const {
    sortState,
    handleSort,
    filterState,
    toggleFilter,
    isSelected,
    toggleSelection
  } = useTable();

  // Local getSortIcon implementation (keeping the original logic)
  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    if (sortState.direction === 'asc') {
      return <ArrowUp className="w-4 h-4 text-primary" />;
    } else if (sortState.direction === 'desc') {
      return <ArrowDown className="w-4 h-4 text-primary" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
  };

  // Use equipment management hook for character-level equipment operations
  const {
    handleQuickAdjust,
    handleBulkStarforceUpdate,
    handleActualCostUpdate,
    handleSafeguardUpdate
  } = useEquipmentManagement({
    onUpdateStarforce,
    onUpdateActualCost,
    onUpdateSafeguard
  });
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
  
  // Enhanced settings state (using hook pattern)
  const [enhancedSettings, setEnhancedSettings] = useState<GlobalSettings>(() => ({
    thirtyPercentOff: false,
    fiveTenFifteenEvent: false,
    starCatching: true,
    isInteractive: false
  }));

  // Equipment table editing states
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [editingActualCost, setEditingActualCost] = useState<string | null>(null);
  const [tempActualCost, setTempActualCost] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  // Temporary spare price editing state (doesn't trigger recalculation until blur)
  const [tempSparePrices, setTempSparePrices] = useState<{ [equipmentId: string]: { value: number; unit: 'M' | 'B' } }>({});

  // Sorting state (from useTable hook)
  const sortField = sortState.field as SortField | null;
  const sortDirection = sortState.direction;
  
  // Per-item include/exclude state (manual for now)
  const [itemIncluded, setItemIncluded] = useState<{ [equipmentId: string]: boolean }>({});
  
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(
    initialCalculation || null
  );

  // Use the calculation hook for equipment mode
  const {
    equipmentCalculations,
    isCalculating,
    calculationError,
    aggregateStats,
    triggerRecalculation
  } = useStarForceCalculation({
    mode,
    equipment,
    additionalEquipment,
    globalSettings: enhancedSettings,
    itemSafeguard,
    itemSpares,
    itemSparePrices,
    itemActualCosts,
    itemIncluded,
    sortField,
    sortDirection
  });

  // Helper functions for luck analysis


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

  // Helper function to get current spare price (temp or committed)
  const getCurrentSparePrice = (equipmentId: string) => {
    return tempSparePrices[equipmentId] || itemSparePrices[equipmentId] || { value: 0, unit: 'M' as const };
  };

  // Helper function to commit spare price changes (triggers recalculation)
  const commitSparePriceChange = (equipmentId: string) => {
    const tempValue = tempSparePrices[equipmentId];
    if (tempValue) {
      setItemSparePrices(prev => ({ ...prev, [equipmentId]: tempValue }));
      setTempSparePrices(prev => {
        const newState = { ...prev };
        delete newState[equipmentId];
        return newState;
      });
    }
  };

  // Helper function to check if safeguard is applicable for an item
  const isSafeguardEligible = useCallback((equipment: Equipment | EquipmentCalculation) => {
    if (!equipment.starforceable) return false;
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    // Safeguard is useful for attempting 15★ and 16★
    return target > 15;
  }, []);

  // Equipment table handlers - remaining handlers that don't need equipment management hook
  const handleStartEdit = (equipment: Equipment | EquipmentCalculation) => {
    setEditingStarforce(equipment.id);
    setTempValues({
      current: equipment.currentStarForce || 0,
      target: equipment.targetStarForce || 0
    });
  };

  const handleSaveEdit = (equipment: Equipment | EquipmentCalculation) => {
    if (onUpdateStarforce) {
      onUpdateStarforce(equipment.id, tempValues.current, tempValues.target);
    }
    setEditingStarforce(null);
  };

  const handleCancelEdit = () => {
    setEditingStarforce(null);
    setTempValues({ current: 0, target: 0 });
  };

  // Auto-determine unit based on table data
  const getAutoUnit = (equipment: Equipment | EquipmentCalculation): 'M' | 'B' => {
    // Check current calculation values for this equipment
    const calc = equipmentCalculations.find(c => c.id === equipment.id);
    if (calc) {
      // If most values are >= 1B, suggest B, otherwise M
      const values = [
        calc.averageCost,
        calc.medianCost,
        calc.p75Cost
      ];
      const billionValues = values.filter(v => v >= 1000000000).length;
      return billionValues >= 2 ? 'B' : 'M'; // If 2+ values are in billions, use B
    }

    // Fallback: check other items' spare prices for context
    const sparePrices = Object.values(itemSparePrices);
    if (sparePrices.length > 0) {
      const billionSpares = sparePrices.filter(p => p.unit === 'B').length;
      return billionSpares > sparePrices.length / 2 ? 'B' : 'M';
    }

    return 'M'; // Default to millions
  };

  const handleStartActualCostEdit = (equipment: Equipment | EquipmentCalculation) => {
    setEditingActualCost(equipment.id);
    // Initialize with current value or convert from legacy actualCost
    const currentCost = itemActualCosts[equipment.id];
    if (currentCost) {
      setTempActualCost(currentCost.value);
    } else if ('actualCost' in equipment && equipment.actualCost && equipment.actualCost > 0) {
      // Convert legacy actualCost to M/B format
      const value = equipment.actualCost >= 1000000000 ? equipment.actualCost / 1000000000 : equipment.actualCost / 1000000;
      const unit = equipment.actualCost >= 1000000000 ? 'B' : 'M';
      setTempActualCost(Math.round(value * 10) / 10); // Round to 1 decimal
      setItemActualCosts(prev => ({ ...prev, [equipment.id]: { value: Math.round(value * 10) / 10, unit } }));
    } else {
      // Auto-determine unit and set to 0
      const autoUnit = getAutoUnit(equipment);
      setTempActualCost(0);
      setItemActualCosts(prev => ({ 
        ...prev, 
        [equipment.id]: { value: 0, unit: autoUnit } 
      }));
    }
  };

  const handleSaveActualCost = (equipment: Equipment | EquipmentCalculation) => {
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
    
    // Trigger recalculation manually
    triggerRecalculation();
    
    setEditingActualCost(null);
  };

  const handleCancelActualCostEdit = () => {
    setEditingActualCost(null);
    setTempActualCost(0);
  };

  const exportData = () => {
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
        ['Average Cost', formatMesos.display(calculation.averageCost)],
        ['Median Cost', formatMesos.display(calculation.medianCost)],
        ['75th Percentile Cost', formatMesos.display(calculation.p75Cost)],
        [''],
        ['Boom Statistics', 'Count'],
        ['Average Booms', calculation.averageBooms.toFixed(1)],
        ['Median Booms', calculation.medianBooms.toFixed(1)],
        ['75th Percentile Booms', calculation.p75Booms.toFixed(1)],
        [''],
        ['Per-Star Details', 'Success Rate (%)', 'Boom Rate (%)', 'Cost (Unitized)'],
        ...calculation.perStarStats.map(stat => 
          [`★${stat.star}`, stat.successRate.toFixed(1), stat.boomRate.toFixed(1), formatMesos.display(stat.cost)]
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
        ['Total Expected Cost', formatMesos.display(aggregateStats.totalExpectedCost), ''],
        ['Total Actual Cost', formatMesos.display(aggregateStats.totalActualCost), ''],
        ['Overall Luck Percentage', `${aggregateStats.overallLuckPercentage.toFixed(1)}%`, getLuckText(aggregateStats.overallLuckPercentage)],
        ['Total Average Booms', aggregateStats.totalExpectedBooms.toFixed(1), ''],
        ['Total Median Booms', aggregateStats.totalMedianBooms.toFixed(1), ''],
        ['Total 75th Percentile Cost', formatMesos.display(aggregateStats.totalP75Cost), ''],
        ['Total 75th Percentile Booms', aggregateStats.totalP75Booms.toFixed(1), ''],
        [''],
        ['Equipment Details'],
        ['Item Name', 'Slot', 'Current SF', 'Target SF', 'Safeguard', 'Spares', 
         ...(enhancedSettings.isInteractive ? ['Spare Price'] : []),
         'Expected Cost', 'Median Cost', '75th % Cost', 'Average Booms', 'Median Booms', '75th % Booms',
         'Actual Cost', 'Luck %', 'Luck Status'],
        ...equipmentCalculations.map(calc => {
          const eq = calc; // Now it's flattened
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
            formatMesos.display(calc.averageCost),
            formatMesos.display(calc.medianCost),
            formatMesos.display(calc.p75Cost),
            calc.averageBooms.toFixed(1),
            calc.medianBooms.toFixed(1),
            calc.p75Booms.toFixed(1),
            calc.actualCost > 0 ? formatMesos.display(calc.actualCost) : '0',
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
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert form data to API format
      const isInteractive = server === "Interactive";
      const events = {
        thirtyOff: costDiscount >= 30,
        fiveTenFifteen: eventType === "5/10/15",
        starCatching: starCatching,
        mvpDiscount: costDiscount > 0 && costDiscount < 30 ? costDiscount : undefined
      };

      const request = {
        isInteractive,
        events,
        items: [{
          itemLevel,
          fromStar: currentLevel,
          toStar: targetLevel,
          safeguardEnabled: safeguard,
          spareCount: 0,
          spareCost: 0,
          actualCost: 0,
          itemName: `Item Level ${itemLevel}`
        }]
      };
      
      const { response } = await calculateBulkStarforce(request);
      
      // Convert API response to local StarForceCalculation format
      let result: StarForceCalculation = {
        currentLevel,
        targetLevel,
        averageCost: response.results[0].averageCost,
        medianCost: response.results[0].medianCost,
        p75Cost: response.results[0].percentile75Cost,
        averageBooms: response.results[0].averageSpareCount || 0,
        medianBooms: response.results[0].medianSpareCount || 0,
        p75Booms: response.results[0].percentile75SpareCount || 0,
        successRate: 0, // API doesn't provide overall success rate
        boomRate: 0, // API doesn't provide overall boom rate
        costPerAttempt: response.results[0].averageCost / Math.max((targetLevel - currentLevel), 1),
        perStarStats: [], // API doesn't provide per-star breakdown for single items
        recommendations: response.results[0].luckAnalysis ? [response.results[0].luckAnalysis.description] : []
      };
      
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
            <CardTitle className="flex items-center gap-2 font-maplestory">
              <Settings className="w-5 h-5 text-primary" />
              Enhancement Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Settings */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-muted-foreground font-maplestory">Enhancement Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="discount-event"
                    checked={enhancedSettings.thirtyPercentOff}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, thirtyPercentOff: checked }))}
                  />
                  <Label htmlFor="discount-event" className="text-sm cursor-pointer font-maplestory">30% Off Event</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="starcatch-event"
                    checked={enhancedSettings.fiveTenFifteenEvent}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, fiveTenFifteenEvent: checked }))}
                  />
                  <Label htmlFor="starcatch-event" className="text-sm cursor-pointer font-maplestory">5/10/15 Event</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="star-catching"
                    checked={enhancedSettings.starCatching !== false}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, starCatching: checked }))}
                  />
                  <Label htmlFor="star-catching" className="text-sm cursor-pointer font-maplestory">Star Catching</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="interactive-server"
                    checked={enhancedSettings.isInteractive}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, isInteractive: checked }))}
                  />
                  <Label htmlFor="interactive-server" className="text-sm cursor-pointer font-maplestory">Interactive Server</Label>
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
                    <div className="font-semibold text-sm font-maplestory">
                      {aggregateStats.includedCount} of {aggregateStats.totalCount} items included
                    </div>
                    <div className="text-xs text-muted-foreground font-maplestory">
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
        {!isCalculating && !calculationError && aggregateStats.totalCount > 0 && (
        <div className={`grid grid-cols-${aggregateStats.hasActualCosts ? '5' : '4'} gap-4`}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 font-maplestory">{formatMesos.display(aggregateStats.totalExpectedCost)}</div>
                  <div className="text-sm text-muted-foreground font-maplestory">Average Cost</div>
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
                  <div className="text-2xl font-bold text-green-400 font-maplestory">{formatMesos.display(aggregateStats.totalExpectedCost * 0.85)}</div>
                  <div className="text-sm text-muted-foreground font-maplestory">Median Cost</div>
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
                  <div className="text-2xl font-bold text-red-400 font-maplestory">{formatMesos.display(aggregateStats.totalP75Cost)}</div>
                  <div className="text-sm text-muted-foreground font-maplestory">75th % Cost</div>
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
                  <div className="text-2xl font-bold text-blue-400 font-maplestory">{formatMesos.display(aggregateStats.totalActualCost)}</div>
                  <div className="text-sm text-muted-foreground font-maplestory">Actual Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {aggregateStats.hasActualCosts && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    aggregateStats.overallLuck ? 'bg-purple-500/10' : 
                    aggregateStats.overallLuckPercentage > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                  }`}>
                    {aggregateStats.overallLuck ? 
                      <Star className="w-5 h-5 text-purple-500" /> :
                      aggregateStats.overallLuckPercentage > 0 ? 
                        <TrendingDown className="w-5 h-5 text-red-500" /> :
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div className="text-center">
                    {aggregateStats.overallLuck ? (
                      <div 
                        className={`text-2xl font-bold ${aggregateStats.overallLuck.color} flex flex-col cursor-help font-maplestory`}
                        title={aggregateStats.overallLuck.shareMessage}
                      >
                        <span>{aggregateStats.overallLuck.percentile.toFixed(1)}%</span>
                        <span className="text-sm opacity-75">{aggregateStats.overallLuck.rating}</span>
                      </div>
                    ) : (
                      <div className={`text-2xl font-bold ${getLuckColor.text(aggregateStats.overallLuckPercentage)} flex flex-col font-maplestory`}>
                        <span>{aggregateStats.overallLuckPercentage.toFixed(1)}%</span>
                        {getLuckText(aggregateStats.overallLuckPercentage) && (
                          <span className="text-sm opacity-75">{getLuckText(aggregateStats.overallLuckPercentage)}</span>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground font-maplestory">
                      {aggregateStats.overallLuck ? 'Spending Percentile' : 'vs Average Cost'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-maplestory">
                <Calculator className="w-5 h-5 text-primary" />
                StarForce Planning Table
              </CardTitle>
              <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2 font-maplestory">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="font-semibold text-lg mb-2 font-maplestory">Calculating StarForce Costs</h3>
                <p className="text-muted-foreground font-maplestory">Using enhanced simulation algorithms...</p>
              </div>
            ) : calculationError ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-red-600 font-maplestory">Calculation Error</h3>
                <p className="text-muted-foreground mb-4 font-maplestory">{calculationError}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Trigger recalculation
                    triggerRecalculation();
                  }}
                  className="font-maplestory"
                >
                  Try Again
                </Button>
              </div>
            ) : equipmentCalculations.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 font-maplestory">No Pending Equipment</h3>
                <p className="text-muted-foreground font-maplestory">All equipment is already at target StarForce levels!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
                          onClick={() => handleSort('targetStarForce')}
                        >
                          <span className="flex items-center gap-1">
                            Target SF
                            {getSortIcon('targetStarForce')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center font-maplestory">Safeguard</TableHead>
                      <TableHead className="text-center font-maplestory">Spares</TableHead>
                      {enhancedSettings.isInteractive && (
                        <TableHead className="text-center font-maplestory">Spare Price</TableHead>
                      )}
                      <TableHead className="text-center" title={enhancedSettings.isInteractive ? "Enhancement cost + expected spare costs" : "Expected enhancement cost only"}>
                        <Button
                          variant="ghost"
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
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
                          className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
                          onClick={() => handleSort('luckPercentage')}
                        >
                          <span className="flex items-center gap-1">
                            Luck
                            {getSortIcon('luckPercentage')}
                          </span>
                        </Button>
                      </TableHead>
                      <TableHead className="text-center font-maplestory">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentCalculations.map((calc) => {
                      const included = isItemIncluded(calc.id);
                      return (
                        <TableRow 
                          key={calc.id}
                          onMouseEnter={() => setHoveredRow(calc.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`group transition-opacity ${included ? '' : 'opacity-50 bg-muted/30'}`}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <div className="relative flex-shrink-0">
                                <EquipmentImage
                                  src={calc.image}
                                  alt={calc.name}
                                  size="md"
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
                          {editingStarforce === calc.id ? (
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
                              <span className="font-medium">{calc.currentStarForce || 0}</span>
                              {/* Quick Adjust Buttons - Current SF */}
                              {hoveredRow === calc.id && (
                                <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc, 'current', 1)}
                                    className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  >
                                    <ChevronUp className="w-2 h-2 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc, 'current', -1)}
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
                          {editingStarforce === calc.id ? (
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
                                onClick={() => handleSaveEdit(calc)}
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
                              <span className="font-medium">{calc.targetStarForce || 0}</span>
                              {/* Quick Adjust Buttons - Target SF */}
                              {hoveredRow === calc.id && (
                                <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc, 'target', 1)}
                                    className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  >
                                    <ChevronUp className="w-2 h-2 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickAdjust(calc, 'target', -1)}
                                    className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  >
                                    <ChevronDown className="w-2 h-2 text-red-600" />
                                  </Button>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(calc)}
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
                            {isSafeguardEligible(calc) ? (
                              <Switch
                                checked={itemSafeguard[calc.id] || false}
                                onCheckedChange={(checked) => {
                                  console.log(`Setting safeguard for ${calc.id}: ${checked}`);
                                  setItemSafeguard(prev => ({ ...prev, [calc.id]: checked }));
                                  // Update the equipment object in the parent component
                                  if (onUpdateSafeguard) {
                                    onUpdateSafeguard(calc.id, checked);
                                  }
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
                                value={itemSpares[calc.id] || 0}
                                onChange={(e) => {
                                  const spares = parseInt(e.target.value) || 0;
                                  setItemSpares(prev => ({ ...prev, [calc.id]: spares }));
                                }}
                                className={`w-16 h-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${calc.spareClassName}`}
                                placeholder="0"
                                title={calc.spareTitle}
                              />
                            </div>
                            {/* Quick Adjust Buttons - Spares */}
                            {hoveredRow === calc.id && (
                              <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const current = itemSpares[calc.id] || 0;
                                    setItemSpares(prev => ({ ...prev, [calc.id]: Math.min(99, current + 1) }));
                                  }}
                                  className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                >
                                  <ChevronUp className="w-2 h-2 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const current = itemSpares[calc.id] || 0;
                                    setItemSpares(prev => ({ ...prev, [calc.id]: Math.max(0, current - 1) }));
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
                                value={getCurrentSparePrice(calc.id).value}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setTempSparePrices(prev => ({ 
                                    ...prev, 
                                    [calc.id]: { 
                                      value, 
                                      unit: getCurrentSparePrice(calc.id).unit
                                    } 
                                  }));
                                }}
                                onBlur={() => commitSparePriceChange(calc.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitSparePriceChange(calc.id);
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-16 h-8 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                placeholder="0"
                              />
                              <Select
                                value={getCurrentSparePrice(calc.id).unit}
                                onValueChange={(unit: 'M' | 'B') => {
                                  const currentPrice = getCurrentSparePrice(calc.id);
                                  const newPrice = { ...currentPrice, unit };
                                  setTempSparePrices(prev => ({ 
                                    ...prev, 
                                    [calc.id]: newPrice
                                  }));
                                  // For unit changes, commit immediately since it's a deliberate choice
                                  setItemSparePrices(prev => ({ ...prev, [calc.id]: newPrice }));
                                  setTempSparePrices(prev => {
                                    const newState = { ...prev };
                                    delete newState[calc.id];
                                    return newState;
                                  });
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
                              {formatMesos.display(calc.averageCost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.averageSpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos.display(calc.spareCostBreakdown.enhancementCost)} + Spares: ${formatMesos.display(calc.spareCostBreakdown.averageSpareCost)}`}>
                                (+{formatMesos.display(calc.spareCostBreakdown.averageSpareCost)} spares)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-orange-400">
                              {formatMesos.display(calc.medianCost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.medianSpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos.display(calc.medianCost - calc.spareCostBreakdown.medianSpareCost)} + Spares: ${formatMesos.display(calc.spareCostBreakdown.medianSpareCost)}`}>
                                (+{formatMesos.display(calc.spareCostBreakdown.medianSpareCost)} spares)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-red-400">
                              {formatMesos.display(calc.p75Cost)}
                            </span>
                            {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.p75SpareCost > 0 && (
                              <span className="text-xs text-muted-foreground" title={`Enhancement: ${formatMesos.display(calc.p75Cost - calc.spareCostBreakdown.p75SpareCost)} + Spares: ${formatMesos.display(calc.spareCostBreakdown.p75SpareCost)}`}>
                                (+{formatMesos.display(calc.spareCostBreakdown.p75SpareCost)} spares)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="font-medium text-red-400">
                              {calc.averageBooms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="font-medium text-orange-400">
                              {calc.medianBooms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span className="font-medium text-red-600">
                              {calc.p75Booms.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingActualCost === calc.id ? (
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
                                value={itemActualCosts[calc.id]?.unit || 'M'}
                                onValueChange={(unit: 'M' | 'B') => {
                                  setItemActualCosts(prev => ({ 
                                    ...prev, 
                                    [calc.id]: { 
                                      value: prev[calc.id]?.value || 0, 
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
                                onClick={() => handleSaveActualCost(calc)}
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
                                {calc.actualCost > 0 ? formatMesos.display(calc.actualCost) : '-'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartActualCostEdit(calc)}
                                className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-medium ${calc.luckAnalysis ? getEnhancedLuckRating(calc.luckAnalysis.percentile).color : getLuckColor.text(calc.luckPercentage)}`}>
                            {calc.actualCost > 0 && calc.luckAnalysis ? (
                              <div 
                                className="flex flex-col cursor-help" 
                                title={`${getEnhancedLuckRating(calc.luckAnalysis.percentile).label} - ${calc.luckAnalysis.percentile.toFixed(1)}th percentile luck`}
                              >
                                <span>{calc.luckAnalysis.percentile.toFixed(1)}th percentile</span>
                                <span className="text-xs opacity-75">{getEnhancedLuckRating(calc.luckAnalysis.percentile).label}</span>
                              </div>
                            ) : calc.actualCost > 0 ? (
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
                              onClick={() => toggleItemIncluded(calc.id)}
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
                                  onUpdateStarforce(calc.id, calc.targetStarForce || 0, calc.targetStarForce || 0);
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
                                  onUpdateStarforce(calc.id, 0, 0);
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
          <div className="flex items-center gap-2 text-lg font-maplestory">
            <Calculator className="w-5 h-5 text-primary" />
            Advanced StarForce Calculator
          </div>
          {calculation && (
            <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2 font-maplestory">
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
              <label className="text-sm text-muted-foreground font-maplestory">Item Level</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Item Type</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Current Star</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Target Star</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Server</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Event Type</label>
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
              <label className="text-sm text-muted-foreground font-maplestory">Safeguard (15-16★)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={starCatching} onCheckedChange={(checked) => setStarCatching(checked === true)} />
              <label className="text-sm text-muted-foreground font-maplestory">Star Catching (+5%)</label>
            </div>
          </div>
          
          {/* Yohi Tap Event - The legendary luck */}
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg">
            <Checkbox 
              checked={yohiTapEvent} 
              onCheckedChange={(checked) => setYohiTapEvent(checked === true)} 
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-yellow-400 font-maplestory">
                🍀 Yohi Tap Event (Legendary Luck)
              </label>
              <p className="text-xs text-muted-foreground font-maplestory">
                Activates Yohi's supernatural luck - halves all costs and spares needed!
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground font-maplestory">Cost Discount (%)</label>
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
          <Button type="submit" className="w-full font-maplestory">
            Calculate Enhancement Cost
          </Button>
        </form>

        {/* Results */}
        {calculation && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 font-maplestory">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Star Details</TabsTrigger>
              <TabsTrigger value="recommendations">Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Current Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-maplestory">Current Level</span>
                  <Badge className={`${dangerLevel.bgColor} ${dangerLevel.color} border-current/30 font-maplestory`}>
                    ★{calculation.currentLevel}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground font-maplestory">
                  <span>★0</span>
                  <span>★23 (Max)</span>
                </div>
              </div>

              {/* Target and Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-maplestory">
                    <Target className="w-4 h-4" />
                    Target Level
                  </div>
                  <div className="text-2xl font-bold text-primary font-maplestory">
                    ★{calculation.targetLevel}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-maplestory">
                    <TrendingUp className="w-4 h-4" />
                    Success Rate
                  </div>
                  <div className="text-2xl font-bold text-green-400 font-maplestory">
                    {calculation.successRate}%
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-foreground font-maplestory">Cost Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-maplestory">Per Attempt (Avg)</span>
                    <p className="font-semibold text-yellow-400 font-maplestory">
                      {formatMesos.display(calculation.costPerAttempt)} mesos
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-maplestory">Average Total</span>
                    <p className="font-semibold text-yellow-400 font-maplestory">
                      {formatMesos.display(calculation.averageCost)} mesos
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-maplestory">Median Total</span>
                    <p className="font-semibold text-orange-400 font-maplestory">
                      {formatMesos.display(calculation.medianCost)} mesos
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-maplestory">75th % Total</span>
                    <p className="font-semibold text-red-400 font-maplestory">
                      {formatMesos.display(calculation.p75Cost)} mesos
                    </p>
                  </div>
                </div>
                {calculation.boomRate > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <div className="text-sm">
                        <span className="text-muted-foreground font-maplestory">Average Booms: </span>
                        <span className="font-semibold text-red-400 font-maplestory">
                          {calculation.averageBooms.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <div className="text-sm">
                        <span className="text-muted-foreground font-maplestory">Median Booms: </span>
                        <span className="font-semibold text-orange-400 font-maplestory">
                          {calculation.medianBooms.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-600/10 border border-red-600/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <div className="text-sm">
                        <span className="text-muted-foreground font-maplestory">75th % Booms: </span>
                        <span className="font-semibold text-red-600 font-maplestory">
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
                <h4 className="font-semibold text-foreground font-maplestory">Per-Star Analysis</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-maplestory">Star</TableHead>
                      <TableHead className="font-maplestory">Success Rate</TableHead>
                      <TableHead className="font-maplestory">Boom Rate</TableHead>
                      <TableHead className="font-maplestory">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.perStarStats.map((stat) => (
                      <TableRow key={stat.star}>
                        <TableCell className="font-medium font-maplestory">★{stat.star}</TableCell>
                        <TableCell className="text-green-400 font-maplestory">{stat.successRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-red-400 font-maplestory">{stat.boomRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-yellow-400 font-maplestory">{formatMesos.display(stat.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2 font-maplestory">
                  <Info className="w-4 h-4" />
                  Enhancement Tips
                </h4>
                {calculation.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {calculation.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-primary/10 border border-primary/20 rounded text-sm font-maplestory">
                        {rec}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm font-maplestory">
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

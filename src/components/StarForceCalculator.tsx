import { useState, useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Equipment } from "@/types";
import { 
  useStarForceCalculation,
  useStarForceItemSettings,
  useEquipmentManagement,
  type GlobalSettings,
  type SortField,
  type EquipmentCalculation
} from "@/hooks/starforce";
import { useFormatting } from "@/hooks/display/useFormatting";
import { useTable } from "@/hooks/utils/useTable";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, AlertTriangle, Star, Download, Settings, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { EquipmentTableContent } from "./StarForceCalculator/EquipmentTableContent";

interface StarForceCalculatorProps {
  equipment?: Equipment[]; // Optional - will use context if not provided
  additionalEquipment?: Equipment[];
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateSafeguard?: (equipmentId: string, safeguard: boolean) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  characterId?: string; // For per-character localStorage - optional if using context
  characterName?: string; // Fallback for characters without ID
}


export function StarForceCalculator({ 
  equipment: propEquipment, // Rename to avoid confusion
  additionalEquipment = [],
  onUpdateStarforce: propOnUpdateStarforce, // Rename to distinguish from context
  onUpdateSafeguard: propOnUpdateSafeguard,
  onSaveEquipment: propOnSaveEquipment,
  onSaveAdditionalEquipment: propOnSaveAdditionalEquipment,
  characterId: propCharacterId, // Use prop or context
  characterName: propCharacterName
}: StarForceCalculatorProps) {
  const isMobile = useIsMobile();

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
  } = useStarForceItemSettings(characterId);

  // Use formatting hook for display utilities
  const {
    formatMesos,
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
    handleBulkStarforceUpdate,
    handleSafeguardUpdate
  } = useEquipmentManagement({
    onUpdateStarforce,
    onUpdateSafeguard
  });

  // Enhanced settings state
  const [enhancedSettings, setEnhancedSettings] = useState<GlobalSettings>(() => ({
    thirtyPercentOff: false,
    thirtyPercentBoomReduction: false,
    starCatching: true,
    isInteractive: false
  }));

  // Equipment table editing states
  const [editingField, setEditingField] = useState<{ id: string; field: 'current' | 'target' } | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  // Temporary spare price editing state (doesn't trigger recalculation until blur)
  const [tempSparePrices, setTempSparePrices] = useState<{ [equipmentId: string]: { value: number; unit: 'M' | 'B' } }>({});

  // Sorting state (from useTable hook)
  const sortField = sortState.field as SortField | null;
  const sortDirection = sortState.direction;
  
  // Derive itemIncluded from equipment's includeInCalculations field
  const itemIncluded = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    const included: { [equipmentId: string]: boolean } = {};
    allEquipment.forEach(eq => {
      included[eq.id] = eq.includeInCalculations !== false; // Default to true if undefined
    });
    return included;
  }, [equipment, additionalEquipment]);

  // Use the calculation hook for equipment mode
  const {
    equipmentCalculations,
    isCalculating,
    calculationError,
    aggregateStats,
    triggerRecalculation,
    hasChanges
  } = useStarForceCalculation({
    equipment,
    additionalEquipment,
    globalSettings: enhancedSettings,
    itemSafeguard,
    itemSpares,
    itemSparePrices,
    itemIncluded,
    sortField,
    sortDirection,
    manualMode: true
  });

  // Helper functions for luck analysis


  // Include/exclude helper functions
  const toggleItemIncluded = (equipmentId: string) => {
    // Find the equipment and update its includeInCalculations setting
    const allEquipment = [...equipment, ...additionalEquipment];
    const targetEquipment = allEquipment.find(eq => eq.id === equipmentId);
    
    if (targetEquipment) {
      const newIncludeValue = !(targetEquipment.includeInCalculations !== false);
      const updatedEquipment = { ...targetEquipment, includeInCalculations: newIncludeValue };
      
      // Check if it's additional equipment or main equipment
      const isAdditional = additionalEquipment.some(eq => eq.id === equipmentId);
      
      if (isAdditional && propOnSaveAdditionalEquipment) {
        propOnSaveAdditionalEquipment(updatedEquipment);
      } else if (propOnSaveEquipment) {
        propOnSaveEquipment(updatedEquipment);
      } else {
        // Fallback to context-based update
        updateEquipment(equipmentId, { includeInCalculations: newIncludeValue });
      }
    }
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
  const handleStartFieldEdit = useCallback((id: string, field: 'current' | 'target', initial: number) => {
    setEditingField({ id, field });
    setTempValue(initial);
  }, []);

  const handleSaveFieldEdit = useCallback((calc: EquipmentCalculation) => {
    if (!editingField || editingField.id !== calc.id) return;
    let validated = tempValue;
    if (editingField.field === 'current') {
      validated = Math.max(0, Math.min(calc.targetStarForce, tempValue));
    } else {
      validated = Math.max(calc.currentStarForce, Math.min(30, tempValue));
    }
    if (onUpdateStarforce) {
      onUpdateStarforce(
        calc.id,
        editingField.field === 'current' ? validated : calc.currentStarForce,
        editingField.field === 'target' ? validated : calc.targetStarForce
      );
    }
    setEditingField(null);
  }, [editingField, tempValue, onUpdateStarforce]);

  const handleCancelFieldEdit = useCallback(() => {
    setEditingField(null);
  }, []);

  const exportData = () => {
    // Equipment table export - CSV format with unitized values
    const summaryRows = [
      ['StarForce Planning Summary'],
      [''],
      ['Statistic', 'Value (Unitized)', 'Status'],
      ['Total Expected Cost', formatMesos.display(aggregateStats.totalExpectedCost), ''],
      ['Total Average Booms', aggregateStats.totalExpectedBooms.toFixed(1), ''],
      ['Total Median Booms', aggregateStats.totalMedianBooms.toFixed(1), ''],
      ['Total 75th Percentile Cost', formatMesos.display(aggregateStats.totalP75Cost), ''],
      ['Total 75th Percentile Booms', aggregateStats.totalP75Booms.toFixed(1), ''],
      [''],
      ['Equipment Details'],
      ['Item Name', 'Slot', 'Current SF', 'Target SF', 'Safeguard', 'Spares',
       ...(enhancedSettings.isInteractive ? ['Spare Price'] : []),
       'Expected Cost', 'Median Cost', '75th % Cost', 'Average Booms', 'Median Booms', '75th % Booms'],
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
  };

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
                    id="boom-reduction-event"
                    checked={enhancedSettings.thirtyPercentBoomReduction}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, thirtyPercentBoomReduction: checked }))}
                  />
                  <Label htmlFor="boom-reduction-event" className="text-sm cursor-pointer font-maplestory">30% Boom Reduction</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="star-catching"
                    checked={enhancedSettings.starCatching !== false}
                    onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, starCatching: checked }))}
                  />
                  <Label htmlFor="star-catching" className="text-sm cursor-pointer font-maplestory">Star Catching</Label>
                </div>
                {!isMobile && (
                  <div className="flex items-center gap-3">
                    <Switch
                      id="interactive-server"
                      checked={enhancedSettings.isInteractive}
                      onCheckedChange={(checked) => setEnhancedSettings(prev => ({ ...prev, isInteractive: checked }))}
                    />
                    <Label htmlFor="interactive-server" className="text-sm cursor-pointer font-maplestory">Interactive Server</Label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Statistics Overview */}
        {!isCalculating && !calculationError && aggregateStats.totalCount > 0 && (
        <div className="grid grid-cols-3 gap-4">
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
                  <div className="text-2xl font-bold text-green-400 font-maplestory">{formatMesos.display(aggregateStats.totalMedianCost)}</div>
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
        </div>
        )}

        {/* Equipment Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-maplestory">
                <Calculator className="w-5 h-5 text-primary" />
                {isMobile ? 'SF Planning' : 'StarForce Planning Table'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    onClick={triggerRecalculation}
                    disabled={isCalculating}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-maplestory animate-pulse shadow-lg shadow-yellow-500/25 border-2 border-yellow-400 relative"
                    size="sm"
                  >
                    {/* Glowing effect */}
                    <div className="absolute inset-0 bg-yellow-400 rounded opacity-20 animate-ping"></div>
                    <div className="relative flex items-center">
                      {isCalculating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4 mr-2" />
                          Recalculate
                        </>
                      )}
                    </div>
                  </Button>
                )}
                {!isMobile && (
                  <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2 font-maplestory">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                )}
              </div>
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
              <EquipmentTableContent
                equipmentCalculations={equipmentCalculations}
                enhancedSettings={enhancedSettings}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                getSortIcon={getSortIcon}
                hoveredRow={hoveredRow}
                setHoveredRow={setHoveredRow}
                isItemIncluded={isItemIncluded}
                editingField={editingField}
                tempValue={tempValue}
                setTempValue={setTempValue}
                itemSafeguard={itemSafeguard}
                setItemSafeguard={setItemSafeguard}
                itemSpares={itemSpares}
                setItemSpares={setItemSpares}
                itemSparePrices={itemSparePrices}
                setItemSparePrices={setItemSparePrices}
                tempSparePrices={tempSparePrices}
                setTempSparePrices={setTempSparePrices}
                onUpdateSafeguard={onUpdateSafeguard}
                onUpdateStarforce={onUpdateStarforce}
                toggleItemIncluded={toggleItemIncluded}
                isSafeguardEligible={isSafeguardEligible}
                getCurrentSparePrice={getCurrentSparePrice}
                commitSparePriceChange={commitSparePriceChange}
                handleStartFieldEdit={handleStartFieldEdit}
                handleSaveFieldEdit={handleSaveFieldEdit}
                handleCancelFieldEdit={handleCancelFieldEdit}
                formatMesos={formatMesos}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
}

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

  // Use the calculation hook for equipment mode (sorting handled client-side)
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
    sortField: null,
    sortDirection: null,
    manualMode: true
  });

  // Client-side sort — no API round-trip needed
  const sortedEquipmentCalculations = useMemo(() => {
    if (!sortField || !sortDirection) return equipmentCalculations;
    return [...equipmentCalculations].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'name': aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); break;
        case 'currentStarForce': aVal = a.currentStarForce; bVal = b.currentStarForce; break;
        case 'targetStarForce': aVal = a.targetStarForce; bVal = b.targetStarForce; break;
        case 'averageCost': aVal = a.averageCost; bVal = b.averageCost; break;
        case 'medianCost': aVal = a.medianCost; bVal = b.medianCost; break;
        case 'p75Cost': aVal = a.p75Cost; bVal = b.p75Cost; break;
        case 'averageBooms': aVal = a.averageBooms; bVal = b.averageBooms; break;
        case 'medianBooms': aVal = a.medianBooms; bVal = b.medianBooms; break;
        case 'p75Booms': aVal = a.p75Booms; bVal = b.p75Booms; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [equipmentCalculations, sortField, sortDirection]);

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
    <div className="space-y-3">

      {/* Stats + Settings inline row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">

        {/* Stats panel — primary output */}
        {!isCalculating && !calculationError && aggregateStats.totalCount > 0 && (
          <div className="border border-white/10 border-l-2 border-l-primary/30 bg-[hsl(217_33%_9%)] rounded-xl flex items-center flex-1 min-w-0">
            <div className="flex-1 text-center py-4">
              <p className="text-2xl font-bold text-primary font-maplestory leading-tight">{formatMesos.display(aggregateStats.totalExpectedCost)}</p>
              <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mt-1">Avg Cost</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="flex-1 text-center py-4">
              <p className="text-2xl font-bold text-white/60 font-maplestory leading-tight">{formatMesos.display(aggregateStats.totalMedianCost)}</p>
              <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mt-1">Median</p>
            </div>
            <div className="w-px h-10 bg-white/10 shrink-0" />
            <div className="flex-1 text-center py-4">
              <p className="text-2xl font-bold text-white/35 font-maplestory leading-tight">{formatMesos.display(aggregateStats.totalP75Cost)}</p>
              <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mt-1">75th %</p>
            </div>
          </div>
        )}

        {/* Settings panel — secondary controls */}
        <div className="border border-white/10 bg-[hsl(217_33%_12%)] rounded-xl px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
          <p className="text-[9px] text-white/40 uppercase tracking-widest font-maplestory">Settings</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'thirtyPercentOff', label: '30% Off Event' },
              { key: 'thirtyPercentBoomReduction', label: '30% Boom Reduction' },
              { key: 'starCatching', label: 'Star Catching' },
              ...(!isMobile ? [{ key: 'isInteractive', label: 'Interactive Server' }] : []),
            ] as { key: keyof typeof enhancedSettings; label: string }[]).map(({ key, label }) => {
              const active = key === 'starCatching' ? enhancedSettings.starCatching !== false : !!enhancedSettings[key];
              return (
                <button
                  key={key}
                  onClick={() => setEnhancedSettings(prev => ({
                    ...prev,
                    [key]: key === 'starCatching' ? !(prev.starCatching !== false) : !prev[key]
                  }))}
                  className={`w-full py-2 rounded-lg text-xs font-maplestory border transition-all ${
                    active
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/[0.05] border-white/15 text-white/55 hover:text-white/80 hover:border-white/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Planning table */}
      <div className="border border-white/10 bg-[hsl(217_33%_9%)] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <p className="text-sm font-bold text-white font-maplestory">StarForce Planning</p>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={triggerRecalculation}
                disabled={isCalculating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-maplestory rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 transition-all disabled:opacity-50"
              >
                {isCalculating
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Calculator className="w-3.5 h-3.5" />
                }
                {isCalculating ? 'Calculating…' : 'Recalculate'}
              </button>
            )}
            {!isMobile && (
              <button
                onClick={exportData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-maplestory rounded-lg border border-white/15 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table body */}
        <div className="p-0">
          {isCalculating ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-maplestory text-white/60">Calculating StarForce costs…</p>
            </div>
          ) : calculationError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-amber-400/60 mx-auto mb-3" />
              <p className="text-sm font-maplestory text-white/60 mb-3">{calculationError}</p>
              <button
                onClick={triggerRecalculation}
                className="px-3 py-1.5 text-xs font-maplestory rounded-lg border border-white/15 bg-white/5 text-white/50 hover:text-white/80 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : sortedEquipmentCalculations.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm font-maplestory text-white/40">All equipment is at target — nothing to plan.</p>
            </div>
          ) : (
            <EquipmentTableContent
              equipmentCalculations={sortedEquipmentCalculations}
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
        </div>
      </div>
    </div>
  );
}

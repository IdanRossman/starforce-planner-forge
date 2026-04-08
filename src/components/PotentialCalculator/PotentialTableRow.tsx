import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Equipment } from "@/types";
import { PotentialBulkItemResult } from "@/services/potentialService";
import { EquipmentImage } from "@/components/EquipmentImage";
import { useFormatting } from "@/hooks/display/useFormatting";
import { Zap, Target, Loader2, Eye, EyeOff, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface PotentialTableRowProps {
  equipment: Equipment;
  calculation?: PotentialBulkItemResult;
  isCalculating: boolean;
  onUpdateCubeType?: (equipmentName: string, cubeType: 'red' | 'black') => void;
  onUpdatePotential?: (equipmentId: string, currentPotential: string, targetPotential: string) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  isItemIncluded: (id: string) => boolean;
  toggleItemIncluded: (id: string) => void;
  smartOptimizationEnabled?: boolean;
  resetUserModifications?: number;
}

export function PotentialTableRow({
  equipment,
  calculation,
  isCalculating,
  onUpdateCubeType,
  onUpdatePotential,
  onSaveEquipment,
  onSaveAdditionalEquipment,
  isItemIncluded,
  toggleItemIncluded,
  smartOptimizationEnabled = false,
  resetUserModifications = 0
}: PotentialTableRowProps) {
  const { formatMesos } = useFormatting();
  
  // Track if user has manually changed the cube type (to hide optimization border)
  const [userModifiedCubeType, setUserModifiedCubeType] = useState(false);

  // Reset user modifications when smart optimization is toggled
  useEffect(() => {
    if (resetUserModifications > 0) {
      setUserModifiedCubeType(false);
    }
  }, [resetUserModifications]);

  // Get current cube type - prioritize user selection over API recommendation
  const userCubeType = equipment.cubeType; // Keep as undefined if not set by user
  const apiRecommendedType = calculation?.cubeType;
  
  // Use user's choice if they have one set, otherwise use API recommendation if available, fallback to black
  const currentCubeType = userCubeType || apiRecommendedType || 'black';
  
  // Get inclusion state
  const included = isItemIncluded(equipment.id || equipment.name);

  // Check if this is showing an API recommendation
  // Show optimization sparkle ONLY when:
  // 1. Smart optimization is enabled
  // 2. API provided a recommendation  
  // 3. User has NOT manually modified the cube type (still using original API recommendation)
  const isOptimizedCubeType = smartOptimizationEnabled && 
    apiRecommendedType && 
    !userModifiedCubeType;

  const handleCubeTypeToggle = (checked: boolean) => {
    const newCubeType = checked ? 'red' : 'black';
    
    // Mark that user has manually changed the cube type
    setUserModifiedCubeType(true);
    
    if (onUpdateCubeType) {
      onUpdateCubeType(equipment.name, newCubeType);
    }
    
    // Update equipment object with proper type casting
    const updatedEquipment = { ...equipment, cubeType: newCubeType as 'red' | 'black' };
    if (onSaveEquipment) {
      onSaveEquipment(updatedEquipment);
    } else if (onSaveAdditionalEquipment) {
      onSaveAdditionalEquipment(updatedEquipment);
    }
  };

  const renderCost = (value: number | undefined, colorClass: string) => {
    if (isCalculating) return <Loader2 className="w-3 h-3 animate-spin text-white/20 mx-auto" />;
    if (value !== undefined) return <span className={`text-xs font-maplestory font-semibold ${colorClass}`}>{formatMesos.display(value)}</span>;
    return <span className="text-xs text-white/15">—</span>;
  };

  const renderCubes = (value: number | undefined, colorClass: string) => {
    if (isCalculating) return <Loader2 className="w-3 h-3 animate-spin text-white/20 mx-auto" />;
    if (value !== undefined) return <span className={`text-xs font-maplestory font-semibold ${colorClass}`}>{value.toFixed(1)}</span>;
    return <span className="text-xs text-white/15">—</span>;
  };

  return (
    <TableRow className={`border-white/5 hover:bg-white/[0.03] transition-colors ${!included ? 'opacity-40' : ''}`}>
      {/* Equipment Image */}
      <TableCell className="py-2 pl-4">
        <EquipmentImage src={equipment.image || '/placeholder.svg'} alt={equipment.name || 'Equipment'} className="w-9 h-9" />
      </TableCell>

      {/* Current Potential */}
      <TableCell className="text-center py-2">
        <span className="text-xs font-maplestory text-white/50 max-w-[100px] truncate block" title={equipment.currentPotentialValue || 'None'}>
          {equipment.currentPotentialValue || <span className="text-white/15">—</span>}
        </span>
      </TableCell>

      {/* Target Potential */}
      <TableCell className="text-center py-2">
        <span className="text-xs font-maplestory text-white/70 max-w-[100px] truncate block" title={equipment.targetPotentialValue || 'None'}>
          {equipment.targetPotentialValue || <span className="text-white/15">—</span>}
        </span>
      </TableCell>

      {/* Cube Type */}
      <TableCell className="text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <Switch
            id={`cube-type-${equipment.id}`}
            checked={currentCubeType === 'red'}
            onCheckedChange={handleCubeTypeToggle}
            className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-purple-500"
          />
          <Label htmlFor={`cube-type-${equipment.id}`} className="text-xs cursor-pointer font-maplestory text-white/60 flex items-center gap-1">
            {currentCubeType === 'red' ? 'Glowing' : 'Bright'}
            {isOptimizedCubeType && <span className="text-[10px]">✨</span>}
          </Label>
        </div>
      </TableCell>

      {/* Cost columns */}
      <TableCell className="text-center py-2">{renderCost(calculation?.result?.averageCost, 'text-primary')}</TableCell>
      <TableCell className="text-center py-2">{renderCost(calculation?.result?.medianCost, 'text-white/60')}</TableCell>
      <TableCell className="text-center py-2">{renderCost(calculation?.result?.percentile75Cost, 'text-white/35')}</TableCell>

      {/* Cubes columns */}
      <TableCell className="text-center py-2">{renderCubes(calculation?.result?.averageCubes, 'text-amber-400/80')}</TableCell>
      <TableCell className="text-center py-2">{renderCubes(calculation?.result?.medianCubes, 'text-white/50')}</TableCell>
      <TableCell className="text-center py-2">{renderCubes(calculation?.result?.percentile75Cubes, 'text-white/30')}</TableCell>

      {/* Actions */}
      <TableCell className="text-center py-2 pr-4">
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => toggleItemIncluded(equipment.id || equipment.name)}
            title={included ? "Exclude from calculations" : "Include in calculations"}
            className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${included ? 'border-white/20 bg-white/8 text-white/50 hover:text-white/80' : 'border-white/10 bg-white/5 text-white/20'}`}
          >
            {included ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onUpdatePotential && equipment.targetPotentialValue && onUpdatePotential(equipment.id || equipment.name, equipment.targetPotentialValue, equipment.targetPotentialValue)}
            title="Mark as completed"
            className="w-6 h-6 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400/70 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdatePotential?.(equipment.id || equipment.name, '', '')}
            title="Remove from planning"
            className="w-6 h-6 rounded border border-red-500/30 bg-red-500/10 text-red-400/70 hover:bg-red-500/20 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Mobile card variant ──────────────────────────────────────────────────────
export function PotentialMobileCard({
  equipment,
  calculation,
  isCalculating,
  onUpdateCubeType,
  onUpdatePotential,
  isItemIncluded,
  toggleItemIncluded,
  smartOptimizationEnabled = false,
  resetUserModifications = 0,
}: PotentialTableRowProps) {
  const { formatMesos } = useFormatting();
  const [userModifiedCubeType, setUserModifiedCubeType] = useState(false);

  useEffect(() => {
    if (resetUserModifications > 0) setUserModifiedCubeType(false);
  }, [resetUserModifications]);

  const userCubeType = equipment.cubeType;
  const apiRecommendedType = calculation?.cubeType;
  const currentCubeType = userCubeType || apiRecommendedType || 'black';
  const included = isItemIncluded(equipment.id || equipment.name);
  const isOptimizedCubeType = smartOptimizationEnabled && apiRecommendedType && !userModifiedCubeType;

  const handleCubeTypeToggle = (checked: boolean) => {
    const newCubeType = checked ? 'red' : 'black';
    setUserModifiedCubeType(true);
    onUpdateCubeType?.(equipment.name, newCubeType);
  };

  return (
    <div className={`rounded-xl border border-white/8 bg-[hsl(217_33%_7%)] p-3 space-y-3 transition-opacity ${!included ? 'opacity-40' : ''}`}>
      {/* Row 1: image + name + actions */}
      <div className="flex items-center gap-2.5">
        <EquipmentImage src={equipment.image || '/placeholder.svg'} alt={equipment.name || 'Equipment'} className="w-9 h-9 shrink-0" />
        <span className="flex-1 text-sm font-maplestory text-white/90 truncate">{equipment.name || 'Unknown'}</span>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => toggleItemIncluded(equipment.id || equipment.name)}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${included ? 'border-white/20 bg-white/8 text-white/60 hover:text-white/90' : 'border-white/10 bg-white/5 text-white/25'}`}>
            {included ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onUpdatePotential && equipment.targetPotentialValue && onUpdatePotential(equipment.id || equipment.name, equipment.targetPotentialValue, equipment.targetPotentialValue)}
            className="w-7 h-7 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400/80 hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onUpdatePotential?.(equipment.id || equipment.name, '', '')}
            className="w-7 h-7 rounded-md border border-red-500/30 bg-red-500/10 text-red-400/80 hover:bg-red-500/20 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: current → target */}
      <div className="flex items-center gap-1.5 text-xs font-maplestory bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/8">
        <span className="truncate text-white/40 max-w-[110px]">{equipment.currentPotentialValue || '—'}</span>
        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
        <span className="truncate text-white/70 max-w-[110px]">{equipment.targetPotentialValue || '—'}</span>
      </div>

      {/* Row 3: cube type + avg cost */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id={`mob-cube-${equipment.id}`}
            checked={currentCubeType === 'red'}
            onCheckedChange={handleCubeTypeToggle}
            className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-purple-500"
          />
          <Label htmlFor={`mob-cube-${equipment.id}`} className="text-xs font-maplestory cursor-pointer text-white/60 flex items-center gap-1">
            {currentCubeType === 'red' ? 'Glowing' : 'Bright'}
            {isOptimizedCubeType && <span className="text-[10px]">✨</span>}
          </Label>
        </div>
        <div className="text-right">
          {isCalculating
            ? <Loader2 className="w-3 h-3 animate-spin text-white/20" />
            : calculation?.result?.averageCost
              ? <span className="text-xs font-maplestory text-primary font-semibold">{formatMesos.display(calculation.result.averageCost)}</span>
              : <span className="text-xs text-white/15 font-maplestory">—</span>
          }
          <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mt-0.5">Avg Cost</p>
        </div>
      </div>

      {/* Row 4: cost breakdown */}
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/8">
        <div className="text-center">
          <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">Median</p>
          <p className="text-xs font-maplestory font-semibold text-white/60">
            {isCalculating ? '—' : calculation?.result?.medianCost ? formatMesos.display(calculation.result.medianCost) : <span className="text-white/15">—</span>}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">75th %</p>
          <p className="text-xs font-maplestory font-semibold text-white/35">
            {isCalculating ? '—' : calculation?.result?.percentile75Cost ? formatMesos.display(calculation.result.percentile75Cost) : <span className="text-white/15">—</span>}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">Avg Cubes</p>
          <p className="text-xs font-maplestory font-semibold text-amber-400/80">
            {isCalculating ? '—' : calculation?.result?.averageCubes ? Math.round(calculation.result.averageCubes).toLocaleString() : <span className="text-white/15">—</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Equipment } from "@/types";
import { PotentialBulkItemResult } from "@/services/potentialService";
import { EquipmentImage } from "@/components/EquipmentImage";
import { useFormatting } from "@/hooks/display/useFormatting";
import { Zap, Target, Loader2, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
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

  const renderCalculationValue = (value: number | undefined, isLoading: boolean, formatter?: (val: number) => string, colorClass?: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-xs">Calculating...</span>
        </div>
      );
    }
    
    if (value !== undefined) {
      return (
        <div className={`font-medium ${colorClass || ''}`}>
          {formatter ? formatter(value) : value.toFixed(1)}
        </div>
      );
    }
    
    return <span className="text-muted-foreground text-xs">Pending</span>;
  };

  return (
    <TableRow className={`group transition-opacity ${!included ? 'opacity-50' : ''}`}>
      {/* Equipment Image */}
      <TableCell className="p-2">
        <div className="flex justify-center">
          <EquipmentImage 
            src={equipment.image || '/placeholder.svg'} 
            alt={equipment.name || 'Equipment'} 
            className="w-10 h-10"
          />
        </div>
      </TableCell>

      {/* Current Potential */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Zap className="w-3 h-3 text-blue-500" />
          <span className="font-medium max-w-[100px] truncate" title={equipment.currentPotentialValue || 'None'}>
            {equipment.currentPotentialValue || 'None'}
          </span>
        </div>
      </TableCell>

      {/* Target Potential */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Target className="w-3 h-3 text-purple-500" />
          <span className="font-medium max-w-[100px] truncate" title={equipment.targetPotentialValue || 'None'}>
            {equipment.targetPotentialValue || 'None'}
          </span>
        </div>
      </TableCell>

      {/* Cube Type Toggle */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2 p-2 rounded-md transition-all duration-300">
          <Switch
            id={`cube-type-${equipment.id}`}
            checked={currentCubeType === 'red'}
            onCheckedChange={handleCubeTypeToggle}
            className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-purple-500"
          />
          <Label 
            htmlFor={`cube-type-${equipment.id}`} 
            className="text-xs cursor-pointer font-maplestory min-w-[50px] flex items-center gap-1"
          >
            {currentCubeType === 'red' ? 'Glowing' : 'Bright'}
            {isOptimizedCubeType && (
              <span className="text-yellow-500 text-sm animate-pulse" title="Recommended by smart optimization">✨</span>
            )}
          </Label>
        </div>
      </TableCell>

      {/* Average Cost */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.averageCost, 
          isCalculating, 
          (val) => formatMesos.display(val),
          'text-yellow-400'
        )}
      </TableCell>

      {/* Median Cost */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.medianCost, 
          isCalculating, 
          (val) => formatMesos.display(val),
          'text-orange-400'
        )}
      </TableCell>

      {/* 75th Percentile Cost */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.percentile75Cost, 
          isCalculating, 
          (val) => formatMesos.display(val),
          'text-red-400'
        )}
      </TableCell>

      {/* Average Cubes */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.averageCubes, 
          isCalculating, 
          undefined,
          'text-yellow-400'
        )}
      </TableCell>

      {/* Median Cubes */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.medianCubes, 
          isCalculating,
          undefined,
          'text-orange-400'
        )}
      </TableCell>

      {/* 75th Percentile Cubes */}
      <TableCell className="text-center font-maplestory">
        {renderCalculationValue(
          calculation?.result?.percentile75Cubes, 
          isCalculating,
          undefined,
          'text-red-400'
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center">
        <div className="flex gap-1 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleItemIncluded(equipment.id || equipment.name)}
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
              if (onUpdatePotential && equipment.targetPotentialValue) {
                onUpdatePotential(equipment.id || equipment.name, equipment.targetPotentialValue, equipment.targetPotentialValue);
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
              if (onUpdatePotential) {
                // Clear both current and target potential values (equivalent to removing from planning)
                onUpdatePotential(equipment.id || equipment.name, '', '');
              }
            }}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Remove from planning (clear potential values)"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

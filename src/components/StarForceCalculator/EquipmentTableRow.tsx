import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, 
  Target, 
  AlertTriangle, 
  Edit, 
  CheckCircle2, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { EquipmentImage } from "@/components/EquipmentImage";
import { EquipmentCalculation } from '@/hooks/starforce/useStarForceCalculation';

interface EquipmentTableRowProps {
  calc: EquipmentCalculation;
  enhancedSettings: {
    isInteractive: boolean;
  };
  hoveredRow: string | null;
  setHoveredRow: (id: string | null) => void;
  isItemIncluded: (id: string) => boolean;
  // Row editing props
  editingStarforce: string | null;
  tempValues: { current: number; target: number };
  setTempValues: React.Dispatch<React.SetStateAction<{ current: number; target: number }>>;
  editingActualCost: string | null;
  tempActualCost: number;
  setTempActualCost: React.Dispatch<React.SetStateAction<number>>;
  // State management props
  itemSafeguard: Record<string, boolean>;
  setItemSafeguard: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  itemSpares: Record<string, number>;
  setItemSpares: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  itemSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setItemSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  tempSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setTempSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  itemActualCosts: Record<string, { value: number; unit: 'M' | 'B' }>;
  setItemActualCosts: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  // Callback functions
  onUpdateSafeguard?: (itemId: string, useSafeguard: boolean) => void;
  onUpdateStarforce?: (itemId: string, currentStarForce: number, targetStarForce: number) => void;
  toggleItemIncluded: (id: string) => void;
  // Helper functions
  isSafeguardEligible: (calc: EquipmentCalculation) => boolean;
  getCurrentSparePrice: (id: string) => { value: number; unit: 'M' | 'B' };
  commitSparePriceChange: (id: string) => void;
  handleQuickAdjust: (calc: EquipmentCalculation, type: 'current' | 'target', delta: number) => void;
  handleStartEdit: (calc: EquipmentCalculation) => void;
  handleSaveEdit: (calc: EquipmentCalculation) => void;
  handleCancelEdit: () => void;
  handleStartActualCostEdit: (calc: EquipmentCalculation) => void;
  handleSaveActualCost: (calc: EquipmentCalculation) => void;
  handleCancelActualCostEdit: () => void;
  // Formatting functions
  formatMesos: {
    display: (amount: number) => string;
  };
  getLuckColor: {
    text: (percentage: number) => string;
  };
  getEnhancedLuckRating: (percentile: number) => { label: string; color: string };
  getLuckText: (percentage: number) => string | null;
}

export const EquipmentTableRow: React.FC<EquipmentTableRowProps> = ({
  calc,
  enhancedSettings,
  hoveredRow,
  setHoveredRow,
  isItemIncluded,
  editingStarforce,
  tempValues,
  setTempValues,
  editingActualCost,
  tempActualCost,
  setTempActualCost,
  itemSafeguard,
  setItemSafeguard,
  itemSpares,
  setItemSpares,
  itemSparePrices,
  setItemSparePrices,
  tempSparePrices,
  setTempSparePrices,
  itemActualCosts,
  setItemActualCosts,
  onUpdateSafeguard,
  onUpdateStarforce,
  toggleItemIncluded,
  isSafeguardEligible,
  getCurrentSparePrice,
  commitSparePriceChange,
  handleQuickAdjust,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleStartActualCostEdit,
  handleSaveActualCost,
  handleCancelActualCostEdit,
  formatMesos,
  getLuckColor,
  getEnhancedLuckRating,
  getLuckText,
}) => {
  const included = isItemIncluded(calc.id);

  return (
    <TableRow 
      key={calc.id}
      onMouseEnter={() => setHoveredRow(calc.id)}
      onMouseLeave={() => setHoveredRow(null)}
      className={`group transition-opacity ${included ? '' : 'opacity-50 bg-muted/30'}`}
    >
      {/* Equipment Image/Name */}
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
      
      {/* Current StarForce */}
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
      
      {/* Target StarForce */}
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
      
      {/* Safeguard */}
      <TableCell className="text-center">
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
      
      {/* Spares */}
      <TableCell className="text-center">
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
      
      {/* Spare Price (conditional) */}
      {enhancedSettings.isInteractive && (
        <TableCell className="text-center">
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
      
      {/* Average Cost */}
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
      
      {/* Median Cost */}
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
      
      {/* 75th Percentile Cost */}
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
      
      {/* Average Booms */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="font-medium text-red-400">
            {calc.averageBooms.toFixed(1)}
          </span>
        </div>
      </TableCell>
      
      {/* Median Booms */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 text-orange-500" />
          <span className="font-medium text-orange-400">
            {calc.medianBooms.toFixed(1)}
          </span>
        </div>
      </TableCell>
      
      {/* 75th Percentile Booms */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span className="font-medium text-red-600">
            {calc.p75Booms.toFixed(1)}
          </span>
        </div>
      </TableCell>
      
      {/* Actual Cost */}
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
      
      {/* Luck Percentage */}
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
      
      {/* Actions */}
      <TableCell className="text-center">
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
};

import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Target,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft
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
  editingField: { id: string; field: 'current' | 'target' } | null;
  tempValue: number;
  setTempValue: React.Dispatch<React.SetStateAction<number>>;
  // State management props
  itemSafeguard: Record<string, boolean>;
  setItemSafeguard: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  itemSpares: Record<string, number>;
  setItemSpares: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  itemSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setItemSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  tempSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setTempSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  // Callback functions
  onUpdateSafeguard?: (itemId: string, useSafeguard: boolean) => void;
  onUpdateStarforce?: (itemId: string, currentStarForce: number, targetStarForce: number) => void;
  toggleItemIncluded: (id: string) => void;
  // Helper functions
  isSafeguardEligible: (calc: EquipmentCalculation) => boolean;
  getCurrentSparePrice: (id: string) => { value: number; unit: 'M' | 'B' };
  commitSparePriceChange: (id: string) => void;
  handleStartFieldEdit: (id: string, field: 'current' | 'target', initial: number) => void;
  handleSaveFieldEdit: (calc: EquipmentCalculation) => void;
  handleCancelFieldEdit: () => void;
  // Formatting functions
  formatMesos: {
    display: (amount: number) => string;
  };
}

export const EquipmentTableRow: React.FC<EquipmentTableRowProps> = ({
  calc,
  enhancedSettings,
  hoveredRow,
  setHoveredRow,
  isItemIncluded,
  editingField,
  tempValue,
  setTempValue,
  itemSafeguard,
  setItemSafeguard,
  itemSpares,
  setItemSpares,
  itemSparePrices,
  setItemSparePrices,
  tempSparePrices,
  setTempSparePrices,
  onUpdateSafeguard,
  onUpdateStarforce,
  toggleItemIncluded,
  isSafeguardEligible,
  getCurrentSparePrice,
  commitSparePriceChange,
  handleStartFieldEdit,
  handleSaveFieldEdit,
  handleCancelFieldEdit,
  formatMesos,
}) => {
  const included = isItemIncluded(calc.id);

  return (
    <TableRow
      key={calc.id}
      onMouseEnter={() => setHoveredRow(calc.id)}
      onMouseLeave={() => setHoveredRow(null)}
      className={`group border-white/5 hover:bg-white/3 transition-all ${included ? '' : 'opacity-40'}`}
    >
      {/* Equipment Image/Name */}
      <TableCell>
        <div className="flex flex-col items-center justify-center gap-1">
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
          
          {/* Transfer Status Indicators */}
          {calc.transferredTo && (
            <Badge variant="destructive" className="text-xs px-1 py-0 h-4 flex items-center gap-1">
              <ArrowRight className="w-2 h-2" />
              Destroyed
            </Badge>
          )}
          {calc.transferredFrom && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex items-center gap-1">
              <ArrowLeft className="w-2 h-2" />
              Transferred
            </Badge>
          )}
        </div>
      </TableCell>
      
      {/* Current StarForce */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {editingField?.id === calc.id && editingField?.field === 'current' ? (
            <Input
              type="number"
              min="0"
              max={calc.targetStarForce}
              value={tempValue}
              autoFocus
              onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
              onBlur={() => handleSaveFieldEdit(calc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                if (e.key === 'Escape') { handleCancelFieldEdit(); }
              }}
              className="w-16 h-8 text-center"
            />
          ) : (
            <button
              onClick={() => handleStartFieldEdit(calc.id, 'current', calc.currentStarForce)}
              className="flex items-center justify-center gap-1 cursor-pointer hover:text-yellow-300 transition-colors"
              title="Click to edit"
            >
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="font-medium">{calc.currentStarForce || 0}</span>
            </button>
          )}
        </div>
      </TableCell>
      
      {/* Target StarForce */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {editingField?.id === calc.id && editingField?.field === 'target' ? (
            <Input
              type="number"
              min={calc.currentStarForce}
              max="30"
              value={tempValue}
              autoFocus
              onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
              onBlur={() => handleSaveFieldEdit(calc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                if (e.key === 'Escape') { handleCancelFieldEdit(); }
              }}
              className="w-16 h-8 text-center"
            />
          ) : (
            <button
              onClick={() => handleStartFieldEdit(calc.id, 'target', calc.targetStarForce)}
              className="flex items-center justify-center gap-1 cursor-pointer hover:text-primary/80 transition-colors"
              title="Click to edit"
            >
              <Target className="w-3 h-3 text-primary" />
              <span className="font-medium">{calc.targetStarForce || 0}</span>
            </button>
          )}
        </div>
      </TableCell>
      
      {/* Safeguard */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          {isSafeguardEligible(calc) ? (
            <Switch
              checked={itemSafeguard[calc.id] || false}
              onCheckedChange={(checked) => {
                setItemSafeguard(prev => ({ ...prev, [calc.id]: checked }));
                if (onUpdateSafeguard) onUpdateSafeguard(calc.id, checked);
              }}
            />
          ) : (
            <span className="text-xs text-white/15">—</span>
          )}
        </div>
      </TableCell>
      
      {/* Spares */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="99"
              value={itemSpares[calc.id] || 0}
              onChange={(e) => {
                const spares = parseInt(e.target.value) || 0;
                setItemSpares(prev => ({ ...prev, [calc.id]: spares }));
              }}
              className="w-14 h-7 text-center text-xs font-maplestory text-white rounded border border-white/15 focus:outline-none focus:border-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ background: 'rgba(255,255,255,0.08)' }}
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
          <span className="font-medium text-primary font-maplestory text-sm">
            {formatMesos.display(calc.averageCost)}
          </span>
          {enhancedSettings.isInteractive && calc.spareCostBreakdown && calc.spareCostBreakdown.averageSpareCost > 0 && (
            <span className="text-[10px] text-white/30 font-maplestory" title={`Enhancement: ${formatMesos.display(calc.spareCostBreakdown.enhancementCost)} + Spares: ${formatMesos.display(calc.spareCostBreakdown.averageSpareCost)}`}>
              +{formatMesos.display(calc.spareCostBreakdown.averageSpareCost)}
            </span>
          )}
        </div>
      </TableCell>

      {/* Median Cost */}
      <TableCell className="text-center">
        <span className="font-medium text-white/60 font-maplestory text-sm">
          {formatMesos.display(calc.medianCost)}
        </span>
      </TableCell>

      {/* 75th Percentile Cost */}
      <TableCell className="text-center">
        <span className="font-medium text-white/35 font-maplestory text-sm">
          {formatMesos.display(calc.p75Cost)}
        </span>
      </TableCell>

      {/* Average Booms */}
      <TableCell className="text-center">
        <span className={`font-medium font-maplestory text-sm ${calc.averageBooms > 0 ? 'text-amber-400/80' : 'text-white/20'}`}>
          {calc.averageBooms.toFixed(1)}
        </span>
      </TableCell>

      {/* Median Booms */}
      <TableCell className="text-center">
        <span className="font-medium text-white/50 font-maplestory text-sm">
          {calc.medianBooms.toFixed(1)}
        </span>
      </TableCell>

      {/* 75th Percentile Booms */}
      <TableCell className="text-center">
        <span className="font-medium text-white/30 font-maplestory text-sm">
          {calc.p75Booms.toFixed(1)}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center pr-4">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => toggleItemIncluded(calc.id)}
            className={`h-7 w-7 rounded-lg border transition-all flex items-center justify-center ${
              included
                ? 'border-white/15 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
                : 'border-white/10 bg-white/3 text-white/20 hover:text-white/50'
            }`}
            title={included ? 'Exclude from calculations' : 'Include in calculations'}
          >
            {included ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onUpdateStarforce?.(calc.id, calc.targetStarForce || 0, calc.targetStarForce || 0)}
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/3 text-green-400/50 hover:text-green-400 hover:bg-green-400/10 hover:border-green-400/20 transition-all flex items-center justify-center"
            title="Mark as completed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateStarforce?.(calc.id, 0, 0)}
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/3 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all flex items-center justify-center"
            title="Reset target to current"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

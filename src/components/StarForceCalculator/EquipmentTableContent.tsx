import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Star, Target, AlertTriangle, CheckCircle2, X, Eye, EyeOff, ArrowRight, ArrowLeft
} from "lucide-react";
import { EquipmentImage } from "@/components/EquipmentImage";
import { EquipmentTableHeader } from './EquipmentTableHeader';
import { EquipmentTableRow } from './EquipmentTableRow';
import { EquipmentCalculation } from '@/hooks/starforce/useStarForceCalculation';
import { SortField, SortDirection } from "@/hooks/utils/useTable";
import { useIsMobile } from "@/hooks/use-mobile";

interface EquipmentTableContentProps {
  equipmentCalculations: EquipmentCalculation[];
  enhancedSettings: {
    isInteractive: boolean;
  };
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
  getSortIcon: (field: SortField) => JSX.Element;
  hoveredRow: string | null;
  setHoveredRow: (id: string | null) => void;
  isItemIncluded: (id: string) => boolean;
  editingField: { id: string; field: 'current' | 'target' } | null;
  tempValue: number;
  setTempValue: React.Dispatch<React.SetStateAction<number>>;
  itemSafeguard: Record<string, boolean>;
  setItemSafeguard: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  itemSpares: Record<string, number>;
  setItemSpares: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  itemSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setItemSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  tempSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  setTempSparePrices: React.Dispatch<React.SetStateAction<Record<string, { value: number; unit: 'M' | 'B' }>>>;
  onUpdateSafeguard?: (itemId: string, useSafeguard: boolean) => void;
  onUpdateStarforce?: (itemId: string, currentStarForce: number, targetStarForce: number) => void;
  toggleItemIncluded: (id: string) => void;
  isSafeguardEligible: (calc: EquipmentCalculation) => boolean;
  getCurrentSparePrice: (id: string) => { value: number; unit: 'M' | 'B' };
  commitSparePriceChange: (id: string) => void;
  handleStartFieldEdit: (id: string, field: 'current' | 'target', initial: number) => void;
  handleSaveFieldEdit: (calc: EquipmentCalculation) => void;
  handleCancelFieldEdit: () => void;
  formatMesos: {
    display: (amount: number) => string;
  };
}

export const EquipmentTableContent: React.FC<EquipmentTableContentProps> = (props) => {
  const { equipmentCalculations } = props;
  const isMobile = useIsMobile();

  if (equipmentCalculations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2 font-maplestory">No Pending Equipment</h3>
        <p className="text-muted-foreground font-maplestory">All equipment is already at target StarForce levels!</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 max-h-[600px] overflow-y-auto px-0.5 pb-1">
        {equipmentCalculations.map((calc) => {
          const included = props.isItemIncluded(calc.id);
          const isEditingCurrent = props.editingField?.id === calc.id && props.editingField?.field === 'current';
          const isEditingTarget = props.editingField?.id === calc.id && props.editingField?.field === 'target';

          return (
            <div
              key={calc.id}
              className={`rounded-lg border border-border/50 p-3 space-y-3 bg-card/50 transition-opacity ${included ? '' : 'opacity-50 bg-muted/30'}`}
            >
              {/* Row 1: image + name + action buttons */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm font-maplestory leading-tight">{calc.name || 'Equipment'}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {calc.transferredTo && (
                      <Badge variant="destructive" className="text-xs px-1 py-0 h-4 flex items-center gap-0.5">
                        <ArrowRight className="w-2 h-2" />Destroyed
                      </Badge>
                    )}
                    {calc.transferredFrom && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex items-center gap-0.5">
                        <ArrowLeft className="w-2 h-2" />Transferred
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm" variant="outline"
                    onClick={() => props.toggleItemIncluded(calc.id)}
                    className={`h-8 w-8 p-0 ${included ? 'text-blue-500' : 'text-gray-400'}`}
                    title={included ? "Exclude from calculations" : "Include in calculations"}
                  >
                    {included ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => props.onUpdateStarforce?.(calc.id, calc.targetStarForce || 0, calc.targetStarForce || 0)}
                    className="h-8 w-8 p-0 text-green-600"
                    title="Mark as completed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => props.onUpdateStarforce?.(calc.id, 0, 0)}
                    className="h-8 w-8 p-0 text-red-600"
                    title="Remove from planning"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Current SF → Target SF + Safeguard */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-yellow-500 shrink-0" />
                  {isEditingCurrent ? (
                    <Input
                      type="number" min="0" max={calc.targetStarForce}
                      value={props.tempValue} autoFocus
                      onChange={(e) => props.setTempValue(parseInt(e.target.value) || 0)}
                      onBlur={() => props.handleSaveFieldEdit(calc)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { props.handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                        if (e.key === 'Escape') props.handleCancelFieldEdit();
                      }}
                      className="w-14 h-8 text-center text-sm"
                    />
                  ) : (
                    <button
                      onClick={() => props.handleStartFieldEdit(calc.id, 'current', calc.currentStarForce)}
                      className="font-semibold text-sm hover:text-yellow-300 transition-colors min-w-[1.5rem] text-left"
                      title="Tap to edit"
                    >
                      {calc.currentStarForce || 0}
                    </button>
                  )}
                </div>
                <span className="text-muted-foreground text-sm">→</span>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-primary shrink-0" />
                  {isEditingTarget ? (
                    <Input
                      type="number" min={calc.currentStarForce} max="30"
                      value={props.tempValue} autoFocus
                      onChange={(e) => props.setTempValue(parseInt(e.target.value) || 0)}
                      onBlur={() => props.handleSaveFieldEdit(calc)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { props.handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                        if (e.key === 'Escape') props.handleCancelFieldEdit();
                      }}
                      className="w-14 h-8 text-center text-sm"
                    />
                  ) : (
                    <button
                      onClick={() => props.handleStartFieldEdit(calc.id, 'target', calc.targetStarForce)}
                      className="font-semibold text-sm hover:text-primary/80 transition-colors min-w-[1.5rem] text-left"
                      title="Tap to edit"
                    >
                      {calc.targetStarForce || 0}
                    </button>
                  )}
                </div>
                {props.isSafeguardEligible(calc) && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-muted-foreground font-maplestory">Guard:</span>
                    <Switch
                      checked={props.itemSafeguard[calc.id] || false}
                      onCheckedChange={(checked) => {
                        props.setItemSafeguard(prev => ({ ...prev, [calc.id]: checked }));
                        props.onUpdateSafeguard?.(calc.id, checked);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Booms + Cost breakdown */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-maplestory">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span>{calc.averageBooms.toFixed(1)} avg booms</span>
              </div>

              {/* Row 4: Cost breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-maplestory mb-0.5">Avg Cost</p>
                  <p className="text-xs font-semibold text-yellow-400">{props.formatMesos.display(calc.averageCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-maplestory mb-0.5">Median</p>
                  <p className="text-xs font-semibold text-orange-400">{props.formatMesos.display(calc.medianCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-maplestory mb-0.5">75th %</p>
                  <p className="text-xs font-semibold text-red-400">{props.formatMesos.display(calc.p75Cost)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto overflow-x-auto">
      <Table>
        <EquipmentTableHeader
          enhancedSettings={props.enhancedSettings}
          sortField={props.sortField}
          sortDirection={props.sortDirection}
          onSort={props.onSort}
          getSortIcon={props.getSortIcon}
        />
        <TableBody>
          {equipmentCalculations.map((calc) => (
            <EquipmentTableRow
              key={calc.id}
              calc={calc}
              {...props}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

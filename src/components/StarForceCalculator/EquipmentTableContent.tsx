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
      <div className="space-y-2 p-3 max-h-[600px] overflow-y-auto">
        {equipmentCalculations.map((calc) => {
          const included = props.isItemIncluded(calc.id);
          const isEditingCurrent = props.editingField?.id === calc.id && props.editingField?.field === 'current';
          const isEditingTarget = props.editingField?.id === calc.id && props.editingField?.field === 'target';
          const highBooms = calc.averageBooms >= 2;

          return (
            <div
              key={calc.id}
              className={`rounded-xl border border-white/8 bg-[hsl(217_33%_7%)] p-3 space-y-3 transition-opacity ${included ? '' : 'opacity-40'}`}
            >
              {/* Row 1: image + name + actions */}
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <EquipmentImage src={calc.image} alt={calc.name} size="md" maxRetries={2} showFallback={true} />
                  {!included && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                      <EyeOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-maplestory text-white/90 truncate leading-tight">{calc.name || 'Equipment'}</p>
                  <div className="flex gap-1 mt-0.5">
                    {calc.transferredTo && (
                      <span className="text-[9px] font-maplestory text-red-400/70 flex items-center gap-0.5">
                        <ArrowRight className="w-2 h-2" />Destroyed
                      </span>
                    )}
                    {calc.transferredFrom && (
                      <span className="text-[9px] font-maplestory text-white/40 flex items-center gap-0.5">
                        <ArrowLeft className="w-2 h-2" />Transferred
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => props.toggleItemIncluded(calc.id)}
                    title={included ? "Exclude from calculations" : "Include in calculations"}
                    className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${included ? 'border-white/20 bg-white/8 text-white/60 hover:text-white/90' : 'border-white/10 bg-white/5 text-white/25'}`}
                  >
                    {included ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => props.onUpdateStarforce?.(calc.id, calc.targetStarForce || 0, calc.targetStarForce || 0)}
                    title="Mark as completed"
                    className="w-7 h-7 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400/80 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => props.onUpdateStarforce?.(calc.id, 0, 0)}
                    title="Remove from planning"
                    className="w-7 h-7 rounded-md border border-red-500/30 bg-red-500/10 text-red-400/80 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: stars + guard + spares */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/8">
                  <span className="text-white/40 text-xs">☆</span>
                  {isEditingCurrent ? (
                    <input
                      type="number" min="0" max={calc.targetStarForce}
                      value={props.tempValue} autoFocus
                      onChange={(e) => props.setTempValue(parseInt(e.target.value) || 0)}
                      onBlur={() => props.handleSaveFieldEdit(calc)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { props.handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                        if (e.key === 'Escape') props.handleCancelFieldEdit();
                      }}
                      className="w-10 bg-transparent text-center text-sm text-white outline-none font-maplestory [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <button onClick={() => props.handleStartFieldEdit(calc.id, 'current', calc.currentStarForce)}
                      className="text-sm font-maplestory text-white/80 hover:text-white transition-colors min-w-[1rem]">
                      {calc.currentStarForce || 0}
                    </button>
                  )}
                  <span className="text-white/20 text-xs">→</span>
                  <span className="text-primary/60 text-xs">★</span>
                  {isEditingTarget ? (
                    <input
                      type="number" min={calc.currentStarForce} max="30"
                      value={props.tempValue} autoFocus
                      onChange={(e) => props.setTempValue(parseInt(e.target.value) || 0)}
                      onBlur={() => props.handleSaveFieldEdit(calc)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { props.handleSaveFieldEdit(calc); e.currentTarget.blur(); }
                        if (e.key === 'Escape') props.handleCancelFieldEdit();
                      }}
                      className="w-10 bg-transparent text-center text-sm text-primary outline-none font-maplestory [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <button onClick={() => props.handleStartFieldEdit(calc.id, 'target', calc.targetStarForce)}
                      className="text-sm font-maplestory text-primary hover:text-primary/80 transition-colors min-w-[1rem]">
                      {calc.targetStarForce || 0}
                    </button>
                  )}
                </div>

                {props.isSafeguardEligible(calc) && (
                  <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/8">
                    <span className="text-[10px] text-white/40 font-maplestory">Guard</span>
                    <Switch
                      checked={props.itemSafeguard[calc.id] || false}
                      onCheckedChange={(checked) => {
                        props.setItemSafeguard(prev => ({ ...prev, [calc.id]: checked }));
                        props.onUpdateSafeguard?.(calc.id, checked);
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/8 ml-auto">
                  <span className="text-[10px] text-white/40 font-maplestory">Spares</span>
                  <input
                    type="number" min="0"
                    value={props.itemSpares[calc.id] || 0}
                    onChange={(e) => props.setItemSpares(prev => ({ ...prev, [calc.id]: parseInt(e.target.value) || 0 }))}
                    className="w-8 bg-transparent text-center text-sm text-white/80 outline-none font-maplestory [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Row 3: booms (only warn if high) */}
              {highBooms && (
                <div className="flex items-center gap-1.5 text-[11px] font-maplestory text-amber-400/80">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{calc.averageBooms.toFixed(1)} avg booms — consider getting spares</span>
                </div>
              )}
              {!highBooms && (
                <div className="text-[11px] font-maplestory text-white/25">
                  {calc.averageBooms.toFixed(1)} avg booms
                </div>
              )}

              {/* Row 4: cost breakdown */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/8">
                <div className="text-center">
                  <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">Avg Cost</p>
                  <p className="text-xs font-maplestory font-semibold text-primary">{props.formatMesos.display(calc.averageCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">Median</p>
                  <p className="text-xs font-maplestory font-semibold text-white/60">{props.formatMesos.display(calc.medianCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/30 font-maplestory uppercase tracking-wide mb-0.5">75th %</p>
                  <p className="text-xs font-maplestory font-semibold text-white/35">{props.formatMesos.display(calc.p75Cost)}</p>
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

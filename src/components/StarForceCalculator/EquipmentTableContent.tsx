import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Star } from "lucide-react";
import { EquipmentTableHeader } from './EquipmentTableHeader';
import { EquipmentTableRow } from './EquipmentTableRow';
import { EquipmentCalculation } from '@/hooks/starforce/useStarForceCalculation';
import { SortField, SortDirection } from "@/hooks/utils/useTable";

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

export const EquipmentTableContent: React.FC<EquipmentTableContentProps> = (props) => {
  const { equipmentCalculations } = props;

  if (equipmentCalculations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2 font-maplestory">No Pending Equipment</h3>
        <p className="text-muted-foreground font-maplestory">All equipment is already at target StarForce levels!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
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

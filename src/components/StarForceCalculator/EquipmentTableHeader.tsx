import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortField, SortDirection } from "@/hooks/utils/useTable";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface EquipmentTableHeaderProps {
  enhancedSettings: {
    isInteractive: boolean;
  };
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
  getSortIcon: (field: SortField) => JSX.Element;
}

export const EquipmentTableHeader: React.FC<EquipmentTableHeaderProps> = ({
  enhancedSettings,
  sortField,
  sortDirection,
  onSort,
  getSortIcon,
}) => {
  const SortableButton: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <button
      className="flex items-center gap-1 font-maplestory text-white/50 hover:text-white/80 transition-colors text-[11px] uppercase tracking-wide"
      onClick={() => onSort(field)}
    >
      {children}
      {getSortIcon(field as SortField)}
    </button>
  );

  return (
    <TableHeader className="bg-[hsl(217_33%_7%)]">
      {/* Superheader row */}
      <TableRow className="border-b border-white/8 hover:bg-transparent">
        <TableHead className="py-1.5" colSpan={2} />
        <TableHead className="py-1.5" />
        <TableHead className="py-1.5 text-center" colSpan={2}>
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-maplestory">Config</span>
        </TableHead>
        {enhancedSettings.isInteractive && <TableHead className="py-1.5" />}
        <TableHead className="py-1.5 text-center" colSpan={3}>
          <span className="text-[9px] text-primary/40 uppercase tracking-widest font-maplestory">Cost</span>
        </TableHead>
        <TableHead className="py-1.5 text-center" colSpan={3}>
          <span className="text-[9px] text-amber-400/40 uppercase tracking-widest font-maplestory">Booms</span>
        </TableHead>
        <TableHead className="py-1.5" />
      </TableRow>

      {/* Column header row */}
      <TableRow className="border-b border-white/8 hover:bg-transparent">
        <TableHead className="py-2 pl-4">
          <SortableButton field="name">Item</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="currentStarForce">Current</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="targetStarForce">Target</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Guard</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Spares</span>
        </TableHead>
        {enhancedSettings.isInteractive && (
          <TableHead className="py-2 text-center">
            <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Spare Price</span>
          </TableHead>
        )}
        <TableHead className="py-2 text-center">
          <SortableButton field="averageCost">Avg</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="medianCost">Med</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="p75Cost">75th%</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="averageBooms">Avg</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="medianBooms">Med</SortableButton>
        </TableHead>
        <TableHead className="py-2 text-center">
          <SortableButton field="p75Booms">75th%</SortableButton>
        </TableHead>
        <TableHead className="py-2 pr-4 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

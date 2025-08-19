import React from 'react';
import { Button } from "@/components/ui/button";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SortField, SortDirection } from "@/hooks/utils/useTable";

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
    <Button
      variant="ghost"
      className="font-semibold p-0 h-auto hover:bg-transparent font-maplestory"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {getSortIcon(field)}
      </span>
    </Button>
  );

  return (
    <TableHeader className="sticky top-0 bg-background z-10 border-b">
      <TableRow>
        <TableHead>
          <SortableButton field="name">Item</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="currentStarForce">Current SF</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="targetStarForce">Target SF</SortableButton>
        </TableHead>
        <TableHead className="text-center font-maplestory">Safeguard</TableHead>
        <TableHead className="text-center font-maplestory">Spares</TableHead>
        {enhancedSettings.isInteractive && (
          <TableHead className="text-center font-maplestory">Spare Price</TableHead>
        )}
        <TableHead 
          className="text-center" 
          title={enhancedSettings.isInteractive ? "Enhancement cost + expected spare costs" : "Expected enhancement cost only"}
        >
          <SortableButton field="averageCost">Average Cost</SortableButton>
        </TableHead>
        <TableHead 
          className="text-center" 
          title={enhancedSettings.isInteractive ? "Enhancement cost + median spare costs" : "Median enhancement cost only"}
        >
          <SortableButton field="medianCost">Median Cost</SortableButton>
        </TableHead>
        <TableHead 
          className="text-center" 
          title={enhancedSettings.isInteractive ? "Enhancement cost + 75th percentile spare costs" : "75th percentile enhancement cost only"}
        >
          <SortableButton field="p75Cost">75th % Cost</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="averageBooms">Avg Booms</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="medianBooms">Med Booms</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="p75Booms">75th % Booms</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="actualCost">Actual Cost</SortableButton>
        </TableHead>
        <TableHead className="text-center">
          <SortableButton field="luckPercentage">Luck</SortableButton>
        </TableHead>
        <TableHead className="text-center font-maplestory">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

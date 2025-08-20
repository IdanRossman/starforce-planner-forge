import { Equipment } from '@/types';
import { EquipmentCalculation, SortField, SortDirection, GlobalSettings } from '@/hooks/starforce';
import { ItemSettings, ItemSpares, ItemSparePrices, ItemActualCosts } from '@/hooks/starforce';

// Main component props
export interface StarForceCalculatorProps {
  equipment?: Equipment[];
  additionalEquipment?: Equipment[];
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onUpdateSafeguard?: (equipmentId: string, safeguard: boolean) => void;
  characterId?: string;
  characterName?: string;
}

// Table editing state (extends existing settings)
export interface EquipmentTableEditingState {
  editingStarforce: string | null;
  editingActualCost: string | null;
  tempValues: { current: number; target: number };
  tempActualCost: number;
  hoveredRow: string | null;
}

// Table event handlers
export interface EquipmentTableHandlers {
  onStartEditStarforce: (equipmentId: string, current: number, target: number) => void;
  onStartEditActualCost: (equipmentId: string, actualCost: number) => void;
  onSaveStarforceEdit: (equipmentId: string, values: { current: number; target: number }) => void;
  onSaveActualCostEdit: (equipmentId: string, actualCost: number) => void;
  onCancelEdit: () => void;
  onUpdateSparePrice: (equipmentId: string, price: { value: number; unit: 'M' | 'B' }) => void;
  onToggleIncluded: (equipmentId: string) => void;
  onToggleSafeguard: (equipmentId: string) => void;
  onSort: (field: SortField) => void;
  onRowHover: (equipmentId: string | null) => void;
}

// Component props
export interface EquipmentTableRowProps {
  calculation: EquipmentCalculation;
  isEditingStarforce: boolean;
  isEditingActualCost: boolean;
  isHovered: boolean;
  tempValues: { current: number; target: number };
  tempActualCost: number;
  handlers: EquipmentTableHandlers;
  globalSettings: GlobalSettings;
  sparePrices: ItemSparePrices;
  itemIncluded: ItemSettings;
  itemSafeguard: ItemSettings;
}

export interface EquipmentTableHeaderProps {
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export interface EquipmentTableSettingsProps {
  globalSettings: GlobalSettings;
  onUpdateGlobalSettings: (settings: GlobalSettings) => void;
  onRecalculate: () => void;
  isCalculating: boolean;
}

export interface OverallLuckAnalysis {
  percentile: number;
  rating: string;
  color: string;
  shareMessage: string;
  description: string;
}

export interface EquipmentTableSummaryProps {
  aggregateStats: {
    totalExpectedCost: number;
    totalActualCost: number;
    totalExpectedBooms: number;
    totalMedianBooms: number;
    totalP75Cost: number;
    totalP75Booms: number;
    overallLuckPercentage: number;
    overallLuck: OverallLuckAnalysis | null;
    hasActualCosts: boolean;
    includedCount: number;
    totalCount: number;
  };
  equipmentCount: number;
  isCalculating: boolean;
}

// Legacy StarForce hooks - to be migrated to new architecture
export { useStarForceItemSettings } from './useStarForceItemSettings';
export { useStarForceCalculation } from './useStarForceCalculation';
export { useEquipmentManagement } from './useEquipmentManagement';

// Re-export types
export type { 
  ItemSettings, 
  ItemSpares, 
  ItemSparePrices, 
  ItemActualCosts 
} from './useStarForceItemSettings';
export type {
  EquipmentCalculation,
  SortField,
  SortDirection,
  GlobalSettings,
  UseStarForceCalculationOptions
} from './useStarForceCalculation';

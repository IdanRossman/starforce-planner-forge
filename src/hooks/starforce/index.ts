// StarForce hooks for managing state and localStorage
export { useCharacterStorage } from './useCharacterStorage';
export { useStarForceItemSettings } from './useStarForceItemSettings';
export { useStarForceCalculation } from './useStarForceCalculation';
export { useEquipmentManagement } from './useEquipmentManagement';

// Re-export types
export type { UseCharacterStorageOptions } from './useCharacterStorage';
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

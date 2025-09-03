// Core hooks - fundamental functionality
export { useStorage, usePersistentState } from './core/useStorage';
export type { StorageOptions } from './core/useStorage';

// Data management hooks - CRUD operations and business logic
export { useCharacter } from './data/useCharacter';
export { useEquipment } from './data/useEquipment';
export type { CharacterOperations } from './data/useCharacter';
export type { 
  StarForceAdjustable, 
  EquipmentOperations 
} from './data/useEquipment';

// Display hooks - formatting and presentation
export { useFormatting } from './display/useFormatting';
export type { 
  LuckRating, 
  DangerLevel 
} from './display/useFormatting';

// Game-specific hooks - StarForce settings and calculations
export { useSettings } from './game/useSettings';
export type { 
  GlobalSettings, 
  ItemSettings, 
  SettingsOperations 
} from './game/useSettings';

// Utility hooks - table operations, UI helpers
export { useTable } from './utils/useTable';
export { useEquipmentFormValidation } from './utils/useEquipmentFormValidation';
export type { 
  SortDirection, 
  SortField, 
  SortState, 
  FilterState, 
  TableUtilities 
} from './utils/useTable';
export type { EquipmentFormData } from './utils/useEquipmentFormValidation';

// Legacy hooks - maintain compatibility
export { useCharacterContext } from './useCharacterContext';

// StarForce-specific legacy hooks (to be migrated)
export { useStarForceCalculation } from './starforce/useStarForceCalculation';
export { useStarForceItemSettings } from './starforce/useStarForceItemSettings';
export { useStarForceUtils } from './starforce/useStarForceUtils';
export type { 
  EquipmentCalculation,
  UseStarForceCalculationOptions 
} from './starforce/useStarForceCalculation';
export type { StarForceUtilities } from './starforce/useStarForceUtils';

/**
 * Hook Organization:
 * 
 * /core/ - Fundamental hooks that other hooks depend on
 *   - useStorage: Generic localStorage management
 * 
 * /data/ - Business logic and CRUD operations
 *   - useCharacter: Character management operations
 *   - useEquipment: Equipment management operations
 * 
 * /display/ - Presentation and formatting utilities
 *   - useFormatting: Display formatting (mesos, colors, etc.)
 * 
 * /game/ - Game-specific logic and settings
 *   - useSettings: StarForce settings management
 * 
 * /utils/ - Generic utilities and UI helpers
 *   - useTable: Table operations (sort, filter, paginate, select)
 * 
 * /starforce/ - Legacy StarForce-specific hooks (to be refactored)
 *   - useStarForceCalculation: Main calculation logic
 * 
 * Migration Plan:
 * 1. ✅ Created new organized hook structure
 * 2. 🔄 Update components to use new hooks
 * 3. ⏳ Migrate remaining logic from old hooks
 * 4. ⏳ Remove redundant hooks
 * 5. ⏳ Update StarForceCalculator to use new architecture
 */

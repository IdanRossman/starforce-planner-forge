# Hook Architecture Refactoring - Implementation Guide

## ✅ Completed: New Hook Structure

### Directory Organization
```
src/hooks/
├── core/           # Fundamental functionality
│   └── useStorage.ts
├── data/           # Business logic & CRUD
│   ├── useCharacter.ts
│   └── useEquipment.ts  
├── display/        # Presentation utilities
│   └── useFormatting.ts
├── game/           # Game-specific logic
│   └── useSettings.ts
├── utils/          # Generic utilities
│   └── useTable.ts
├── starforce/      # Legacy (to migrate)
│   └── useStarForceCalculation.ts
└── index.ts        # Main exports
```

### 🎯 Core Hooks Created

#### 1. `useStorage` (core/useStorage.ts)
- **Purpose**: Generic localStorage with character-specific namespacing
- **Features**: Load/save data, persistent state management, namespace support
- **Storage Structure**: Documented with comments

#### 2. `useEquipment` (data/useEquipment.ts) 
- **Purpose**: All equipment operations (CRUD, StarForce, transfers)
- **Features**: 
  - StarForce operations (update, quick adjust)
  - Cost tracking (actual cost, clear cost)
  - Safeguard management
  - Equipment CRUD (add, update, remove, clear)
  - Bulk operations (bulk update StarForce/safeguard)
  - Advanced transfer system (prepare, cancel, complete, validation, history)
  - Utilities (duplicate, reset progress)

#### 3. `useCharacter` (data/useCharacter.ts)
- **Purpose**: Character management and MapleRanks integration
- **Features**:
  - Character CRUD (create, update, delete, duplicate)
  - Character selection management
  - MapleRanks data fetching and updating
  - Equipment operations for selected character
  - Import/export functionality
  - Character validation and summaries

#### 4. `useFormatting` (display/useFormatting.ts)
- **Purpose**: All display formatting utilities
- **Features**:
  - Mesos formatting (display, export, precise, auto)
  - Luck rating analysis with colors
  - Danger level assessment
  - Star display representation
  - Progress percentage calculations

#### 5. `useSettings` (game/useSettings.ts)
- **Purpose**: StarForce calculation settings management
- **Features**:
  - Global settings (events, star catching, spares)
  - Per-item settings with persistence
  - Bulk operations and copying
  - Import/export settings
  - Effective settings with fallbacks

#### 6. `useTable` (utils/useTable.ts)
- **Purpose**: Complete table management utilities
- **Features**:
  - Sorting (multi-type support, icons)
  - Filtering with custom functions
  - Pagination with state management
  - Selection (single, bulk, clear)
  - CSV export with headers
  - Reset all functionality

## 🔄 Migration Plan

### Phase 1: Remove Duplicate Logic ⚠️ NEXT STEP
1. **Delete over-specific hooks we created:**
   - `starforce/useDisplayFormatting.ts` → Use `display/useFormatting.ts`
   - `starforce/useItemFiltering.ts` → Use `utils/useTable.ts` filtering
   - `starforce/useTableEditing.ts` → Use `data/useEquipment.ts` + `game/useSettings.ts`
   - `starforce/useDataExport.ts` → Use `utils/useTable.ts` export
   - `starforce/useTableSorting.ts` → Use `utils/useTable.ts` sorting

2. **Consolidate existing hooks:**
   - Merge `useEquipmentOperations.ts` logic into `data/useEquipment.ts`
   - Review `starforce/useEquipmentManagement.ts` for missing functionality
   - Migrate `starforce/useStarForceItemSettings.ts` to `game/useSettings.ts`

### Phase 2: Update Components
1. **StarForceCalculator.tsx** - Replace business logic with new hooks:
   ```tsx
   const formatting = useFormatting();
   const equipment = useEquipment();
   const settings = useSettings({ characterId, mode: 'equipment-table' });
   const table = useTable();
   ```

2. **EnhancedEquipmentManager.tsx** - Simplify with equipment hook
3. **Other components** - Gradually migrate to new hook structure

### Phase 3: Clean Up
1. Remove redundant hooks
2. Update imports throughout codebase
3. Test all functionality
4. Update documentation

## 🎁 Benefits Achieved

### 1. **Clear Separation of Concerns**
- **Data Layer**: Character/Equipment CRUD operations
- **Business Logic**: Settings, calculations, validations
- **Presentation**: Formatting, colors, display utilities
- **UI State**: Table operations, sorting, filtering

### 2. **Reduced Duplication**
- Single source for formatting logic
- Consolidated equipment operations
- Unified settings management
- Reusable table utilities

### 3. **Better Organization**
- Logical directory structure
- Clear naming conventions
- Comprehensive type exports
- Future-friendly architecture

### 4. **Enhanced Functionality**
- Advanced transfer system with validation
- Comprehensive table operations
- Flexible settings with fallbacks
- Robust import/export capabilities

## 🚀 Next Actions

1. **Delete redundant hooks** (starforce/useDisplayFormatting.ts, etc.)
2. **Update StarForceCalculator** to use new hook architecture
3. **Test integration** with existing components
4. **Migrate remaining legacy hooks** one by one

The foundation is now solid and ready for the migration!

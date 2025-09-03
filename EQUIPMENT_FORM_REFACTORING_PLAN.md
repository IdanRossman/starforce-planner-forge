# Equipment Form Refactoring Plan

## Current State Analysis

### Issues Identified
1. **Monolithic Component**: EquipmentForm.tsx is 700+ lines with multiple responsibilities
2. **Mixed Concerns**: UI logic, business logic, form validation, and data transformation all in one file
3. **Code Duplication**: Encoding/decoding functions, validation logic scattered throughout
4. **Hard to Test**: Business logic tightly coupled with UI components
5. **Poor UX**: Linear form doesn't scale well for multiple enhancement types (potential + StarForce + flames + transfer)
6. **Duplicate Logic**: Transfer logic exists in both EquipmentForm and existing hooks

### Current Functionality Inventory
- Equipment slot selection (categorized)
- Equipment selection from API with loading states
- Current/Target potential selection with tier-based categories
- StarForce toggle with current/target sliders
- Real-time validation and auto-adjustments
- Transfer functionality integration (duplicated logic)
- Form state management with react-hook-form

### Existing Hook Infrastructure
**StarForce Hooks** (`hooks/starforce/`):
- `useEquipmentManagement`: StarForce adjustments, cost updates, safeguard management
- `useStarForceCalculation`: Calculation logic for StarForce costs
- `useStarForceItemSettings`: Individual item settings management

**Data Hooks** (`hooks/data/`):
- `useEquipment`: **COMPREHENSIVE equipment operations including transfer logic**
  - `transferStarForce`: Full transfer implementation
  - `canTransfer`: Transfer validation with detailed reasons
  - `prepareTransfer`, `cancelTransfer`, `completeTransfer`: Transfer state management
  - `addEquipment`, `updateEquipment`, `removeEquipment`: CRUD operations
  - `updateStarForce`, `updateActualCost`, `updateSafeguard`: Property updates
- `useCharacter`: Character context operations

**Game Hooks** (`hooks/game/`):
- `usePotential`: Potential templates, formatting, validation
- `useSettings`: Game-wide settings

**Core Hooks** (`hooks/core/`):
- `useStorage`: Local storage operations

### Current Transfer Logic Duplication
The EquipmentForm currently has its own transfer logic (~100 lines) that duplicates functionality already available in `useEquipment`:

**EquipmentForm Transfer Logic**:
- Custom `canTransfer` function 
- Custom `handleTransfer` function
- Manual transfer state management
- Slot conflict resolution

**useEquipment Transfer Logic**:
- `canTransfer` with detailed validation and reasons
- `transferStarForce` with proper state updates
- `prepareTransfer`, `cancelTransfer`, `completeTransfer` for workflow
- `getTransferHistory` for tracking
- Integrated with character context

## Proposed Architecture

### 1. Hook Extraction Strategy

#### A. Enhanced `usePotential` Hook
**Location**: `hooks/game/usePotential.ts`
**Current State**: ✅ Already exists with templates and formatting
**New Responsibilities**:
- Move encoding/decoding functions from component
- Add validation functions
- Add form initialization helpers
- Export consistent formatting utilities

```typescript
export interface UsePotentialReturn {
  // Existing ✅
  getPotentialTemplates: (type: EquipmentType, tier: EquipmentTier) => string[];
  formatPotentialLine: (template: string) => string;
  createPotentialLine: (template: string) => PotentialLine;
  
  // New - Move from component
  encodePotentialValue: (tier: EquipmentTier, template: string) => string;
  decodePotentialValue: (encodedValue: string) => { tier: EquipmentTier; template: string } | null;
  getTemplateFromEncodedValue: (encodedValue: string) => string;
  
  // New - Category generation
  getPotentialCategories: (equipmentType: EquipmentType) => SelectCategory[];
  
  // New - Form helpers
  initializePotentialFromEquipment: (equipment: Equipment) => { current: string; target: string };
  validatePotentialSelection: (current: string, target: string) => ValidationResult;
}
```

#### B. Leverage Existing `useEquipment` Hook
**Location**: `hooks/data/useEquipment.ts`
**Current State**: ✅ Already comprehensive with transfer logic
**Integration Strategy**:
- **Remove duplicate transfer logic from EquipmentForm**
- Use existing `canTransfer` function (more robust validation)
- Use existing `transferStarForce` function
- Leverage existing equipment CRUD operations

**Existing Transfer Operations to Use**:
```typescript
transferStarForce: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
canTransfer: (sourceEquipment: Equipment, targetEquipment: Equipment) => { canTransfer: boolean; reason?: string };
prepareTransfer: (sourceEquipmentId: string, targetEquipmentId: string) => void;
cancelTransfer: (equipmentId: string) => void;
completeTransfer: (sourceEquipmentId: string) => void;
```

#### C. New `useEquipmentForm` Hook
**Location**: `hooks/forms/useEquipmentForm.ts`
**Responsibilities**:
- Form schema generation and validation
- Equipment data fetching logic
- Form state initialization
- Integration with existing `useEquipment` hook

#### D. Enhanced `useStarForceForm` Hook
**Location**: `hooks/forms/useStarForceForm.ts` (extend existing `useEquipmentManagement`)
**Current State**: Similar logic exists in `useEquipmentManagement` 
**Responsibilities**:
- StarForce validation logic
- Auto-adjustment calculations
- Level-based constraints
- Integration with existing StarForce hooks

### 2. Component Decomposition

#### A. Main Form Container
**Component**: `EquipmentForm.tsx` (refactored)
**Responsibilities**:
- Dialog wrapper and state management
- Form submission coordination
- Component orchestration only

#### B. Equipment Selection Section
**Component**: `EquipmentSelectionSection.tsx`
**Props**:
```typescript
interface EquipmentSelectionSectionProps {
  form: UseFormReturn<EquipmentFormData>;
  availableEquipment: Equipment[];
  loading: boolean;
  onEquipmentChange: (equipment: Equipment | null) => void;
  allowSlotEdit?: boolean;
  defaultSlot?: EquipmentSlot;
}
```

#### C. Potential Management Section
**Component**: `PotentialSelectionSection.tsx`
**Props**:
```typescript
interface PotentialSelectionSectionProps {
  equipmentType: EquipmentType;
  currentValue: string;
  targetValue: string;
  onCurrentChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  disabled?: boolean;
}
```

#### D. StarForce Management Section
**Component**: `StarForceSection.tsx`
**Props**:
```typescript
interface StarForceSectionProps {
  form: UseFormReturn<EquipmentFormData>;
  equipment?: Equipment;
  canTransfer: boolean;
  onTransferClick: () => void;
}
```

#### D. Transfer Integration Section
**Component**: `TransferSection.tsx`
**Props**:
```typescript
interface TransferSectionProps {
  sourceEquipment: Equipment;
  availableTargets: Equipment[];
  canTransfer: boolean;
  transferEligibility: { canTransfer: boolean; reason?: string };
  onTransferClick: () => void;
  disabled?: boolean;
}
```

**Key Integration Points**:
- Use existing `useEquipment.canTransfer` for validation
- Use existing `useEquipment.transferStarForce` for execution
- Remove duplicate transfer logic from EquipmentForm
- Consistent transfer behavior across application

#### E. Future Flame Score Section
**Component**: `FlameScoreSection.tsx` (placeholder for future)
**Props**:
```typescript
interface FlameScoreSectionProps {
  currentFlame?: FlameScore;
  targetFlame?: FlameScore;
  onCurrentChange: (flame: FlameScore) => void;
  onTargetChange: (flame: FlameScore) => void;
}
```

### 3. UX Design Strategy - Accordion Implementation

#### Visual Design
```
┌─────────────────────────────────────────┐
│ Equipment Form                          │
├─────────────────────────────────────────┤
│ Equipment Selection                     │
│ ├ Slot: [Dropdown ▼]                   │
│ └ Item: [Dropdown ▼]                   │
├─────────────────────────────────────────┤
│ ▼ Potential Enhancement                 │
│ ├ Current: [Categorized Select ▼]      │
│ └ Target:  [Categorized Select ▼]      │
├─────────────────────────────────────────┤
│ ▼ StarForce Enhancement                 │
│ ├ Enable: [Toggle]                     │
│ ├ Current: [Slider ═══●═══]           │
│ ├ Target:  [Slider ═══●═══]           │
├─────────────────────────────────────────┤
│ ▼ Transfer Operations                   │
│ ├ Available: [Target Dropdown ▼]       │
│ └ Execute: [Transfer Button]            │
├─────────────────────────────────────────┤
│ ▽ Flame Score (Future)                  │
├─────────────────────────────────────────┤
│ [Cancel] [Save]                         │
└─────────────────────────────────────────┘
```

#### Accordion Behavior
- **Equipment Selection**: Always expanded, cannot collapse (required)
- **Potential Enhancement**: Collapsible, auto-expand when equipment supports potential
- **StarForce Enhancement**: Collapsible, auto-expand when starforceable equipment selected
- **Transfer Operations**: Collapsible, auto-expand when transfer candidates available
- **Flame Score**: Collapsible, initially collapsed (future feature)

#### Component Structure
**Component**: `EquipmentFormAccordion.tsx`
```typescript
interface AccordionSection {
  id: string;
  title: string;
  required?: boolean;
  autoExpand?: boolean;
  component: React.ComponentType<any>;
  props: Record<string, any>;
}
```

### 4. Implementation Phases

#### Phase 1: Hook Integration & Cleanup (Week 1)
1. ✅ Move encoding/decoding functions to `usePotential`
2. ✅ **Replace duplicate transfer logic with existing `useEquipment` hook**
3. ✅ Create `useEquipmentForm` hook leveraging existing infrastructure
4. ✅ Remove ~100 lines of duplicate transfer code from EquipmentForm
5. ✅ Test that functionality remains identical

**Key Deletions**:
- Remove custom `canTransfer` function (use `useEquipment.canTransfer`)
- Remove custom `handleTransfer` function (use `useEquipment.transferStarForce`)
- Remove transfer state management (use existing workflow)
- Remove manual slot conflict resolution (handled by `useEquipment`)

#### Phase 2: Component Decomposition (Week 2)
1. ✅ Extract `EquipmentSelectionSection` component
2. ✅ Extract `PotentialSelectionSection` component  
3. ✅ Extract `StarForceSection` component
4. ✅ Extract `TransferSection` component using existing transfer hooks
5. ✅ Update main `EquipmentForm` to compose sections
6. ✅ Test that functionality remains identical

#### Phase 3: Accordion Implementation (Week 3)
1. ✅ Create `EquipmentFormAccordion` wrapper component
2. ✅ Implement accordion behavior with shadcn/ui
3. ✅ Add section auto-expand logic including transfer section
4. ✅ Update styling for accordion layout
5. ✅ Test UX improvements

#### Phase 4: Flame Score Foundation (Week 4)
1. ✅ Create placeholder `FlameScoreSection` component
2. ✅ Add flame types to data structures
3. ✅ Create `useFlameScore` hook (similar to `usePotential`)
4. ✅ Integrate into accordion (collapsed by default)

## File Structure After Refactoring

```
src/
├── components/
│   ├── EquipmentForm.tsx (main container, ~100 lines - major reduction)
│   └── EquipmentForm/
│       ├── EquipmentFormAccordion.tsx
│       ├── EquipmentSelectionSection.tsx
│       ├── PotentialSelectionSection.tsx
│       ├── StarForceSection.tsx
│       ├── TransferSection.tsx (using existing useEquipment)
│       ├── FlameScoreSection.tsx (future)
│       └── index.ts
├── hooks/
│   ├── forms/
│   │   ├── useEquipmentForm.ts (leverages existing hooks)
│   │   └── index.ts
│   ├── data/
│   │   └── useEquipment.ts ✅ (already comprehensive - keep as-is)
│   ├── starforce/
│   │   └── *.ts ✅ (existing StarForce hooks - integrate)
│   └── game/
│       ├── usePotential.ts (enhanced with encoding/decoding)
│       ├── useFlameScore.ts (future)
│       └── index.ts
└── types/
    ├── index.ts (enhanced with flame types)
    └── forms.ts (form-specific types)
```

## Major Code Reduction Opportunities

### 1. Transfer Logic Elimination (~100 lines)
**Current Duplicate Code in EquipmentForm**:
- `canTransfer` function (30 lines) - **DELETE** (use `useEquipment.canTransfer`)
- `handleTransfer` function (40 lines) - **DELETE** (use `useEquipment.transferStarForce`)  
- Transfer state management (20 lines) - **DELETE** (use existing workflow)
- Manual slot resolution (10 lines) - **DELETE** (handled by `useEquipment`)

### 2. Hook Leveraging Benefits
**Existing Infrastructure to Use**:
- `useEquipment`: Comprehensive CRUD + transfer operations
- `useEquipmentManagement`: StarForce adjustments and cost management  
- `useStarForceCalculation`: Cost calculation logic
- `usePotential`: Template and formatting logic

**New Minimal Hooks Needed**:
- `useEquipmentForm`: Form orchestration only (~50 lines)
- Enhanced `usePotential`: Add encoding/decoding (~30 lines)

## Benefits of This Approach

### 1. Maintainability
- Each component has single responsibility
- Business logic extracted to testable hooks
- Clear separation of concerns

### 2. Reusability  
- Hooks can be used in other forms
- Sections can be used independently
- Consistent patterns across the app

### 3. Testability
- Hooks can be unit tested in isolation
- Components can be tested with mock hooks
- Validation logic is centralized

### 4. User Experience
- Accordion reduces cognitive load
- Auto-expand provides smart defaults
- Progressive disclosure of complexity

### 5. Future-Proof
- Easy to add new enhancement types
- Consistent patterns for expansion
- Modular architecture supports growth

## Migration Strategy

### 1. Backward Compatibility
- Maintain existing prop interface during transition
- Use feature flags for accordion rollout
- Gradual migration of dependent components

### 2. Testing Strategy
- Comprehensive tests for extracted hooks
- Visual regression tests for UI changes
- Integration tests for form submission

### 3. Performance Considerations
- Lazy load accordion sections
- Memoize expensive calculations in hooks
- Optimize re-renders with proper dependencies

## Decision Points to Confirm

1. **Should we move encoding/decoding to `usePotential` first?** ✅ Yes, this creates a clean foundation
2. **Accordion vs Tabs for main sections?** ✅ Accordion allows multiple sections open simultaneously
3. **Auto-expand behavior preferences?** Smart defaults based on equipment capabilities
4. **Flame score data structure?** Similar to potential with tier/value system
5. **Form validation approach?** Centralized in hooks with section-specific validation

## Next Steps

1. **Phase 1A Priority**: **Remove duplicate transfer logic first** - biggest immediate win
   - Replace EquipmentForm transfer logic with `useEquipment` hook
   - Remove ~100 lines of duplicate code
   - Ensure consistent transfer behavior across app

2. **Phase 1B**: Move encoding/decoding to `usePotential` hook
   - Clean foundation for component decomposition
   - Centralized potential logic

3. **User Approval**: Confirm overall direction and updated priorities
4. **Component Planning**: Detailed prop interfaces for each section  
5. **Testing Plan**: Comprehensive test coverage for business logic
6. **UI Design**: Finalize accordion styling and behavior specs

## Immediate Action Item

**Should we start with Phase 1A (removing duplicate transfer logic) since this provides the biggest immediate code reduction and uses existing, tested infrastructure?**

This would:
- ✅ Remove ~100 lines of duplicate code immediately
- ✅ Use the robust, tested `useEquipment` transfer logic  
- ✅ Ensure consistent transfer behavior across the application
- ✅ Reduce maintenance burden
- ✅ Create a cleaner foundation for the component decomposition

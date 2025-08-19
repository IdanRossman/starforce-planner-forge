# StarForceCalculator Refactoring Plan

## Current Issues & Scalability Problems

### 1. **Component Size & Complexity**
- **Current**: 1653 lines in a single component
- **Problem**: Unmaintainable, hard to test, difficult to debug
- **Impact**: Developer productivity bottleneck, high bug risk

### 2. **Mixed Responsibilities**
- **Current**: UI rendering, business logic, data management, export functionality all mixed
- **Problem**: Violates Single Responsibility Principle
- **Impact**: Changes ripple across unrelated functionality

### 3. **Dual Mode Anti-Pattern**
- **Current**: One component handling both `standalone` and `equipment-table` modes
- **Problem**: Conditional logic throughout, different state needs
- **Impact**: Complex testing, hard to optimize per mode

### 4. **State Management Chaos**
- **Current**: 15+ useState hooks managing different concerns
- **Problem**: State scattered, no clear ownership, hard to debug
- **Impact**: State synchronization bugs, performance issues

### 5. **Excessive Dependencies**
- **Current**: 35+ imports from various sources
- **Problem**: High coupling, unclear dependency graph
- **Impact**: Bundle size, circular dependency risk

## Recommended Refactoring Strategy

### Phase 1: Component Decomposition

#### 1.1 Create Mode-Specific Components
```
StarForceCalculator/
├── index.tsx                           # Mode router (25 lines)
├── StarForceCalculatorStandalone.tsx   # Standalone mode (200 lines)
├── StarForceCalculatorTable.tsx        # Equipment table mode (300 lines)
├── components/
│   ├── standalone/
│   │   ├── StandaloneForm.tsx          # Form inputs (150 lines)
│   │   ├── StandaloneResults.tsx       # Results display (200 lines)
│   │   └── StandaloneExport.tsx        # Export functionality (100 lines)
│   ├── table/
│   │   ├── EquipmentTableSettings.tsx  # Settings panel (100 lines)
│   │   ├── EquipmentTableSummary.tsx   # Stats overview (150 lines)
│   │   ├── EquipmentTableHeader.tsx    # Table header (100 lines)
│   │   ├── EquipmentTableContent.tsx   # Table body (300 lines)
│   │   ├── EquipmentTableRow.tsx       # Individual row (200 lines)
│   │   └── EquipmentTableExport.tsx    # Export functionality (100 lines)
│   └── shared/
│       ├── StarDisplay.tsx             # Star level display (50 lines)
│       ├── CostDisplay.tsx             # Cost formatting (50 lines)
│       └── LuckIndicator.tsx           # Luck percentage display (75 lines)
├── hooks/
│   ├── useStandaloneCalculator.ts      # Standalone-specific logic (150 lines)
│   ├── useTableCalculator.ts           # Table-specific logic (200 lines)
│   ├── useEquipmentTableState.ts       # Table state management (150 lines)
│   └── useExportData.ts                # Export functionality (100 lines)
├── utils/
│   ├── calculations.ts                 # Pure calculation functions (200 lines)
│   ├── exportHelpers.ts                # Export utilities (150 lines)
│   └── validations.ts                  # Input validation (100 lines)
└── types/
    ├── standalone.ts                   # Standalone-specific types
    ├── table.ts                        # Table-specific types
    └── shared.ts                       # Shared types
```

#### 1.2 Extract Business Logic
```typescript
// utils/calculations.ts
export interface StandaloneSettings {
  itemLevel: number;
  currentLevel: number;
  targetLevel: number;
  server: string;
  itemType: string;
  safeguard: boolean;
  starCatching: boolean;
  eventType: string;
  costDiscount: number;
  yohiTapEvent: boolean;
}

export async function performStandaloneCalculation(
  settings: StandaloneSettings
): Promise<StarForceCalculation> {
  // Pure function - no side effects
  // Easy to test and reason about
}

export function applyYohiLuck(
  calculation: StarForceCalculation
): StarForceCalculation {
  // Pure function for special event logic
}
```

#### 1.3 Create Specialized Hooks
```typescript
// hooks/useStandaloneCalculator.ts
export function useStandaloneCalculator() {
  const [calculation, setCalculation] = useState<StarForceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (settings: StandaloneSettings) => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await performStandaloneCalculation(settings);
      setCalculation(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    calculation,
    isCalculating,
    error,
    calculate,
    clearCalculation: () => setCalculation(null)
  };
}
```

### Phase 2: State Management Optimization

#### 2.1 Centralized Table State
```typescript
// hooks/useEquipmentTableState.ts
interface EquipmentTableState {
  editingStarforce: string | null;
  editingActualCost: string | null;
  tempValues: { current: number; target: number };
  tempActualCost: number;
  hoveredRow: string | null;
  tempSparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  itemIncluded: Record<string, boolean>;
}

export function useEquipmentTableState(characterId?: string) {
  const [state, setState] = useState<EquipmentTableState>(initialState);
  
  // Provide specific actions instead of exposing setState
  const actions = {
    startEditStarforce: (equipmentId: string, current: number, target: number) => {
      setState(prev => ({
        ...prev,
        editingStarforce: equipmentId,
        tempValues: { current, target }
      }));
    },
    // ... other specific actions
  };

  return { state, actions };
}
```

#### 2.2 Form State Management
```typescript
// hooks/useStandaloneForm.ts
export function useStandaloneForm(onSubmit: (settings: StandaloneSettings) => void) {
  const [settings, setSettings] = useState<StandaloneSettings>(defaultSettings);
  const [errors, setErrors] = useState<Partial<Record<keyof StandaloneSettings, string>>>({});

  const updateSetting = useCallback(<K extends keyof StandaloneSettings>(
    key: K,
    value: StandaloneSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateStandaloneSettings(settings);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(settings);
  }, [settings, onSubmit]);

  return {
    settings,
    errors,
    updateSetting,
    handleSubmit
  };
}
```

### Phase 3: Performance Optimization

#### 3.1 Memoization Strategy
```typescript
// components/table/EquipmentTableRow.tsx
export const EquipmentTableRow = React.memo(({ 
  equipment, 
  calculation, 
  isEditing,
  onEdit,
  onSave 
}: EquipmentTableRowProps) => {
  // Heavy computations memoized at the row level
  const displayValues = useMemo(() => ({
    formattedCost: formatMesos.display(calculation.averageCost),
    luckColor: getLuckColor.text(calculation.luckPercentage),
    dangerLevel: getDangerLevel(equipment.currentStarForce)
  }), [calculation, equipment.currentStarForce]);

  return (
    <TableRow>
      {/* Row content using memoized values */}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.equipment.id === nextProps.equipment.id &&
    prevProps.calculation.averageCost === nextProps.calculation.averageCost &&
    prevProps.isEditing === nextProps.isEditing
  );
});
```

#### 3.2 Virtual Scrolling for Large Tables
```typescript
// components/table/VirtualizedEquipmentTable.tsx
import { FixedSizeList as List } from 'react-window';

export function VirtualizedEquipmentTable({ 
  equipmentCalculations 
}: VirtualizedEquipmentTableProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <EquipmentTableRow equipment={equipmentCalculations[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={equipmentCalculations.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Phase 4: Type Safety Improvements

#### 4.1 Discriminated Unions for Mode-Specific Props
```typescript
// types/shared.ts
interface BaseStarForceCalculatorProps {
  characterId?: string;
  characterName?: string;
}

interface StandaloneProps extends BaseStarForceCalculatorProps {
  mode: 'standalone';
  initialCalculation?: StarForceCalculation;
  equipment?: never;
  additionalEquipment?: never;
  onUpdateStarforce?: never;
  onUpdateActualCost?: never;
  onUpdateSafeguard?: never;
}

interface TableProps extends BaseStarForceCalculatorProps {
  mode: 'equipment-table';
  equipment?: Equipment[];
  additionalEquipment?: Equipment[];
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onUpdateSafeguard?: (equipmentId: string, safeguard: boolean) => void;
  initialCalculation?: never;
}

export type StarForceCalculatorProps = StandaloneProps | TableProps;
```

#### 4.2 Strict Event Handlers
```typescript
// types/table.ts
export interface EquipmentTableHandlers {
  onStartEdit: (equipmentId: string) => void;
  onSaveEdit: (equipmentId: string, values: { current: number; target: number }) => void;
  onCancelEdit: () => void;
  onUpdateSparePrice: (equipmentId: string, price: { value: number; unit: 'M' | 'B' }) => void;
  onToggleIncluded: (equipmentId: string) => void;
  onToggleSafeguard: (equipmentId: string) => void;
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Create directory structure
- [ ] Extract types and interfaces
- [ ] Create mode router component
- [ ] Set up basic standalone component

### Week 2: Standalone Mode
- [ ] Extract standalone form logic
- [ ] Create standalone results component
- [ ] Implement standalone-specific hooks
- [ ] Add standalone export functionality

### Week 3: Table Mode Foundation
- [ ] Create table state management hook
- [ ] Extract table settings component
- [ ] Create table summary component
- [ ] Implement basic table structure

### Week 4: Table Mode Features
- [ ] Implement table row components
- [ ] Add editing functionality
- [ ] Implement sorting and filtering
- [ ] Add table export functionality

### Week 5: Performance & Polish
- [ ] Add memoization optimizations
- [ ] Implement virtual scrolling
- [ ] Add comprehensive error handling
- [ ] Write unit tests

### Week 6: Migration & Cleanup
- [ ] Update all imports across codebase
- [ ] Remove old component file
- [ ] Update documentation
- [ ] Performance testing

## Benefits of This Refactoring

### 1. **Maintainability**
- Each component has a single, clear responsibility
- Easy to locate and fix bugs
- Simplified testing strategy

### 2. **Performance**
- Smaller bundle sizes through code splitting
- Optimized re-renders with proper memoization
- Virtual scrolling for large data sets

### 3. **Developer Experience**
- Clear separation of concerns
- Type-safe prop interfaces
- Reusable components and hooks

### 4. **Scalability**
- Easy to add new features to specific modes
- Horizontal scaling through composition
- Clear extension points for future requirements

### 5. **Testing**
- Unit tests for pure calculation functions
- Isolated component testing
- Hook testing with React Testing Library

## Migration Strategy

### 1. **Backward Compatibility**
Keep the original component as a wrapper during transition:
```typescript
// StarForceCalculator.legacy.tsx
export function StarForceCalculatorLegacy(props: any) {
  // Original implementation
}

// StarForceCalculator.tsx (during migration)
export function StarForceCalculator(props: StarForceCalculatorProps) {
  if (process.env.USE_LEGACY_CALCULATOR) {
    return <StarForceCalculatorLegacy {...props} />;
  }
  return <StarForceCalculatorRefactored {...props} />;
}
```

### 2. **Feature Flags**
Use feature flags to gradually roll out components:
```typescript
const useNewStandaloneCalculator = useFeatureFlag('new-standalone-calculator');
const useNewTableCalculator = useFeatureFlag('new-table-calculator');
```

### 3. **A/B Testing**
Compare performance and user experience between old and new implementations.

This refactoring will transform your 1653-line monolith into a maintainable, scalable, and performant component architecture that will serve your project well as it grows.

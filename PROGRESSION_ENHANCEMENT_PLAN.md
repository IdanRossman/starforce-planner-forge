# StarForce Planne#### Phase 1A: Data Structure Extension
- [x] Extend `Equipment` interface to include potential fields
  - `currentPotential`: Array of potential lines
  - `targetPotential`: Array of desired potential lines (based on potential tier)
  - `potentialTier`: Current potential tier (Rare/Epic/Unique/Legendary)
  - `targetPotentialTier`: Target potential tier
- [x] Create `PotentialLine` interface (dynamic values fetched from server based on equipment type and level)
  - `id`: Unique identifier
  - `value`: Numeric value (flat selection: 13% Stat, 23% Stat, 33% Stat, etc.)
- [x] Create `PotentialCalculation` interface for cube cost estimation (similar to StarForce, fetched from backend)
- [x] Consolidated `PotentialTier` with existing `EquipmentTier` to avoid duplicationssion Enhancement Plan

## Project Overview
Evolving the StarForce Planner from a StarForce-focused tool into a comprehensive MapleStory character progression planner. The goal is to create an all-in-one tool for planning and tracking character progression including StarForce, Potential, and gear valuation.

## Current State
- ✅ StarForce planning and calculation
- ✅ Character management with MapleRanks integration
- ✅ Equipment management with visual grid
- ✅ Transfer planning
- ✅ Import/Export functionality
- ✅ Smart planner for optimization

## Enhancement Objectives

### 1. Potential System Implementation
**Goal**: Add comprehensive potential tracking and planning capabilities

#### Phase 1A: Data Structure Extension
- [ ] Extend `Equipment` interface to include potential fields
  - `currentPotential`: Array of potential lines
  - `targetPotential`: Array of desired potential lines (based on potential tier value)
  - `potentialTier`: Current potential tier (Rare/Epic/Unique/Legendary)
  - `targetPotentialTier`: Target potential tier
- [ ] Create `PotentialLine` interface (dynamic values fetched from server based on equipment type and level)
  - `id`: Unique identifier
  - `value`: Numeric value (flat selection: 13% Stat, 23% Stat, 33% Stat, etc.)
- [ ] Create `PotentialCalculation` interface for cube cost estimation (similar to StarForce, fetched from backend)

#### Phase 1B: Potential Management UI
- [x] Add potential display to equipment table (Target Potential column with smart summary)
- [ ] Create PotentialEditor component
  - Visual representation of current vs target potential
  - Line-by-line editing capabilities
  - Tier upgrade planning
- [ ] Add potential tab to EnhancedEquipmentManager  
- [ ] Add potential filtering options

#### Phase 1C: Potential Calculation Engine
- [ ] Create potential cube cost calculator
- [ ] Implement probability calculations for desired lines
- [ ] Add tier upgrade cost estimation
- [ ] Create potential optimization suggestions

### 2. Gear Valuation System
**Goal**: Calculate and display current and projected gear worth

#### Phase 2A: Valuation Engine
- [ ] Create gear valuation service
- [ ] Implement stat-to-value conversion algorithms
- [ ] Add market price integration (if available)
- [ ] Create comparative analysis tools

#### Phase 2B: Worth Display Components
- [ ] Add "Current Worth" display to character dashboard
- [ ] Create "Target Worth" projections
- [ ] Implement investment vs value gain analysis
- [ ] Add gear comparison tools

#### Phase 2C: Investment Planning
- [ ] Calculate total mesos needed for all planned upgrades
- [ ] Create investment priority recommendations
- [ ] Add ROI analysis for different upgrade paths
- [ ] Implement budget planning tools

### 3. Enhanced Analytics & Tracking
**Goal**: Provide comprehensive progression insights

#### Phase 3A: Progress Tracking
- [ ] Add progression timeline
- [ ] Implement milestone tracking
- [ ] Create achievement system for completed goals
- [ ] Add historical data visualization

#### Phase 3B: Advanced Analytics
- [ ] Character comparison tools
- [ ] Progression speed analysis
- [ ] Cost efficiency metrics
- [ ] Market trend integration

### 4. UI/UX Enhancements
**Goal**: Improve user experience for the expanded functionality

#### Phase 4A: Dashboard Redesign
- [ ] Add comprehensive character overview
- [ ] Create tabbed progression views
- [ ] Implement quick action shortcuts
- [ ] Add customizable dashboard widgets

#### Phase 4B: Advanced Filtering & Sorting
- [ ] Multi-criteria equipment filtering
- [ ] Advanced search capabilities
- [ ] Custom view presets
- [ ] Bulk operations support

## Implementation Priority

### Immediate (Next 1-2 weeks)
1. **Data Structure Extension**: Update Equipment interface and types
2. **Basic Potential UI**: Add potential columns to equipment table
3. **Planning Document**: Complete project structure analysis

### Short Term (2-4 weeks)
1. **Potential Editor Component**: Full potential management interface
2. **Basic Valuation Engine**: Simple gear worth calculations
3. **Enhanced Equipment Manager**: Integrate potential functionality

### Medium Term (1-2 months)
1. **Advanced Calculations**: Complex potential probability and cost estimation
2. **Investment Planning**: ROI analysis and budget tools
3. **Analytics Dashboard**: Progression tracking and insights

### Long Term (2+ months)
1. **Market Integration**: Real-time pricing and trends
2. **AI Recommendations**: Smart upgrade path suggestions
3. **Community Features**: Sharing and collaboration tools

## Technical Considerations

### Performance
- Implement lazy loading for complex calculations
- Use memoization for expensive computations
- Consider Web Workers for heavy analytical tasks

### Data Management
- Extend current localStorage strategy
- Implement data migration for new fields
- Consider cloud sync for future scalability

### Compatibility
- Maintain backward compatibility with existing data
- Ensure mobile responsiveness
- Support for different MapleStory regions

## Success Metrics
- [ ] User engagement: Time spent in app
- [ ] Feature adoption: Usage of new potential and valuation features
- [ ] Data quality: Accuracy of calculations and predictions
- [ ] User feedback: Satisfaction scores and feature requests

## Risk Mitigation
- **Complexity Management**: Phased implementation approach
- **Data Loss**: Robust backup and migration strategies
- **Performance**: Regular performance monitoring and optimization
- **User Adoption**: Clear documentation and onboarding

---

## Project Structure Analysis

### Pages (`src/pages/`)
```
CharacterDashboard.tsx    - Main character management and equipment overview
Homepage.tsx              - Landing page and navigation
NotFound.tsx             - 404 error page
QuickPlanning.tsx        - Quick StarForce planning tool
```

### Core Components (`src/components/`)
```
AnnouncementBanner.tsx    - App-wide notifications
AppNavbar.tsx            - Main navigation component
CharacterCard.tsx        - Individual character display card
CharacterForm.tsx        - Character creation/editing form
CharacterWizard.tsx      - Guided character creation
EnhancedEquipmentManager.tsx - Main equipment management interface
EquipmentForm.tsx        - Equipment creation/editing form
EquipmentGrid.tsx        - Visual equipment slot grid
EquipmentImage.tsx       - Equipment image display with fallbacks
GameAssistant.tsx        - AI assistant interface
QuickStarForceTable.tsx  - Quick reference StarForce table
StarForceCalculator.tsx  - StarForce cost calculation interface
StarForceOptimizer.tsx   - Advanced StarForce planning
StarForceTransferDialog.tsx - StarForce transfer planning
```

### Specialized Components

#### StarForceCalculator Module (`src/components/StarForceCalculator/`)
```
index.tsx                 - Main calculator export
StarForceCalculatorTable.tsx - Calculation results table
EquipmentTableContent.tsx - Equipment-specific table content
EquipmentTableHeader.tsx  - Table header with sorting
EquipmentTableRow.tsx     - Individual equipment row
components/               - Sub-components
hooks/                    - Calculator-specific hooks
types/                    - Calculator type definitions
utils/                    - Calculator utilities
```

#### Shared Components (`src/components/shared/`)
```
ApiStatusBadge.tsx       - API connection status indicator
MapleButton.tsx          - Themed button component
MapleDialog.tsx          - Themed dialog component
forms/                   - Reusable form components
```

#### UI Components (`src/components/ui/`)
```
Complete shadcn/ui component library including:
- accordion, alert-dialog, alert, button, card, etc.
- All styled with Tailwind and customized for MapleStory theme
```

### Hooks (`src/hooks/`)
```
index.ts                 - Main hooks export
use-mobile.tsx           - Mobile device detection
use-toast.ts             - Toast notification system
useCharacterContext.ts   - Character context hook

Organized by category:
core/                    - Core application hooks
data/                    - Data fetching and management
display/                 - UI and display hooks
game/                    - Game-specific logic hooks
starforce/               - StarForce calculation hooks
ui/                      - UI interaction hooks
utils/                   - Utility hooks
```

### Services (`src/services/`)
```
api.ts                   - General API utilities
equipmentService.ts      - Equipment data management
mapleRanksService.ts     - MapleRanks API integration
starforceService.ts      - StarForce calculation engine
templateService.ts       - Equipment template management
```

### Data Layer (`src/data/`)
```
assistantCharacters.ts   - Game assistant character data
equipmentDatabase.ts     - Equipment information database
equipmentSets.ts         - Equipment set bonuses
equipmentTemplates.ts    - Pre-configured equipment templates
mockData.ts             - Development mock data
```

### Types (`src/types/`)
```
index.ts                 - Main type definitions
assistant.ts             - Game assistant types

Key interfaces:
- Character: Main character data structure
- Equipment: Equipment item with StarForce data
- EquipmentSlot: All possible equipment slots
- StarForceCalculation: Calculation result data
```

### Context (`src/contexts/`)
```
CharacterContext.tsx     - Global character state management
```

### Utilities (`src/lib/`)
```
analytics.ts             - User behavior tracking
jobIcons.tsx            - MapleStory job icon components
utils.ts                - General utility functions
```

### Configuration
```
components.json          - shadcn/ui configuration
tailwind.config.ts       - Tailwind CSS customization
tsconfig.json           - TypeScript configuration
vite.config.ts          - Vite build configuration
```

## Architecture Patterns

### State Management
- **React Context**: Global character state
- **Local State**: Component-specific UI state
- **LocalStorage**: Data persistence
- **Custom Hooks**: Business logic encapsulation

### Component Architecture
- **Container/Presentation**: Clear separation of logic and UI
- **Compound Components**: Complex components with sub-components
- **Render Props**: Flexible component composition
- **Custom Hooks**: Reusable stateful logic

### Data Flow
```
Services → Hooks → Context → Components → UI
```

### Styling Strategy
- **Tailwind CSS**: Utility-first styling
- **Custom Theme**: MapleStory-inspired design system
- **Component Variants**: Consistent component styling
- **Responsive Design**: Mobile-first approach

This structure provides a solid foundation for implementing the progression enhancement features while maintaining code organization and scalability.

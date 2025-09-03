export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  equipment: Equipment[];
  starForceItems?: Equipment[]; // Character-specific StarForce calculator items
  image?: string; // Character image from MapleRanks
  createdAt?: string; // When the character was created
  updatedAt?: string; // When the character was last updated
}

export interface Equipment {
  id: string;
  name?: string; // Equipment name (e.g., "Aquatic Letter Eye Accessory")
  slot: EquipmentSlot;
  type: EquipmentType;
  level: number;
  set?: string; // Set name (e.g., "Boss Accessory")
  currentStarForce: number;
  targetStarForce: number;
  tier?: EquipmentTier | null;
  starforceable: boolean;
  image?: string; // Path to equipment image
  actualCost?: number; // Actual cost paid by user for tracking luck
  transferredFrom?: string; // ID of equipment that was transferred from (for transfer targets)
  transferredTo?: string; // ID of equipment that was transferred to (for transfer sources)
  transferredStars?: number; // Number of stars transferred to this equipment (minimum current stars)
  isTransferSource?: boolean; // Flag indicating this equipment will be destroyed after transfer
  transferTargetId?: string; // ID of the target equipment for transfer source
  safeguard?: boolean; // Whether safeguard is enabled for this equipment
  itemType?: string; // Specific equipment type from database (weapon, secondary, gloves, etc.)
  base_attack?: number; // Base attack for weapons to calculate 2% visible ATT gains
  includeInCalculations?: boolean; // Whether to include this equipment in StarForce calculator and Smart Planner (defaults to true)
  // Potential System
  currentPotential?: PotentialLine[]; // Array of current potential lines
  targetPotential?: PotentialLine[]; // Array of desired potential lines (based on potential tier)
  potentialTier?: EquipmentTier; // Current potential tier
  targetPotentialTier?: EquipmentTier; // Target potential tier
}

export interface EquipmentWithCharacter extends Equipment {
  characterName: string;
}

// Potential System Types
export interface PotentialLine {
  id: string; // Unique identifier for the potential line
  value: string; // The potential line value (e.g., "13% STR", "23% ATT", etc.) - fetched from server
}

export interface PotentialCalculation {
  equipmentId: string;
  currentTier: EquipmentTier;
  targetTier: EquipmentTier;
  currentPotential: PotentialLine[];
  targetPotential: PotentialLine[];
  averageCost: number;
  medianCost: number;
  p75Cost: number;
  averageCubes: number;
  medianCubes: number;
  p75Cubes: number;
  successRate: number;
  costPerCube: number;
  recommendations: string[];
}

export type EquipmentSlot = 
  | 'weapon'
  | 'secondary'
  | 'emblem'
  | 'hat'
  | 'top'
  | 'bottom'
  | 'overall'
  | 'shoes'
  | 'gloves'
  | 'cape'
  | 'belt'
  | 'shoulder'
  | 'face'
  | 'eye'
  | 'earring'
  | 'ring1'
  | 'ring2'
  | 'ring3'
  | 'ring4'
  | 'pendant1'
  | 'pendant2'
  | 'pocket'
  | 'heart'
  | 'badge'
  | 'medal';

export type EquipmentType = 
  | 'armor'
  | 'weapon'
  | 'accessory';

export type EquipmentTier = 
  | 'rare'
  | 'epic'
  | 'unique'
  | 'legendary';

export interface Events {
  costMultiplier?: number;
  successRateBonus?: number;
  starCatching?: boolean;
  safeguard?: boolean;
  eventType?: "5/10/15" | "Shining Star" | "30% Off" | "No Boom";
}

export interface StarForceCalculation {
  currentLevel: number;
  targetLevel: number;
  averageCost: number;
  medianCost: number;
  p75Cost: number;
  averageBooms: number;
  medianBooms: number;
  p75Booms: number;
  successRate: number;
  boomRate: number;
  costPerAttempt: number;
  perStarStats: { star: number; successRate: number; boomRate: number; cost: number }[];
  recommendations: string[];
}

// Assistant Types
export interface AssistantTip {
  id: string;
  message: string;
  type: 'general' | 'warning' | 'success' | 'info';
  context?: string[];
  duration?: number; // How long to show the tip in milliseconds
}

export interface AssistantCharacter {
  name: string;
  image: string;
  tips: AssistantTip[];
}

export interface GameAssistantProps {
  character?: AssistantCharacter;
  pageContext?: string;
  currentLevel?: number;
  currentSlot?: string;
  isStarforceable?: boolean;
  onClose?: () => void;
  debugMode?: boolean; // Controls whether tip persists for debugging
}

// StarForce Optimization Types
export interface StarforceOptimizationRequestDto {
  items: Array<{
    itemLevel: number;
    fromStar: number;
    toStar: number;
    safeguardEnabled?: boolean;
    spareCount?: number;
    spareCost?: number;
    itemName?: string;
    itemType?: string; // e.g., 'weapon', 'secondary', 'gloves', 'helm', 'top', 'bottom', etc.
    base_attack?: number; // Required for weapons to calculate 2% visible ATT gains
  }>;
  availableMeso: number;
  isInteractive?: boolean;
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: boolean;
  };
}

export interface StarforceOptimizationResponseDto {
  budget: {
    available: number;
    used: number;
    remaining: number;
  };
  starsGained: {
    total: number;
    byItem: Array<{
      itemName: string;
      originalTarget: number;
      starsGained: number;
      finalStar: number;
      stepsCompleted: number;
      totalCost: number;
    }>;
  };
  actionPlan: Array<{
    step: number;
    action: string;
    fromStar: number;
    toStar: number;
    expectedCost: number;
    expectedBooms: number;
    riskLevel: string;
    efficiency: number;
    cumulativeCost: number;
    remainingBudget: number;
    specialNote?: string;
    statGains: {
      jobStat: number;
      visibleAtt: number;
      attack: number;
      magicAtt: number;
      weaponAtt: number;
      hp: number;
      mp: number;
      def: number;
      totalValue: number;
    };
  }>;
  achievableTargets: Array<{
    itemIndex: number;
    itemName: string;
    originalTarget: number;
    achievableTarget: number;
    starsGained: number;
    starsShortfall: number;
  }>;
  originalTargets: Array<{
    itemName: string;
    fromStar: number;
    requestedTarget: number;
    achievableTarget: number;
    starsShortfall: number;
  }>;
  analysis: {
    starsMetrics: {
      requested: number;
      achievable: number;
      shortfall: number;
      completionRate: number;
    };
    budgetMetrics: {
      efficiency: number;
      utilizationRate: number;
      costPerStar: number;
    };
    itemsStatus: {
      fullyAchievable: number;
      partiallyAchievable: number;
      notAchievable: number;
    };
    riskAssessment: {
      highRiskSteps: number;
      mediumRiskSteps: number;
      overallRisk: string;
    };
    eventBenefits?: {
      guaranteedSuccesses: number;
      mesoSaved: number;
      riskReduced: string;
    };
  };
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
}
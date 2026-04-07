export interface StorageItem {
  id: string;           // backend UUID (used for PUT/DELETE)
  catalogId: string;    // equipment catalog ID
  name?: string;
  set?: string;
  image?: string;
  level: number;
  starforceable: boolean;
  currentStarForce: number;
  targetStarForce: number;
  currentPotential?: string;
  targetPotential?: string;
  itemType?: string;
  type: EquipmentType;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  equipment: Equipment[];
  storageItems?: StorageItem[];
  starForceItems?: Equipment[];
  image?: string;
  enableCallingCard?: boolean;
  callingCardHash?: string | null;
  cardGenerationDate?: string | null;
  cardGenerationCount?: number;
  animatedCardVideoHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipment {
  id: string;
  catalogId?: string; // Original catalog item ID, used to sync with backend
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
  // Simple string representations for display/form
  currentPotentialValue?: string; // String representation of current potential
  targetPotentialValue?: string; // String representation of target potential
  cubeType?: 'red' | 'black'; // Preferred cube type for this equipment
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
  | 'medal'
  | 'android';

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


// Starforce Session Types
export interface StarforceSession {
  id: string;
  characterId: string;
  name?: string;
  createdAt: string;
  startingMeso?: number;
  endingMeso?: number;
  logs: StarforceSessionLog[];
}

export interface StarforceSessionLog {
  id: string;
  sessionId: string;
  equipmentId: number;
  equipmentName?: string;
  startStar: number;
  targetStar: number;
  endStar: number;
  totalMesoCost: number;
  totalBooms: number;
  starCatching: boolean;
  safeguard: boolean;
  thirtyPctMesoReduction: boolean;
  thirtyPctBoomReduction: boolean;
  mvpDiscount: number;
  createdAt: string;
  boomDetails?: StarforceBoomDetail[];
}

export interface StarforceBoomDetail {
  id: string;
  sessionLogId: string;
  boomedFromStar: number;
}

export interface LuckAnalysis {
  logId: string;
  equipmentId: number;
  equipmentName: string;
  startStar: number;
  targetStar: number;
  endStar: number;
  actual: { mesoCost: number; booms: number };
  simulated: {
    average: { mesoCost: number; booms: number };
    median: { mesoCost: number; booms: number };
    percentile75: { mesoCost: number; booms: number };
  };
}

export interface SessionQueueItem {
  equipmentId: number;
  name: string;
  image?: string;
  level: number;
  startStar: number;
  targetStar: number;
  starCatching: boolean;
  safeguard: boolean;
  thirtyPctMesoReduction: boolean;
  thirtyPctBoomReduction: boolean;
  mvpDiscount: number;
}

export interface SessionItemState extends SessionQueueItem {
  currentStar: number;
  completed: boolean;
}

export interface ActiveSessionData {
  sessionId: string | null; // null until first log is submitted
  characterId: string;
  sessionName?: string;
  startingMeso: number;
  currentMesoBalance: number;
  activeItemEquipmentId: number | null;
  items: SessionItemState[];
  logs: StarforceSessionLog[];
}

// ── Community types ───────────────────────────────────────────────────────────

export interface CommunityGlobalStats {
  totalLogs: number;
  totalMesoTracked: number;
  totalBooms: number;
  overallSuccessRate?: number;
  simulatorDriftPercent?: number | null;
}

export interface EquipmentSummary {
  equipmentId: number;
  equipmentName: string;
  image?: string;
  totalLogs: number;
  topTargets: { targetStar: number; count: number; successRate: number; averageBooms: number }[];
  topBoomStars: { star: number; count: number; rate: number }[];
}


export interface CommunityTrendingItem {
  equipmentId: number;
  equipmentName: string;
  image?: string;
  sampleSize: number;
  medianMesoCost: number;
  successRate: number;
  mostCommonRange: { startStar: number; targetStar: number };
}

export interface CommunityFeedEntry {
  equipmentName: string;
  image?: string;
  startStar: number;
  endStar: number;
  totalMesoCost: number;
  totalBooms: number;
  success: boolean;
  loggedAt: string;
}

export interface EquipmentSearchResult {
  equipmentId: number;
  equipmentName: string;
  image?: string;
}

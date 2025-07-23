export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  equipment: Equipment[];
  starForceItems?: Equipment[]; // Character-specific StarForce calculator items
  image?: string; // Character image from MapleRanks
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
}

export interface EquipmentWithCharacter extends Equipment {
  characterName: string;
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
  averageBooms: number;
  successRate: number;
  boomRate: number;
  costPerAttempt: number;
  perStarStats: { star: number; successRate: number; boomRate: number; cost: number }[];
  recommendations: string[];
}
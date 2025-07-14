export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  server: string;
  equipment: Equipment[];
}

export interface Equipment {
  id: string;
  slot: EquipmentSlot;
  type: EquipmentType;
  level: number;
  set?: string;
  currentStarForce: number;
  targetStarForce: number;
  tier?: EquipmentTier | null;
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

export interface StarForceCalculation {
  currentLevel: number;
  targetLevel: number;
  averageCost: number;
  averageBooms: number;
  successRate: number;
  boomRate: number;
  costPerAttempt: number;
}
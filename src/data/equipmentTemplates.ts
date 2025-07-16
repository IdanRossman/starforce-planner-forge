import { Equipment, EquipmentSlot } from "@/types";
import { getMaxStarForce } from "@/lib/utils";

export interface EquipmentTemplate {
  id: string;
  name: string;
  description: string;
  level: number;
  equipment: Equipment[];
}

// Helper function to create equipment with proper IDs and star limits
const createEquipment = (
  slot: EquipmentSlot,
  level: number,
  set: string,
  tier: 'rare' | 'epic' | 'unique' | 'legendary',
  currentStars: number = 0,
  targetStars?: number,
  image?: string
): Equipment => {
  const maxStars = getMaxStarForce(level);
  const finalTargetStars = targetStars !== undefined 
    ? Math.min(maxStars, targetStars) 
    : Math.min(maxStars, Math.max(currentStars, Math.floor(maxStars * 0.8))); // Default to 80% of max
  
  return {
    id: `template-${slot}-${Date.now()}-${Math.random()}`,
    slot,
    type: ['weapon', 'secondary'].includes(slot) ? 'weapon' : 
          ['hat', 'top', 'bottom', 'overall', 'shoes', 'gloves', 'cape', 'belt', 'shoulder'].includes(slot) ? 'armor' : 'accessory',
    level,
    set,
    tier,
    currentStarForce: currentStars,
    targetStarForce: finalTargetStars,
    starforceable: !['pocket', 'emblem', 'badge'].includes(slot),
    image
  };
};

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  {
    id: 'early-game',
    name: 'Newbie',
    description: 'Root Abyss, basic boss accessories and penslair filler',
    level: 200,
    equipment: [
      // CRA Set
      createEquipment('hat', 150, 'Fafnir', 'epic', 10, 17, 'https://maplestory.io/api/GMS/255/item/1003799/icon'),
      createEquipment('top', 150, 'Fafnir', 'epic', 10, 17, 'https://maplestory.io/api/GMS/255/item/1042256/icon'),
      createEquipment('bottom', 150, 'Fafnir', 'epic', 10, 17, 'https://maplestory.io/api/GMS/255/item/1062255/icon'),
      createEquipment('weapon', 150, 'Fafnir', 'unique', 10, 17, 'https://maplestory.io/api/GMS/255/item/1522094/icon'),
      
      // Pensalir
      createEquipment('gloves', 140, 'Pensalir', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1082610/icon'),
      createEquipment('shoes', 140, 'Pensalir', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1072969/icon'),
      createEquipment('cape', 140, 'Pensalir', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1102720/icon'),
      createEquipment('belt', 140, 'Pink Bean', 'epic', 10, 17, 'https://maplestory.io/api/GMS/255/item/1132272/icon'),
      createEquipment('shoulder', 120, 'Royal Black Metal Shoulder', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1152170/icon'),
      
      // Accessories
      createEquipment('face', 50, 'Condensed Power Crystal', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1012478/icon'),
      createEquipment('eye', 100, 'Aquatic Letter Eye Accessory', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1022231/icon'),
      createEquipment('earring', 130, 'Dea Sidus Earring', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1032241/icon'),
      
      // Jewelry
      createEquipment('ring1', 120, 'Noble Ifia Ring', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1113282/icon'),
      createEquipment('ring2', 110, 'Silver Blossom Ring', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1113149/icon'),
      createEquipment('ring3', 125, 'Treasure Hunter John Ring', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1113236/icon'),
      createEquipment('pendant1', 120, 'Mechanator Pendant', 'epic', 10, undefined, 'https://maplestory.io/api/GMS/255/item/1122254/icon'),
      createEquipment('pendant2', 120, 'Fake Dominator Pendant', 'epic', 15, undefined, 'https://maplestory.io/api/GMS/255/item/1122372/icon'),
      
      // Special
      createEquipment('secondary', 100, 'Generic Secondary', 'legendary', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1352003/icon'),
      createEquipment('emblem', 100, 'Luminous Emblem', 'legendary', 0),
      createEquipment('badge', 30, 'Genesis Badge', 'legendary', 0),
      createEquipment('heart', 100, 'Magnificent Magnus Heart', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1672047/icon'),
    ]
  },
  
  {
    id: 'midgame-160',
    name: 'Level 160 Mid-Game Set',
    description: 'Pensalir + Boss accessories progression',
    level: 160,
    equipment: [
      // Pensalir Set
      createEquipment('hat', 140, 'Pensalir Miser Hood', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1003169/icon'),
      createEquipment('top', 140, 'Pensalir Battle Mail', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1042025/icon'),
      createEquipment('bottom', 140, 'Pensalir Battle Pants', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1062007/icon'),
      createEquipment('gloves', 140, 'Pensalir Miser Gloves', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1082268/icon'),
      createEquipment('shoes', 140, 'Pensalir Miser Boots', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1072393/icon'),
      createEquipment('weapon', 140, 'Pensalir Bow', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1452102/icon'),
      
      // Boss Accessories
      createEquipment('cape', 120, 'Pink Bean Holy Cup', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1102226/icon'),
      createEquipment('belt', 120, 'Pink Bean Holy Cup', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1132112/icon'),
      createEquipment('shoulder', 140, 'Royal Black Metal Shoulder', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1152087/icon'),
      
      // Basic Accessories
      createEquipment('face', 100, 'Zakum Face Accessory', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1012058/icon'),
      createEquipment('eye', 100, 'Zakum Eye Accessory', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1022082/icon'),
      createEquipment('earring', 100, 'Zakum Earring', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1032061/icon'),
      
      // Jewelry
      createEquipment('ring1', 120, 'Cracked Gollux Ring', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112807/icon'),
      createEquipment('ring2', 50, 'Horntail Ring', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112985/icon'),
      createEquipment('ring3', 30, 'Zakum Ring', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112413/icon'),
      createEquipment('ring4', 35, 'Magnus Ring', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1113074/icon'),
      createEquipment('pendant1', 120, 'Cracked Gollux Pendant', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1122019/icon'),
      createEquipment('pendant2', 50, 'Horntail Pendant', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1122000/icon'),
      
      // Special
      createEquipment('secondary', 100, 'Deimos Warrior Shield', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1352003/icon'),
      createEquipment('emblem', 100, 'Adventurer Emblem', 'epic', 0),
      createEquipment('badge', 30, 'Crystal Ventus Badge', 'rare', 0),
      createEquipment('heart', 100, 'Titanium Heart', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1672000/icon'),
    ]
  },
  
  {
    id: 'training-140',
    name: 'Level 140 Training Set',
    description: 'Necro/Empress equipment for training',
    level: 140,
    equipment: [
      // Necro/Empress Set
      createEquipment('hat', 140, 'Empress Warrior Helm', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1003172/icon'),
      createEquipment('overall', 140, 'Empress Warrior Suit', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1051098/icon'),
      createEquipment('gloves', 140, 'Empress Warrior Glove', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1082271/icon'),
      createEquipment('shoes', 140, 'Empress Warrior Boots', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1072396/icon'),
      createEquipment('weapon', 140, 'Empress Bow', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1452101/icon'),
      
      // Basic Accessories
      createEquipment('cape', 100, 'Maple Cape', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1102041/icon'),
      createEquipment('belt', 100, 'Gold Maple Belt', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1132000/icon'),
      createEquipment('shoulder', 100, 'Royal Shoulder', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1152000/icon'),
      
      // Accessories
      createEquipment('face', 90, 'Maple Leaf', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1012057/icon'),
      createEquipment('eye', 90, 'Maple Eye Accessory', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1022081/icon'),
      createEquipment('earring', 90, 'Maple Earrings', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1032060/icon'),
      
      // Basic Jewelry
      createEquipment('ring1', 30, 'Basic Ring', 'rare', 0),
      createEquipment('ring2', 30, 'Basic Ring', 'rare', 0),
      createEquipment('ring3', 30, 'Basic Ring', 'rare', 0),
      createEquipment('ring4', 30, 'Basic Ring', 'rare', 0),
      createEquipment('pendant1', 30, 'Basic Pendant', 'rare', 0),
      createEquipment('pendant2', 30, 'Basic Pendant', 'rare', 0),
      
      // Special
      createEquipment('secondary', 100, 'Basic Shield', 'rare', 0),
      createEquipment('emblem', 100, 'Basic Emblem', 'rare', 0),
      createEquipment('badge', 30, 'Basic Badge', 'rare', 0),
    ]
  },
  
  {
    id: 'reboot-progression',
    name: 'Reboot Progression Set',
    description: 'Typical Reboot server progression path',
    level: 180,
    equipment: [
      // Mixed progression set
      createEquipment('hat', 150, 'Royal Warrior Helm (3L)', 'legendary', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1003797/icon'),
      createEquipment('top', 150, 'Royal Warrior Mail (3L)', 'legendary', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1042180/icon'),
      createEquipment('bottom', 150, 'Royal Warrior Pants (3L)', 'legendary', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1062154/icon'),
      createEquipment('weapon', 150, 'Fafnir Weapon (3L)', 'legendary', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1212061/icon'),
      
      // Von Leon/Pensalir mix
      createEquipment('gloves', 130, 'Von Leon Warrior Gloves', 'unique', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1082241/icon'),
      createEquipment('shoes', 130, 'Von Leon Warrior Boots', 'unique', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1072369/icon'),
      createEquipment('cape', 110, 'Von Leon Warrior Cape', 'unique', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1102172/icon'),
      createEquipment('belt', 130, 'Hayato Belt', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1132149/icon'),
      createEquipment('shoulder', 130, 'Von Leon Warrior Shoulder', 'unique', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1152045/icon'),
      
      // Boss Accessories (Epic tier for Reboot)
      createEquipment('face', 130, 'Sweetwater Face Accessory', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1012438/icon'),
      createEquipment('eye', 130, 'Sweetwater Eye Accessory', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1022231/icon'),
      createEquipment('earring', 130, 'Sweetwater Earring', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1032241/icon'),
      
      // Gollux Set (Reboot accessible)
      createEquipment('ring1', 140, 'Superior Gollux Ring', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1113149/icon'),
      createEquipment('ring2', 120, 'Reinforced Gollux Ring', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112926/icon'),
      createEquipment('ring3', 120, 'Solid Gollux Ring', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112924/icon'),
      createEquipment('ring4', 120, 'Cracked Gollux Ring', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1112807/icon'),
      createEquipment('pendant1', 140, 'Superior Gollux Pendant', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1122268/icon'),
      createEquipment('pendant2', 120, 'Reinforced Gollux Pendant', 'epic', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1122267/icon'),
      
      // Special
      createEquipment('secondary', 140, 'Deimos Sage Shield', 'unique', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1352100/icon'),
      createEquipment('emblem', 100, 'Luminous Emblem', 'unique', 0),
      createEquipment('badge', 30, 'Genesis Badge', 'unique', 0),
      createEquipment('heart', 100, 'Magnificent Magnus Heart', 'rare', 0, undefined, 'https://maplestory.io/api/GMS/255/item/1672047/icon'),
    ]
  },
  
  {
    id: 'custom-empty',
    name: 'Custom/Empty Set',
    description: 'Start with an empty template and add your own equipment',
    level: 200,
    equipment: []
  }
];

export const getTemplateById = (id: string): EquipmentTemplate | undefined => {
  return EQUIPMENT_TEMPLATES.find(template => template.id === id);
};

export const getDefaultTemplate = (): EquipmentTemplate => {
  return EQUIPMENT_TEMPLATES[0]; // Level 200 Endgame Set
};

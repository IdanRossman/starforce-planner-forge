import { Equipment, EquipmentSlot } from "@/types";
import { getMaxStarForce } from "@/lib/utils";
import { findEquipmentByName, EquipmentData } from "./equipmentDatabase";

export interface EquipmentTemplate {
  id: string;
  name: string;
  description: string;
  level: number;
  equipment: Equipment[];
}

// Simplified helper function - just provide slot and name, everything else comes from database
const createFromDB = (
  slot: EquipmentSlot,
  equipmentName: string,
  tier: "rare" | "epic" | "unique" | "legendary" = "epic",
  currentStars: number = 0,
  targetStars?: number
): Equipment => {
  const equipmentData = findEquipmentByName(slot, equipmentName);

  if (!equipmentData) {
    throw new Error(
      `Equipment "${equipmentName}" not found for slot "${slot}"`
    );
  }

  const maxStars = getMaxStarForce(equipmentData.level);
  const finalTargetStars =
    targetStars !== undefined ? Math.min(maxStars, targetStars) : currentStars;

  return {
    id: `template-${slot}-${Date.now()}-${Math.random()}`,
    slot,
    type: ["weapon", "secondary"].includes(slot)
      ? "weapon"
      : [
          "hat",
          "top",
          "bottom",
          "overall",
          "shoes",
          "gloves",
          "cape",
          "belt",
          "shoulder",
        ].includes(slot)
      ? "armor"
      : "accessory",
    level: equipmentData.level,
    set: equipmentData.name,
    tier,
    currentStarForce: currentStars,
    targetStarForce: finalTargetStars,
    starforceable: ![
      "pocket",
      "emblem",
      "badge",
      "medal",
      "secondary",
    ].includes(slot),
    image: equipmentData.image,
  };
};

// Helper function to create equipment from database with proper IDs and star limits
const createEquipmentFromDatabase = (
  slot: EquipmentSlot,
  equipmentName: string,
  tier: "rare" | "epic" | "unique" | "legendary",
  currentStars: number = 0,
  targetStars?: number
): Equipment => {
  const equipmentData = findEquipmentByName(slot, equipmentName);

  if (!equipmentData) {
    throw new Error(
      `Equipment "${equipmentName}" not found for slot "${slot}"`
    );
  }

  const maxStars = getMaxStarForce(equipmentData.level);
  const finalTargetStars =
    targetStars !== undefined ? Math.min(maxStars, targetStars) : currentStars;

  return {
    id: `template-${slot}-${Date.now()}-${Math.random()}`,
    slot,
    type: ["weapon", "secondary"].includes(slot)
      ? "weapon"
      : [
          "hat",
          "top",
          "bottom",
          "overall",
          "shoes",
          "gloves",
          "cape",
          "belt",
          "shoulder",
        ].includes(slot)
      ? "armor"
      : "accessory",
    level: equipmentData.level,
    set: equipmentData.name,
    tier,
    currentStarForce: currentStars,
    targetStarForce: finalTargetStars,
    starforceable: ![
      "pocket",
      "emblem",
      "badge",
      "medal",
      "secondary",
    ].includes(slot),
    image: equipmentData.image,
  };
};

// Legacy helper function for backward compatibility (now uses database)
const createEquipment = (
  slot: EquipmentSlot,
  level: number,
  set: string,
  tier: "rare" | "epic" | "unique" | "legendary",
  currentStars: number = 0,
  targetStars?: number,
  image?: string
): Equipment => {
  const maxStars = getMaxStarForce(level);
  const finalTargetStars =
    targetStars !== undefined ? Math.min(maxStars, targetStars) : currentStars;

  return {
    id: `template-${slot}-${Date.now()}-${Math.random()}`,
    slot,
    type: ["weapon", "secondary"].includes(slot)
      ? "weapon"
      : [
          "hat",
          "top",
          "bottom",
          "overall",
          "shoes",
          "gloves",
          "cape",
          "belt",
          "shoulder",
        ].includes(slot)
      ? "armor"
      : "accessory",
    level,
    set,
    tier,
    currentStarForce: currentStars,
    targetStarForce: finalTargetStars,
    starforceable: !["pocket", "emblem", "badge", "medal"].includes(slot),
    image,
  };
};

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  {
    id: "custom-empty",
    name: "Custom/Empty Set",
    description: "Start with an empty template and add your own equipment",
    level: 200,
    equipment: [],
  },
  {
    id: "early-game",
    name: "Newbie",
    description: "Root Abyss, basic boss accessories and penslair filler",
    level: 210,
    equipment: [
      // CRA Set
      createFromDB("hat", "Fafnir", "epic", 10, 17),
      createFromDB("top", "Fafnir", "epic", 10, 17),
      createFromDB("bottom", "Fafnir", "epic", 10, 17),
      createFromDB("weapon", "Fafnir", "epic", 10, 17),

      // Pensalir
      createFromDB("gloves", "Pensalir", "epic", 10, undefined),
      createFromDB("shoes", "Pensalir", "epic", 10, undefined),
      createFromDB("cape", "Pensalir", "epic", 10, undefined),
      createFromDB("belt", "Pink Bean", "epic", 10, 17),
      createFromDB(
        "shoulder",
        "Royal Black Metal Shoulder",
        "epic",
        10,
        undefined
      ),

      // Accessories
      createFromDB("face", "Condensed Power Crystal", "epic", 0, undefined),
      createFromDB(
        "eye",
        "Aquatic Letter Eye Accessory",
        "epic",
        10,
        undefined
      ),
      createFromDB("earring", "Dea Sidus Earring", "epic", 10, undefined),

      // Jewelry
      createFromDB("ring1", "Noble Ifia Ring", "epic", 10, undefined),
      createFromDB("ring2", "Silver Blossom Ring", "epic", 10, undefined),
      createFromDB("ring3", "Treasure Hunter John Ring", "epic", 10, undefined),
      createFromDB("pendant1", "Mechanator Pendant", "epic", 10, undefined),
      createFromDB("pendant2", "Dominator Pendant", "epic", 10, 17),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Gold Maple Leaf Emblem", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Lidium Heart", "epic", 0, undefined),
      createFromDB("pocket", "Stone of Eternal Life", "epic", 0, undefined),
    ],
  },

  {
    id: "early-mid-game-absolab",
    name: "Early Game",
    description: "Root Abyss, Absolab and more advanced boss accessories",
    level: 220,
    equipment: [
      createFromDB("hat", "Fafnir", "epic", 17, 19),
      createFromDB("top", "Fafnir", "epic", 17, 19),
      createFromDB("bottom", "Fafnir", "epic", 17, 19),
      createFromDB("weapon", "Absolab", "epic", 10, 17),

      createFromDB("gloves", "Absolab", "epic", 10, 17),
      createFromDB("shoes", "Absolab", "epic", 10, 17),
      createFromDB("cape", "Absolab", "epic", 10, 17),
      createFromDB("belt", "Reinforced Gollux", "epic", 10, 17),
      createFromDB("shoulder", "Absolab", "epic", 10, 17),

      createFromDB("face", "Condensed Power Crystal", "epic", 5, undefined),
      createFromDB("eye", "Black Bean Mark", "epic", 17, 20),
      createFromDB("earring", "Reinforced Gollux", "epic", 10, 17),

      // Jewelry
      createFromDB("ring1", "Meister Ring", "epic", 10, 17),
      createFromDB("ring2", "Kanna's Treasure", "epic", 10, 17),
      createFromDB("ring3", "Treasure Hunter John Ring", "epic", 12, undefined),
      createFromDB("ring4", "Silver Blossom Ring", "epic", 10, undefined),
      createFromDB("pendant1", "Mechanator Pendant", "epic", 15, undefined),
      createFromDB("pendant2", "Dominator Pendant", "epic", 10, 17),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Gold Maple Leaf Emblem", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Lidium Heart", "epic", 0, undefined),
      createFromDB("pocket", "Pink Holy Cup", "epic", 0, undefined),
    ],
  },

  {
    id: "early-mid-game",
    name: "Early-Mid Game",
    description: "Root Abyss, Arcane Umbra and Gollux accessories",
    level: 220,
    equipment: [
      createFromDB("hat", "Fafnir", "epic", 19, 21),
      createFromDB("top", "Fafnir", "epic", 19, 21),
      createFromDB("bottom", "Fafnir", "epic", 19, 21),
      createFromDB("weapon", "Arcane Umbra", "epic", 10, 17),

      createFromDB("gloves", "Arcane Umbra", "epic", 10, 17),
      createFromDB("shoes", "Arcane Umbra", "epic", 10, 17),
      createFromDB("cape", "Arcane Umbra", "epic", 10, 17),
      createFromDB("belt", "Reinforced Gollux", "epic", 17, 21),
      createFromDB("shoulder", "Arcane Umbra", "epic", 10, 17),

      createFromDB("face", "Sweetwater Tattoo", "epic", 10, 18),
      createFromDB("eye", "Sweetwater Monocle", "epic", 10, 18),
      createFromDB("earring", "Reinforced Gollux", "epic", 17, 21),

      // Jewelry
      createFromDB("ring1", "Meister Ring", "epic", 17, 19),
      createFromDB("ring2", "Kanna's Treasure", "epic", 17, 19),
      createFromDB("ring3", "Guardian Angel Ring", "epic", 10, 17),
      createFromDB("ring4", "Oz Ring", "epic", 0, undefined),
      createFromDB("pendant1", "Sweetwater Pendant", "epic", 10, 18),
      createFromDB("pendant2", "Dominator Pendant", "epic", 17, 19),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Gold Maple Leaf Emblem", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Lidium Heart", "epic", 0, undefined),
      createFromDB("pocket", "Pink Holy Cup", "epic", 0, undefined),
    ],
  },

  {
    id: "mid-game-abso",
    name: "Mid Game (Absolab)",
    description: "Root Abyss, Absolab, full gollux set",
    level: 220,
    equipment: [
      createFromDB("hat", "Fafnir", "epic", 19, 21),
      createFromDB("top", "Fafnir", "epic", 19, 21),
      createFromDB("bottom", "Fafnir", "epic", 19, 21),
      createFromDB("weapon", "Absolab", "epic", 17, 21),

      createFromDB("gloves", "Absolab", "epic", 17, 21),
      createFromDB("shoes", "Absolab", "epic", 17, 21),
      createFromDB("cape", "Absolab", "epic", 17, 21),
      createFromDB("belt", "Superior Gollux", "epic", 20, 21),
      createFromDB("shoulder", "Absolab", "epic", 17, 21),

      createFromDB("face", "Twilight Mark", "epic", 19, 21),
      createFromDB("eye", "Sweetwater Monocle", "epic", 18, 21),
      createFromDB("earring", "Superior Gollux", "epic", 20, 21),

      // Jewelry
      createFromDB("ring1", "Meister Ring", "epic", 21, undefined),
      createFromDB("ring2", "Guardian Angel Ring", "epic", 17, 21),
      createFromDB("ring3", "Superior Gollux", "epic", 20, 21),
      createFromDB("ring4", "Oz Ring", "epic", undefined, undefined),
      createFromDB("pendant1", "Superior Gollux", "epic", 20, 21),
      createFromDB("pendant2", "Dominator Pendant", "epic", 21, undefined),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Gold Maple Leaf Emblem", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Fairy Heart", "epic", 0, undefined),
      createFromDB("pocket", "Pink Holy Cup", "epic", 8, undefined),
    ],
  },

  {
    id: "mid-game-arcane",
    name: "Mid Game (Arcane)",
    description: "Root Abyss, Arcane, full gollux set",
    level: 220,
    equipment: [
      createFromDB("hat", "Fafnir", "epic", 19, 21),
      createFromDB("top", "Fafnir", "epic", 19, 21),
      createFromDB("bottom", "Fafnir", "epic", 19, 21),
      createFromDB("weapon", "Arcane Umbra", "epic", 17, 19),

      createFromDB("gloves", "Arcane Umbra", "epic", 17, 19),
      createFromDB("shoes", "Arcane Umbra", "epic", 17, 19),
      createFromDB("cape", "Arcane Umbra", "epic", 17, 19),
      createFromDB("belt", "Superior Gollux", "epic", 20, 21),
      createFromDB("shoulder", "Arcane Umbra", "epic", 17, 19),

      createFromDB("face", "Twilight Mark", "epic", 19, 21),
      createFromDB("eye", "Sweetwater Monocle", "epic", 18, 21),
      createFromDB("earring", "Superior Gollux", "epic", 20, 21),

      // Jewelry
      createFromDB("ring1", "Meister Ring", "epic", 21, undefined),
      createFromDB("ring2", "Guardian Angel Ring", "epic", 17, 21),
      createFromDB("ring3", "Superior Gollux", "epic", 20, 21),
      createFromDB("ring4", "Oz Ring", "epic", undefined, undefined),
      createFromDB("pendant1", "Superior Gollux", "epic", 20, 21),
      createFromDB("pendant2", "Dominator Pendant", "epic", 21, undefined),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Gold Maple Leaf Emblem", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Fairy Heart", "epic", 0, undefined),
      createFromDB("pocket", "Pink Holy Cup", "epic", 8, undefined),
    ],
  },

  {
    id: "mid-late-game",
    name: "Mid-Late Game",
    description:
      "Liberated, pushing arcanes and maybe some pitched accessories",
    level: 220,
    equipment: [
      createFromDB("hat", "Fafnir", "epic", 21, 22),
      createFromDB("top", "Fafnir", "epic", 21, 22),
      createFromDB("bottom", "Fafnir", "epic", 21, 22),
      createFromDB("weapon", "Genesis", "epic", 22, undefined),

      createFromDB("gloves", "Arcane Umbra", "epic", 19, 21),
      createFromDB("shoes", "Arcane Umbra", "epic", 19, 21),
      createFromDB("cape", "Arcane Umbra", "epic", 19, 21),
      createFromDB("belt", "Superior Gollux", "epic", 22, undefined),
      createFromDB("shoulder", "Arcane Umbra", "epic", 19, 21),

      createFromDB("face", "Twilight Mark", "epic", 21, 22),
      createFromDB("eye", "Sweetwater Monocle", "epic", 21, 22),
      createFromDB("earring", "Superior Gollux", "epic", 22, undefined),

      // Jewelry
      createFromDB("ring1", "Meister Ring", "epic", 22, undefined),
      createFromDB("ring2", "Guardian Angel Ring", "epic", 21, 22),
      createFromDB("ring3", "Superior Gollux", "epic", 21, 22),
      createFromDB("ring4", "Oz Ring", "epic", undefined, undefined),
      createFromDB("pendant1", "Superior Gollux", "epic", 21, 22),
      createFromDB("pendant2", "Dominator Pendant", "epic", 22, undefined),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Mitras Rage", "legendary", 0),
      createFromDB("badge", "Crystal Ventus Badge", "legendary", 0),
      createFromDB("heart", "Black Heart", "epic", 15, undefined),
      createFromDB("pocket", "Cursed Magical Book", "epic", 0, undefined),
    ],
  },

  {
    id: "late-game",
    name: "Late Game",
    description: "Eternals, and in the pitched waiting room",
    level: 220,
    equipment: [
      createFromDB("hat", "Eternal", "epic", 18, 22),
      createFromDB("top", "Eternal", "epic", 18, 22),
      createFromDB("bottom", "Eternal", "epic", 18, 22),
      createFromDB("weapon", "Genesis", "epic", 22, undefined),

      createFromDB("gloves", "Arcane Umbra", "epic", 21, 22),
      createFromDB("shoes", "Arcane Umbra", "epic", 21, 22),
      createFromDB("cape", "Arcane Umbra", "epic", 21, 22),
      createFromDB("belt", "Dreamy Belt", "epic", 22, undefined),
      createFromDB("shoulder", "Eternal", "epic", 18, 22),

      createFromDB("face", "Berserked", "epic", 17, 22),
      createFromDB("eye", "Magic Eyepatch", "epic", 17, 22),
      createFromDB("earring", "Commanding Force Earring", "epic", 17, 22),

      // Jewelry
      createFromDB("ring1", "Endless Terror", "epic", 17, 22),
      createFromDB("ring2", "Guardian Angel Ring", "epic", 22, undefined),
      createFromDB("ring3", "Superior Gollux", "epic", 22, undefined),
      createFromDB("ring4", "Oz Ring", "epic", undefined, undefined),
      createFromDB("pendant1", "Source of Suffering", "epic", 17, 22),
      createFromDB("pendant2", "Daybreak Pendant", "epic", 22, undefined),

      // Special
      createFromDB("secondary", "Generic Secondary", "legendary", 0, undefined),
      createFromDB("emblem", "Mitras Rage", "legendary", 0),
      createFromDB("badge", "Genesis Badge", "legendary", 0),
      createFromDB("heart", "Black Heart", "epic", 15, undefined),
      createFromDB("pocket", "Cursed Magical Book", "epic", 0, undefined),
    ],
  },
];

export const getTemplateById = (id: string): EquipmentTemplate | undefined => {
  return EQUIPMENT_TEMPLATES.find((template) => template.id === id);
};

export const getDefaultTemplate = (): EquipmentTemplate => {
  return EQUIPMENT_TEMPLATES[0]; // Level 200 Endgame Set
};

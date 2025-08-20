import { Equipment, PotentialLine, EquipmentTier } from "@/types";
import { useState, useEffect } from "react";

// Common potential line patterns for abbreviation
const POTENTIAL_PATTERNS = [
  // Stat patterns
  { regex: /(\d+)%\s*(STR|DEX|INT|LUK)/gi, format: (match: string, value: string, stat: string) => `+${value}% ${stat}` },
  // Attack patterns  
  { regex: /(\d+)%\s*(ATT|MATT|Attack|Magic\s*Attack)/gi, format: (match: string, value: string) => `+${value}% ATT` },
  // Boss Damage
  { regex: /(\d+)%\s*(Boss|BD)/gi, format: (match: string, value: string) => `+${value}% BD` },
  // Drop/Meso
  { regex: /(\d+)%\s*(Drop|Meso)/gi, format: (match: string, value: string, type: string) => `+${value}% ${type}` },
  // IED (Ignore Enemy Defense)
  { regex: /(\d+)%\s*(IED|Ignore\s*Enemy\s*Defense)/gi, format: (match: string, value: string) => `+${value}% IED` },
  // Critical
  { regex: /(\d+)%\s*(Crit|Critical)/gi, format: (match: string, value: string) => `+${value}% Crit` },
  // All Stats
  { regex: /(\d+)%\s*(All\s*Stats?)/gi, format: (match: string, value: string) => `+${value}% All Stats` },
  // Damage
  { regex: /(\d+)%\s*(Damage)/gi, format: (match: string, value: string) => `+${value}% DMG` },
];

// Common potential line templates based on tier and equipment type
const POTENTIAL_TEMPLATES = {
  weapon: {
    rare: [
      "9% STR", "9% DEX", "9% INT", "9% LUK",
      "6% All Stats", "3% ATT"
    ],
    epic: [
      "12% STR", "12% DEX", "12% INT", "12% LUK",
      "9% All Stats", "6% ATT", "30% Boss Damage"
    ],
    unique: [
      "15% STR", "15% DEX", "15% INT", "15% LUK", 
      "12% All Stats", "9% ATT", "35% Boss Damage", "30% IED"
    ],
    legendary: [
      "21% STR", "21% DEX", "21% INT", "21% LUK",
      "15% All Stats", "12% ATT", "40% Boss Damage", "35% IED"
    ]
  },
  armor: {
    rare: [
      "9% STR", "9% DEX", "9% INT", "9% LUK",
      "6% All Stats"
    ],
    epic: [
      "12% STR", "12% DEX", "12% INT", "12% LUK",
      "9% All Stats"
    ],
    unique: [
      "15% STR", "15% DEX", "15% INT", "15% LUK",
      "12% All Stats"
    ],
    legendary: [
      "21% STR", "21% DEX", "21% INT", "21% LUK",
      "15% All Stats"
    ]
  },
  accessory: {
    rare: [
      "9% STR", "9% DEX", "9% INT", "9% LUK",
      "6% All Stats", "20% Drop Rate", "20% Meso"
    ],
    epic: [
      "12% STR", "12% DEX", "12% INT", "12% LUK",
      "9% All Stats", "30% Drop Rate", "30% Meso"
    ],
    unique: [
      "15% STR", "15% DEX", "15% INT", "15% LUK",
      "12% All Stats", "40% Drop Rate", "40% Meso"
    ],
    legendary: [
      "21% STR", "21% DEX", "21% INT", "21% LUK",
      "15% All Stats", "50% Drop Rate", "50% Meso"
    ]
  }
};

interface UsePotentialOptions {
  maxLines?: number; // Maximum lines to show in summary
  enableTemplates?: boolean; // Whether to provide potential line templates
}

export function usePotential(options: UsePotentialOptions = {}) {
  const { maxLines = 2, enableTemplates = true } = options;

  // State for potential line templates
  const [availableLines, setAvailableLines] = useState<string[]>([]);

  /**
   * Formats a potential line value into an abbreviated form
   */
  const formatPotentialLine = (value: string): string => {
    for (const pattern of POTENTIAL_PATTERNS) {
      const match = value.match(pattern.regex);
      if (match) {
        return pattern.format(match[0], match[1], match[2] || '');
      }
    }
    // If no pattern matches, truncate long lines
    return value.length > 20 ? value.substring(0, 20) + "..." : value;
  };

  /**
   * Creates a summary of target potential lines for display
   */
  const getPotentialSummary = (targetPotential?: PotentialLine[]): string => {
    if (!targetPotential || targetPotential.length === 0) {
      return "No target set";
    }

    const lines = targetPotential.map(line => line.value);
    const summarized = lines.map(formatPotentialLine);

    // Join with commas, but limit to maxLines to prevent overflow
    if (summarized.length > maxLines) {
      return summarized.slice(0, maxLines).join(", ") + ` +${summarized.length - maxLines} more`;
    }
    
    return summarized.join(", ");
  };

  /**
   * Gets available potential lines based on equipment type and tier
   */
  const getPotentialTemplates = (equipmentType: string, tier: EquipmentTier): string[] => {
    if (!enableTemplates) return [];
    
    const normalizedType = equipmentType.toLowerCase();
    const templates = POTENTIAL_TEMPLATES[normalizedType as keyof typeof POTENTIAL_TEMPLATES];
    
    if (!templates) return [];
    
    return templates[tier] || [];
  };

  /**
   * Updates available potential lines when equipment type/tier changes
   */
  const updateAvailableLines = (equipmentType: string, tier: EquipmentTier | null) => {
    if (!tier) {
      setAvailableLines([]);
      return;
    }
    
    const lines = getPotentialTemplates(equipmentType, tier);
    setAvailableLines(lines);
  };

  /**
   * Creates a PotentialLine object from a string value
   */
  const createPotentialLine = (value: string): PotentialLine => ({
    id: crypto.randomUUID(),
    value: value
  });

  /**
   * Validates potential lines for a given tier
   */
  const validatePotentialLines = (lines: PotentialLine[], tier: EquipmentTier): boolean => {
    // Basic validation - legendary can have 3 lines, others can have 2-3
    const maxLinesForTier = tier === 'legendary' ? 3 : tier === 'unique' ? 3 : tier === 'epic' ? 2 : 1;
    return lines.length <= maxLinesForTier;
  };

  /**
   * Gets the maximum number of potential lines for a tier
   */
  const getMaxLinesForTier = (tier: EquipmentTier): number => {
    switch (tier) {
      case 'legendary': return 3;
      case 'unique': return 3;
      case 'epic': return 2;
      case 'rare': return 1;
      default: return 0;
    }
  };

  /**
   * Determines if an equipment can have potential based on type/slot
   */
  const canHavePotential = (equipmentType: string, slot?: string): boolean => {
    // Most equipment can have potential, except some special items
    const noPotentialSlots = ['badge', 'medal', 'pocket'];
    return slot ? !noPotentialSlots.includes(slot.toLowerCase()) : true;
  };

  return {
    // Core functions
    formatPotentialLine,
    getPotentialSummary,
    createPotentialLine,
    
    // Template functions
    getPotentialTemplates,
    updateAvailableLines,
    availableLines,
    
    // Validation functions
    validatePotentialLines,
    getMaxLinesForTier,
    canHavePotential,
    
    // Utility
    patterns: POTENTIAL_PATTERNS
  };
}

export default usePotential;

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Character, Equipment } from "@/types"
import { 
  Sword, 
  Shield, 
  Crown, 
  Shirt, 
  Footprints,
  Hand,
  Glasses,
  CircleDot,
  Heart,
  Gem,
  Badge,
  Eye,
  Circle,
  Square,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get slot icon component
export const getSlotIcon = (slotValue: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    weapon: Sword,
    secondary: Shield,
    emblem: Badge,
    hat: Crown,
    top: Shirt,
    bottom: Square,
    overall: Shirt,
    shoes: Footprints,
    gloves: Hand,
    cape: Square,
    belt: Circle,
    shoulder: Square,
    face: Glasses,
    eye: Eye,
    earring: CircleDot,
    ring1: Circle,
    ring2: Circle,
    ring3: Circle,
    ring4: Circle,
    pendant1: Gem,
    pendant2: Gem,
    pocket: Square,
    heart: Heart,
    badge: Badge,
    medal: Badge,
  };
  return iconMap[slotValue] || Square;
};

// Helper function to get transfer direction icon for equipment
export const getTransferIcon = (equipment: Equipment): React.ComponentType<{ className?: string }> | null => {
  if (equipment.transferredTo) {
    return ArrowRight; // Arrow pointing right (transferred TO something)
  }
  if (equipment.transferredFrom) {
    return ArrowLeft; // Arrow pointing left (transferred FROM something)
  }
  return null;
};

// Helper function to check if equipment was involved in a transfer
export const isTransferEquipment = (equipment: Equipment): boolean => {
  return !!(equipment.transferredTo || equipment.transferredFrom);
};

// Helper function to get transfer tooltip text
export const getTransferTooltip = (equipment: Equipment): string => {
  if (equipment.transferredTo) {
    return `StarForce transferred to another equipment (${equipment.transferredTo})`;
  }
  if (equipment.transferredFrom) {
    return `StarForce transferred from another equipment (${equipment.transferredFrom})`;
  }
  return '';
};

// Helper function to get max star force based on equipment level
export const getMaxStarForce = (level: number): number => {
  if (level <= 94) return 5;
  if (level <= 107) return 8;
  if (level <= 117) return 10;
  if (level <= 127) return 15;
  if (level <= 137) return 20;
  return 23; // 138 and above (adjusted to current system max of 23)
};

// Helper function to get default target star force (22 for level 140+, max otherwise)
export const getDefaultTargetStarForce = (level: number): number => {
  const maxStars = getMaxStarForce(level);
  // For level 140+ items, default to 22 instead of max (23)
  if (level > 140 && maxStars === 23) {
    return 22;
  }
  return maxStars;
};

interface CharacterStarForceSettings {
  enhancedSettings?: {
    thirtyPercentOff: boolean;
    fiveTenFifteenEvent: boolean;
    isInteractive: boolean;
    spareCount: number;
    sparePrice: number;
  };
  itemSafeguard?: { [equipmentId: string]: boolean };
  itemStarCatching?: { [equipmentId: string]: boolean };
  itemSpares?: { [equipmentId: string]: number };
  itemSparePrices?: { [equipmentId: string]: { value: number; unit: 'M' | 'B' } };
  itemActualCosts?: { [equipmentId: string]: { value: number; unit: 'M' | 'B' } };
}

interface ExportData {
  version: string;
  characters: Character[];
  starForceItems: Equipment[];
  starForceSettings?: { [characterId: string]: CharacterStarForceSettings };
  timestamp: string;
}

export function exportCharacterData(characters: Character[], starForceItems: Equipment[] = []): string {
  // Collect StarForce settings for each character
  const starForceSettings: { [characterId: string]: CharacterStarForceSettings } = {};
  
  characters.forEach(character => {
    const settings: CharacterStarForceSettings = {};
    
    // Helper function to get character-specific localStorage key
    const getStorageKey = (key: string) => `starforce-${key}-${character.id}`;
    
    try {
      // Load each type of setting from localStorage
      const enhancedSettings = localStorage.getItem(getStorageKey('settings'));
      if (enhancedSettings) {
        settings.enhancedSettings = JSON.parse(enhancedSettings);
      }
      
      const itemSafeguard = localStorage.getItem(getStorageKey('item-safeguard'));
      if (itemSafeguard) {
        settings.itemSafeguard = JSON.parse(itemSafeguard);
      }
      
      const itemStarCatching = localStorage.getItem(getStorageKey('item-starcatching'));
      if (itemStarCatching) {
        settings.itemStarCatching = JSON.parse(itemStarCatching);
      }
      
      const itemSpares = localStorage.getItem(getStorageKey('item-spares'));
      if (itemSpares) {
        settings.itemSpares = JSON.parse(itemSpares);
      }
      
      const itemSparePrices = localStorage.getItem(getStorageKey('item-spare-prices'));
      if (itemSparePrices) {
        settings.itemSparePrices = JSON.parse(itemSparePrices);
      }
      
      const itemActualCosts = localStorage.getItem(getStorageKey('item-actual-costs'));
      if (itemActualCosts) {
        settings.itemActualCosts = JSON.parse(itemActualCosts);
      }
      
      // Only include character settings if there's any data
      if (Object.keys(settings).length > 0) {
        starForceSettings[character.id] = settings;
      }
    } catch (error) {
      console.warn(`Failed to export settings for character ${character.name}:`, error);
    }
  });

  const data: ExportData = {
    version: "1.1", // Updated version to include StarForce settings
    characters,
    starForceItems,
    starForceSettings: Object.keys(starForceSettings).length > 0 ? starForceSettings : undefined,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const jsonString = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonString)));
  } catch (error) {
    console.error("Failed to export data:", error);
    throw new Error("Failed to export character data");
  }
}

export function importCharacterData(hash: string): ExportData {
  try {
    const jsonString = decodeURIComponent(escape(atob(hash)));
    const data = JSON.parse(jsonString) as ExportData;
    
    // Validate data structure
    if (!data.version || !Array.isArray(data.characters)) {
      throw new Error("Invalid data format");
    }
    
    // Import StarForce settings if available (version 1.1+)
    if (data.starForceSettings && data.version !== "1.0") {
      Object.entries(data.starForceSettings).forEach(([characterId, settings]) => {
        try {
          // Helper function to set character-specific localStorage key
          const setStorageKey = (key: string, value: unknown) => {
            localStorage.setItem(`starforce-${key}-${characterId}`, JSON.stringify(value));
          };
          
          // Restore each type of setting to localStorage
          if (settings.enhancedSettings) {
            setStorageKey('settings', settings.enhancedSettings);
          }
          
          if (settings.itemSafeguard) {
            setStorageKey('item-safeguard', settings.itemSafeguard);
          }
          
          if (settings.itemStarCatching) {
            setStorageKey('item-starcatching', settings.itemStarCatching);
          }
          
          if (settings.itemSpares) {
            setStorageKey('item-spares', settings.itemSpares);
          }
          
          if (settings.itemSparePrices) {
            setStorageKey('item-spare-prices', settings.itemSparePrices);
          }
          
          if (settings.itemActualCosts) {
            setStorageKey('item-actual-costs', settings.itemActualCosts);
          }
        } catch (error) {
          console.warn(`Failed to import settings for character ${characterId}:`, error);
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error("Failed to import data:", error);
    throw new Error("Invalid import data. Please check the format and try again.");
  }
}

export function saveToLocalStorage(characters: Character[], starForceItems: Equipment[] = []) {
  try {
    const data = { characters, starForceItems, timestamp: new Date().toISOString() };
    localStorage.setItem("maplestory-starforce-data", JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function loadFromLocalStorage(): { characters: Character[]; starForceItems: Equipment[] } | null {
  try {
    const stored = localStorage.getItem("maplestory-starforce-data");
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return {
      characters: data.characters || [],
      starForceItems: data.starForceItems || []
    };
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
}

// Spares count localStorage functions
export function saveSparesToLocalStorage(sparesData: Record<string, number>) {
  try {
    localStorage.setItem("maplestory-spares-data", JSON.stringify({
      spares: sparesData,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Failed to save spares to localStorage:", error);
  }
}

export function loadSparesFromLocalStorage(): Record<string, number> {
  try {
    const stored = localStorage.getItem("maplestory-spares-data");
    if (!stored) return {};
    
    const data = JSON.parse(stored);
    return data.spares || {};
  } catch (error) {
    console.error("Failed to load spares from localStorage:", error);
    return {};
  }
}

// Meso formatting and parsing utilities
export function formatMeso(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export function parseMesoInput(input: string): number {
  if (!input || input.trim() === '') return 0;
  
  const cleanInput = input.trim().toUpperCase();
  const lastChar = cleanInput.slice(-1);
  const numericPart = cleanInput.slice(0, -1);
  
  let multiplier = 1;
  let numberStr = cleanInput;
  
  if (lastChar === 'K') {
    multiplier = 1000;
    numberStr = numericPart;
  } else if (lastChar === 'M') {
    multiplier = 1000000;
    numberStr = numericPart;
  } else if (lastChar === 'B') {
    multiplier = 1000000000;
    numberStr = numericPart;
  }
  
  const number = parseFloat(numberStr);
  if (isNaN(number)) return 0;
  
  return Math.floor(number * multiplier);
}

export function isValidMesoInput(input: string): boolean {
  if (!input || input.trim() === '') return false;
  
  const cleanInput = input.trim().toUpperCase();
  const lastChar = cleanInput.slice(-1);
  const numericPart = cleanInput.slice(0, -1);
  
  // Check if it ends with valid unit or is just a number
  if (['K', 'M', 'B'].includes(lastChar)) {
    const number = parseFloat(numericPart);
    return !isNaN(number) && number > 0;
  } else {
    const number = parseFloat(cleanInput);
    return !isNaN(number) && number > 0;
  }
}

// Character-specific StarForce settings utilities
export function getCharacterStorageKey(characterId?: string, characterName?: string, key?: string): string {
  if (!key) return '';
  
  if (characterId) {
    return `starforce-${characterId}-${key}`;
  } else if (characterName) {
    return `starforce-${characterName.toLowerCase().replace(/\s+/g, '-')}-${key}`;
  } else {
    return `starforce-${key}`;
  }
}

export function loadCharacterSpareData(characterId?: string, characterName?: string): {
  spareCounts: Record<string, number>;
  sparePrices: Record<string, { value: number; unit: 'M' | 'B' }>;
  safeguardSettings: Record<string, boolean>;
} {
  try {
    const spareCountsKey = getCharacterStorageKey(characterId, characterName, 'item-spares');
    const sparePricesKey = getCharacterStorageKey(characterId, characterName, 'item-spare-prices');
    const safeguardKey = getCharacterStorageKey(characterId, characterName, 'item-safeguard');

    const spareCounts = localStorage.getItem(spareCountsKey);
    const sparePrices = localStorage.getItem(sparePricesKey);
    const safeguardSettings = localStorage.getItem(safeguardKey);

    return {
      spareCounts: spareCounts ? JSON.parse(spareCounts) : {},
      sparePrices: sparePrices ? JSON.parse(sparePrices) : {},
      safeguardSettings: safeguardSettings ? JSON.parse(safeguardSettings) : {}
    };
  } catch (error) {
    console.error('Failed to load character spare data:', error);
    return {
      spareCounts: {},
      sparePrices: {},
      safeguardSettings: {}
    };
  }
}
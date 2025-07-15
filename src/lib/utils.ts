import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Character, Equipment } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get max star force based on equipment level
export const getMaxStarForce = (level: number): number => {
  if (level <= 94) return 5;
  if (level <= 107) return 8;
  if (level <= 117) return 10;
  if (level <= 127) return 15;
  if (level <= 137) return 20;
  return 23; // 138 and above (adjusted to current system max of 23)
};

interface ExportData {
  version: string;
  characters: Character[];
  starForceItems: Equipment[];
  timestamp: string;
}

export function exportCharacterData(characters: Character[], starForceItems: Equipment[] = []): string {
  const data: ExportData = {
    version: "1.0",
    characters,
    starForceItems,
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
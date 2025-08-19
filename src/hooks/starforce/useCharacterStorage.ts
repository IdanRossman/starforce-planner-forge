import { useState, useEffect, useCallback } from 'react';

export interface UseCharacterStorageOptions {
  characterId?: string;
  characterName?: string;
  mode?: 'standalone' | 'equipment-table';
}

/**
 * Generic hook for managing character-specific localStorage
 * Follows the pattern: starforce-{key}-{characterId}
 */
export function useCharacterStorage({ characterId, characterName, mode }: UseCharacterStorageOptions = {}) {
  const getCharacterStorageKey = useCallback((key: string) => {
    if (mode === 'equipment-table') {
      if (characterId) {
        return `starforce-${key}-${characterId}`;
      } else if (characterName) {
        // Use character name as fallback for existing characters without ID
        return `starforce-${key}-${characterName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    }
    return `starforce-${key}`;
  }, [characterId, characterName, mode]);

  const loadCharacterSettings = useCallback(<T>(key: string, defaultValue: T): T => {
    try {
      const storageKey = getCharacterStorageKey(key);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  }, [getCharacterStorageKey]);

  const saveCharacterSettings = useCallback((key: string, value: unknown) => {
    try {
      const storageKey = getCharacterStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, [getCharacterStorageKey]);

  return {
    loadCharacterSettings,
    saveCharacterSettings,
    getCharacterStorageKey
  };
}

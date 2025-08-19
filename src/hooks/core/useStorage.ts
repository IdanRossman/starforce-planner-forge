import { useState, useEffect, useCallback } from 'react';

export interface StorageOptions {
  characterId?: string;
  characterName?: string;
  mode?: 'standalone' | 'equipment-table';
  namespace?: string;
}

/**
 * Generic localStorage hook with character-specific storage support
 * Supports namespaced storage with character-specific keys
 * 
 * LocalStorage Data Structure:
 * ===========================
 * 
 * Global Settings (standalone mode):
 * - starforce-global-settings: GlobalSettings
 * - starforce-item-settings: Record<equipmentId, ItemSettings>
 * - starforce-item-spares: Record<equipmentId, number>
 * - starforce-item-spare-prices: Record<equipmentId, number>
 * - starforce-item-actual-costs: Record<equipmentId, number>
 * - starforce-item-starcatching: Record<equipmentId, boolean>
 * 
 * Character-specific Settings (equipment-table mode):
 * - starforce-global-settings-{characterId}: GlobalSettings
 * - starforce-item-settings-{characterId}: Record<equipmentId, ItemSettings>
 * - starforce-item-spares-{characterId}: Record<equipmentId, number>
 * - starforce-item-spare-prices-{characterId}: Record<equipmentId, number>
 * - starforce-item-actual-costs-{characterId}: Record<equipmentId, number>
 * - starforce-item-starcatching-{characterId}: Record<equipmentId, boolean>
 * 
 * Character Data (via CharacterContext):
 * - starforce-characters: Character[]
 * - starforce-selected-character: string (characterId)
 * 
 * Types:
 * - GlobalSettings: { thirtyPercentOff, fiveTenFifteenEvent, starCatching, isInteractive, spareCount, sparePrice }
 * - ItemSettings: { safeguard, starCatching, spareCount, sparePrice }
 * - Character: { id, name, level, class, image, equipment, createdAt, updatedAt }
 * - Equipment: { id, name, slot, level, starforceable, currentStarForce, targetStarForce, actualCost, safeguard, ... }
 */
export function useStorage(options: StorageOptions = {}) {
  const { characterId, characterName, mode, namespace = 'starforce' } = options;

  const getStorageKey = useCallback((key: string) => {
    let storageKey = `${namespace}-${key}`;
    
    if (mode === 'equipment-table') {
      if (characterId) {
        storageKey += `-${characterId}`;
      } else if (characterName) {
        // Use character name as fallback for existing characters without ID
        storageKey += `-${characterName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    }
    
    return storageKey;
  }, [characterId, characterName, mode, namespace]);

  const loadData = useCallback(<T>(key: string, defaultValue: T): T => {
    try {
      const storageKey = getStorageKey(key);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
    }
    return defaultValue;
  }, [getStorageKey]);

  const saveData = useCallback((key: string, value: unknown) => {
    try {
      const storageKey = getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, [getStorageKey]);

  const removeData = useCallback((key: string) => {
    try {
      const storageKey = getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }, [getStorageKey]);

  const clearNamespace = useCallback(() => {
    try {
      const prefix = namespace + '-';
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error(`Failed to clear namespace ${namespace}:`, error);
    }
  }, [namespace]);

  return {
    loadData,
    saveData,
    removeData,
    clearNamespace,
    getStorageKey
  };
}

/**
 * Hook for managing persistent state with localStorage
 */
export function usePersistentState<T>(
  key: string, 
  defaultValue: T, 
  options: StorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const { loadData, saveData } = useStorage(options);
  
  const [state, setState] = useState<T>(() => loadData(key, defaultValue));

  const setPersistentState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
      saveData(key, newValue);
      return newValue;
    });
  }, [key, saveData]);

  return [state, setPersistentState];
}

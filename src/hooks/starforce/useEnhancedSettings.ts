import { useState, useEffect, useCallback } from 'react';

export interface EnhancedSettings {
  thirtyPercentOff: boolean; // 30% off event
  fiveTenFifteenEvent: boolean; // 5/10/15 event
  starCatching: boolean; // Star catching enabled globally
  isInteractive: boolean; // Interactive server toggle
  spareCount: number; // Number of spares
  sparePrice: number; // Price per spare in mesos
}

export interface UseCharacterStorageOptions {
  characterId?: string;
  characterName?: string;
  mode?: 'standalone' | 'equipment-table';
}

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

export function useEnhancedSettings(options: UseCharacterStorageOptions = {}) {
  const { loadCharacterSettings, saveCharacterSettings } = useCharacterStorage(options);

  const [enhancedSettings, setEnhancedSettings] = useState<EnhancedSettings>(() => {
    const defaultSettings: EnhancedSettings = {
      thirtyPercentOff: false,
      fiveTenFifteenEvent: false,
      starCatching: true,
      isInteractive: false,
      spareCount: 0,
      sparePrice: 0,
    };
    
    return loadCharacterSettings('settings', defaultSettings);
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveCharacterSettings('settings', enhancedSettings);
  }, [enhancedSettings, saveCharacterSettings]);

  const updateSettings = useCallback((updates: Partial<EnhancedSettings>) => {
    setEnhancedSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    enhancedSettings,
    setEnhancedSettings,
    updateSettings
  };
}

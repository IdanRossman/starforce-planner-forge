import { useCallback } from 'react';
import { useStorage, usePersistentState, StorageOptions } from '../core/useStorage';

export interface GlobalSettings {
  thirtyPercentOff: boolean; // 30% off event
  fiveTenFifteenEvent: boolean; // 5/10/15 event
  starCatching: boolean; // Star catching enabled globally
  isInteractive: boolean; // Interactive server toggle
}

export interface ItemSettings {
  safeguard: boolean;
  starCatching: boolean;
  spareCount: number;
  sparePrice: number;
}

export interface SettingsOperations {
  // Global settings
  globalSettings: GlobalSettings;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => void;
  resetGlobalSettings: () => void;
  
  // Per-item settings
  getItemSettings: (equipmentId: string) => ItemSettings;
  updateItemSettings: (equipmentId: string, updates: Partial<ItemSettings>) => void;
  resetItemSettings: (equipmentId: string) => void;
  clearAllItemSettings: () => void;
  
  // Bulk operations
  bulkUpdateItemSettings: (equipmentIds: string[], updates: Partial<ItemSettings>) => void;
  copyItemSettings: (sourceId: string, targetId: string) => void;
  
  // Import/Export
  exportSettings: () => string;
  importSettings: (jsonData: string) => void;
  
  // Utility
  getEffectiveItemSettings: (equipmentId: string) => ItemSettings; // Item settings with global fallbacks
  getSettingsSummary: () => {
    globalSettings: GlobalSettings;
    itemSettingsCount: number;
    customizedItems: string[];
  };
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  thirtyPercentOff: false,
  fiveTenFifteenEvent: false,
  starCatching: false,
  isInteractive: false,
};

const DEFAULT_ITEM_SETTINGS: ItemSettings = {
  safeguard: false,
  starCatching: false,
  spareCount: 0,
  sparePrice: 150000000
};

/**
 * Hook for managing all StarForce calculation settings
 * Handles both global settings and per-item customizations with localStorage persistence
 */
export function useSettings(options: StorageOptions = {}): SettingsOperations {
  const { loadData, saveData, removeData } = useStorage(options);
  
  // Global settings with persistence
  const [globalSettings, setGlobalSettings] = usePersistentState(
    'global-settings', 
    DEFAULT_GLOBAL_SETTINGS, 
    options
  );
  
  // Per-item settings with persistence
  const [itemSettings, setItemSettings] = usePersistentState<Record<string, ItemSettings>>(
    'item-settings', 
    {}, 
    options
  );

  // Global settings operations
  const updateGlobalSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setGlobalSettings(prev => ({ ...prev, ...updates }));
  }, [setGlobalSettings]);

  const resetGlobalSettings = useCallback(() => {
    setGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
  }, [setGlobalSettings]);

  // Per-item settings operations
  const getItemSettings = useCallback((equipmentId: string): ItemSettings => {
    return itemSettings[equipmentId] || DEFAULT_ITEM_SETTINGS;
  }, [itemSettings]);

  const updateItemSettings = useCallback((equipmentId: string, updates: Partial<ItemSettings>) => {
    setItemSettings(prev => ({
      ...prev,
      [equipmentId]: {
        ...getItemSettings(equipmentId),
        ...updates
      }
    }));
  }, [setItemSettings, getItemSettings]);

  const resetItemSettings = useCallback((equipmentId: string) => {
    setItemSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[equipmentId];
      return newSettings;
    });
  }, [setItemSettings]);

  const clearAllItemSettings = useCallback(() => {
    setItemSettings({});
  }, [setItemSettings]);

  // Bulk operations
  const bulkUpdateItemSettings = useCallback((equipmentIds: string[], updates: Partial<ItemSettings>) => {
    setItemSettings(prev => {
      const newSettings = { ...prev };
      equipmentIds.forEach(id => {
        newSettings[id] = {
          ...getItemSettings(id),
          ...updates
        };
      });
      return newSettings;
    });
  }, [setItemSettings, getItemSettings]);

  const copyItemSettings = useCallback((sourceId: string, targetId: string) => {
    const sourceSettings = getItemSettings(sourceId);
    updateItemSettings(targetId, sourceSettings);
  }, [getItemSettings, updateItemSettings]);

  // Import/Export
  const exportSettings = useCallback(() => {
    const exportData = {
      globalSettings,
      itemSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [globalSettings, itemSettings]);

  const importSettings = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.globalSettings) {
        setGlobalSettings({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...data.globalSettings
        });
      }
      
      if (data.itemSettings && typeof data.itemSettings === 'object') {
        setItemSettings(data.itemSettings);
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }, [setGlobalSettings, setItemSettings]);

  // Utility functions
  const getEffectiveItemSettings = useCallback((equipmentId: string): ItemSettings => {
    const itemSpecific = itemSettings[equipmentId];
    
    if (!itemSpecific) {
      // Use global settings as fallbacks
      return {
        safeguard: false, // Safeguard is always item-specific
        starCatching: globalSettings.starCatching,
        spareCount: 0,
        sparePrice: 0,
      };
    }
    
    return itemSpecific;
  }, [itemSettings, globalSettings]);

  const getSettingsSummary = useCallback(() => {
    const customizedItems = Object.keys(itemSettings);
    return {
      globalSettings,
      itemSettingsCount: customizedItems.length,
      customizedItems
    };
  }, [globalSettings, itemSettings]);

  return {
    globalSettings,
    updateGlobalSettings,
    resetGlobalSettings,
    getItemSettings,
    updateItemSettings,
    resetItemSettings,
    clearAllItemSettings,
    bulkUpdateItemSettings,
    copyItemSettings,
    exportSettings,
    importSettings,
    getEffectiveItemSettings,
    getSettingsSummary
  };
}

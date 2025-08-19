import { useState, useEffect, useCallback } from 'react';
import { useCharacterStorage, UseCharacterStorageOptions } from './useCharacterStorage';

export interface ItemSettings {
  [equipmentId: string]: boolean;
}

export interface ItemSpares {
  [equipmentId: string]: number;
}

export interface ItemSparePrices {
  [equipmentId: string]: { value: number; unit: 'M' | 'B' };
}

export interface ItemActualCosts {
  [equipmentId: string]: { value: number; unit: 'M' | 'B' };
}

/**
 * Hook for managing per-item StarForce settings
 * These are settings that are specific to individual equipment pieces
 */
export function useStarForceItemSettings(options: UseCharacterStorageOptions = {}) {
  const { loadCharacterSettings, saveCharacterSettings } = useCharacterStorage(options);

  // Per-item safeguard settings
  const [itemSafeguard, setItemSafeguard] = useState<ItemSettings>(() => {
    return loadCharacterSettings('item-safeguard', {} as ItemSettings);
  });

  // Per-item spare count
  const [itemSpares, setItemSpares] = useState<ItemSpares>(() => {
    return loadCharacterSettings('item-spares', {} as ItemSpares);
  });

  // Per-item spare prices
  const [itemSparePrices, setItemSparePrices] = useState<ItemSparePrices>(() => {
    return loadCharacterSettings('item-spare-prices', {} as ItemSparePrices);
  });

  // Per-item actual costs
  const [itemActualCosts, setItemActualCosts] = useState<ItemActualCosts>(() => {
    return loadCharacterSettings('item-actual-costs', {} as ItemActualCosts);
  });

  // Per-item star catching
  const [itemStarCatching, setItemStarCatching] = useState<ItemSettings>(() => {
    return loadCharacterSettings('item-starcatching', {} as ItemSettings);
  });

  // Save to localStorage when values change
  useEffect(() => {
    saveCharacterSettings('item-safeguard', itemSafeguard);
  }, [itemSafeguard, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-spares', itemSpares);
  }, [itemSpares, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-spare-prices', itemSparePrices);
  }, [itemSparePrices, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-actual-costs', itemActualCosts);
  }, [itemActualCosts, saveCharacterSettings]);

  useEffect(() => {
    saveCharacterSettings('item-starcatching', itemStarCatching);
  }, [itemStarCatching, saveCharacterSettings]);

  // Helper functions to update individual items
  const updateItemSafeguard = useCallback((equipmentId: string, safeguard: boolean) => {
    setItemSafeguard(prev => ({
      ...prev,
      [equipmentId]: safeguard
    }));
  }, []);

  const updateItemSpares = useCallback((equipmentId: string, spares: number) => {
    setItemSpares(prev => ({
      ...prev,
      [equipmentId]: spares
    }));
  }, []);

  const updateItemSparePrice = useCallback((equipmentId: string, price: { value: number; unit: 'M' | 'B' }) => {
    setItemSparePrices(prev => ({
      ...prev,
      [equipmentId]: price
    }));
  }, []);

  const updateItemActualCost = useCallback((equipmentId: string, cost: { value: number; unit: 'M' | 'B' }) => {
    setItemActualCosts(prev => ({
      ...prev,
      [equipmentId]: cost
    }));
  }, []);

  const updateItemStarCatching = useCallback((equipmentId: string, starCatching: boolean) => {
    setItemStarCatching(prev => ({
      ...prev,
      [equipmentId]: starCatching
    }));
  }, []);

  return {
    // State
    itemSafeguard,
    itemSpares,
    itemSparePrices,
    itemActualCosts,
    itemStarCatching,
    
    // Setters
    setItemSafeguard,
    setItemSpares,
    setItemSparePrices,
    setItemActualCosts,
    setItemStarCatching,
    
    // Helper functions
    updateItemSafeguard,
    updateItemSpares,
    updateItemSparePrice,
    updateItemActualCost,
    updateItemStarCatching,
  };
}

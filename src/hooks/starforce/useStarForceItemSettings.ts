import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../core/useStorage';
import { Equipment } from '../../types';
import { EquipmentCalculation } from './useStarForceCalculation';

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
export function useStarForceItemSettings(characterId?: string) {
  const { loadData, saveData } = useStorage();

  // Per-item safeguard settings
  const [itemSafeguard, setItemSafeguard] = useState<ItemSettings>(() => {
    const key = `item-safeguard${characterId ? `-${characterId}` : ''}`;
    return loadData(key, {});
  });

  // Per-item spare count
  const [itemSpares, setItemSpares] = useState<ItemSpares>(() => {
    const key = `item-spares${characterId ? `-${characterId}` : ''}`;
    return loadData(key, {});
  });

  // Per-item spare prices
  const [itemSparePrices, setItemSparePrices] = useState<ItemSparePrices>(() => {
    const key = `item-spare-prices${characterId ? `-${characterId}` : ''}`;
    return loadData(key, {});
  });

  // Per-item actual costs
  const [itemActualCosts, setItemActualCosts] = useState<ItemActualCosts>(() => {
    const key = `item-actual-costs${characterId ? `-${characterId}` : ''}`;
    return loadData(key, {});
  });

  // Per-item star catching
  const [itemStarCatching, setItemStarCatching] = useState<ItemSettings>(() => {
    const key = `item-starcatching${characterId ? `-${characterId}` : ''}`;
    return loadData(key, {});
  });

  // Temporary spare price editing state (doesn't trigger recalculation until committed)
  const [tempSparePrices, setTempSparePrices] = useState<ItemSparePrices>({});

  // Save to localStorage when values change
  useEffect(() => {
    const key = `item-safeguard${characterId ? `-${characterId}` : ''}`;
    saveData(key, itemSafeguard);
  }, [itemSafeguard, characterId, saveData]);

  useEffect(() => {
    const key = `item-spares${characterId ? `-${characterId}` : ''}`;
    saveData(key, itemSpares);
  }, [itemSpares, characterId, saveData]);

  useEffect(() => {
    const key = `item-spare-prices${characterId ? `-${characterId}` : ''}`;
    saveData(key, itemSparePrices);
  }, [itemSparePrices, characterId, saveData]);

  useEffect(() => {
    const key = `item-actual-costs${characterId ? `-${characterId}` : ''}`;
    saveData(key, itemActualCosts);
  }, [itemActualCosts, characterId, saveData]);

  useEffect(() => {
    const key = `item-starcatching${characterId ? `-${characterId}` : ''}`;
    saveData(key, itemStarCatching);
  }, [itemStarCatching, characterId, saveData]);

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

  // Spare price management functions
  const getCurrentSparePrice = useCallback((equipmentId: string) => {
    return tempSparePrices[equipmentId] || itemSparePrices[equipmentId] || { value: 0, unit: 'M' as const };
  }, [tempSparePrices, itemSparePrices]);

  const commitSparePriceChange = useCallback((equipmentId: string) => {
    const tempValue = tempSparePrices[equipmentId];
    if (tempValue) {
      setItemSparePrices(prev => ({ ...prev, [equipmentId]: tempValue }));
      setTempSparePrices(prev => {
        const newState = { ...prev };
        delete newState[equipmentId];
        return newState;
      });
    }
  }, [tempSparePrices]);

  // Auto-determine unit based on calculation data
  const getAutoUnit = useCallback((equipment: Equipment | EquipmentCalculation, equipmentCalculations?: EquipmentCalculation[]): 'M' | 'B' => {
    // Check current calculation values for this equipment
    const calc = equipmentCalculations?.find(c => c.id === equipment.id);
    if (calc) {
      // If most values are >= 1B, suggest B, otherwise M
      const values = [
        calc.averageCost,
        calc.medianCost,
        calc.p75Cost
      ];
      const billionValues = values.filter(v => v >= 1000000000).length;
      return billionValues >= 2 ? 'B' : 'M'; // If 2+ values are in billions, use B
    }

    // Fallback: check other items' spare prices for context
    const sparePrices = Object.values(itemSparePrices);
    if (sparePrices.length > 0) {
      const billionSpares = sparePrices.filter(p => p.unit === 'B').length;
      return billionSpares > sparePrices.length / 2 ? 'B' : 'M';
    }

    return 'M'; // Default to millions
  }, [itemSparePrices]);

  return {
    // State
    itemSafeguard,
    itemSpares,
    itemSparePrices,
    itemActualCosts,
    itemStarCatching,
    tempSparePrices,
    
    // Setters
    setItemSafeguard,
    setItemSpares,
    setItemSparePrices,
    setItemActualCosts,
    setItemStarCatching,
    setTempSparePrices,
    
    // Helper functions
    updateItemSafeguard,
    updateItemSpares,
    updateItemSparePrice,
    updateItemActualCost,
    updateItemStarCatching,
    
    // Spare price management
    getCurrentSparePrice,
    commitSparePriceChange,
    getAutoUnit,
  };
}

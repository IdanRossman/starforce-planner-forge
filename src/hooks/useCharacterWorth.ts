import { useState, useEffect, useCallback } from 'react';
import { Equipment, StorageItem } from '@/types';
import { calculateBulkStarforce, BulkItemCalculationDto, convertFromMesos } from '@/services/starforceService';
import { potentialService, PotentialBulkItem } from '@/services/potentialService';

interface CharacterWorth {
  starforce: {
    averageCost: number;
    medianCost: number;
    totalItems: number;
  };
  potential: {
    averageCost: number;
    medianCost: number;
    totalItems: number;
  };
  total: {
    averageCost: number;
    medianCost: number;
  };
}

interface UseCharacterWorthResult {
  worth: CharacterWorth | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCharacterWorth(
  equipment: Equipment[],
  storageItems: StorageItem[],
  characterId?: string
): UseCharacterWorthResult {
  const [worth, setWorth] = useState<CharacterWorth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateWorth = useCallback(async () => {
    if (!characterId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Combine equipped and storage items for SF calculation
      const sfItems: BulkItemCalculationDto[] = [];

      // Add equipped items with currentStarForce > 0
      equipment.forEach(eq => {
        if (eq.starforceable && eq.currentStarForce > 0) {
          sfItems.push({
            itemLevel: eq.level,
            fromStar: 0,
            toStar: eq.currentStarForce,
            itemName: eq.name,
            starCatching: true,
            safeguard: false,
          });
        }
      });

      // Add storage items with currentStarForce > 0
      storageItems.forEach(item => {
        if (item.starforceable && item.currentStarForce > 0) {
          sfItems.push({
            itemLevel: item.level,
            fromStar: 0,
            toStar: item.currentStarForce,
            itemName: item.name,
            starCatching: true,
            safeguard: false,
          });
        }
      });

      // Calculate StarForce worth
      let sfResult = { averageCost: 0, medianCost: 0, totalItems: 0 };
      if (sfItems.length > 0) {
        const { response } = await calculateBulkStarforce({ items: sfItems });
        sfResult = {
          averageCost: response.summary.totalAverageCost,
          medianCost: response.summary.totalMedianCost,
          totalItems: sfItems.length,
        };
      }

      // Prepare potential items
      const potentialItems: PotentialBulkItem[] = [];

      // Add equipped items with current potential
      // Use eq.type (matches PotentialCalculator) with fallback to itemType
      equipment.forEach(eq => {
        const itemType = eq.type || eq.itemType;
        if (eq.currentPotentialValue && itemType) {
          potentialItems.push({
            itemType,
            itemLevel: eq.level,
            selectedOption: eq.currentPotentialValue,
            cubeType: 'black',
            itemName: eq.name,
          });
        }
      });

      // Add storage items with current potential
      storageItems.forEach(item => {
        const itemType = item.type || item.itemType;
        if (item.currentPotential && itemType) {
          potentialItems.push({
            itemType,
            itemLevel: item.level,
            selectedOption: item.currentPotential,
            cubeType: 'black',
            itemName: item.name,
          });
        }
      });

      // Calculate Potential worth
      let potResult = { averageCost: 0, medianCost: 0, totalItems: 0 };
      if (potentialItems.length > 0) {
        const response = await potentialService.calculateBulkPotentialCosts(potentialItems);
        potResult = {
          averageCost: response.summary.totalAverageCost,
          medianCost: response.summary.totalMedianCost,
          totalItems: potentialItems.length,
        };
      }

      setWorth({
        starforce: sfResult,
        potential: potResult,
        total: {
          averageCost: sfResult.averageCost + potResult.averageCost,
          medianCost: sfResult.medianCost + potResult.medianCost,
        },
      });
    } catch (err) {
      console.error('Failed to calculate character worth:', err);
      setError('Failed to calculate worth');
    } finally {
      setIsLoading(false);
    }
  }, [equipment, storageItems, characterId]);

  // Auto-calculate when character changes
  useEffect(() => {
    calculateWorth();
  }, [calculateWorth]);

  return {
    worth,
    isLoading,
    error,
    refetch: calculateWorth,
  };
}

// Helper to format mesos for display
export function formatMesos(mesos: number): string {
  const { value, unit } = convertFromMesos(mesos);
  if (value === 0) return '0';
  return `${value.toLocaleString()}${unit}`;
}

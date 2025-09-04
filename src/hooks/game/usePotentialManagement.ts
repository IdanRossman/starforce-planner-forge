import { useState, useCallback } from 'react';
import { potentialService, PotentialEnhancementRequest, PotentialEnhancementResponse, PotentialLinesResponse, PotentialDropdownCategory } from '@/services/potentialService';
import { PotentialCalculation, EquipmentTier, PotentialLine } from '@/types';

interface UsePotentialManagementOptions {
  onEnhancementComplete?: (result: PotentialEnhancementResponse) => void;
  onCalculationComplete?: (result: PotentialCalculation) => void;
  onError?: (error: Error) => void;
}

export function usePotentialManagement(options: UsePotentialManagementOptions = {}) {
  const { onEnhancementComplete, onCalculationComplete, onError } = options;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<PotentialDropdownCategory[]>([]);
  const [currentCalculation, setCurrentCalculation] = useState<PotentialCalculation | null>(null);
  const [lastEnhancement, setLastEnhancement] = useState<PotentialEnhancementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear any existing errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch available potential lines for item type and level (legendary tier only)
   */
  const fetchPotentialLines = useCallback(async (itemType: string, itemLevel: number) => {
    console.log('fetchPotentialLines function called with:', { itemType, itemLevel });
    setIsLoading(true);
    setError(null);

    try {
      console.log('About to make HTTP request to getPotentialLines...');
      const response: PotentialLinesResponse = await potentialService.getPotentialLines(itemType, itemLevel);
      console.log('HTTP response received:', response);
      setAvailableCategories(response.dropdownOptions);
      return response;
    } catch (err) {
      console.error('Error in fetchPotentialLines:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch potential lines';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  /**
   * Calculate potential enhancement costs (legendary tier only)
   */
  const calculateCosts = useCallback(async (
    itemType: string,
    itemLevel: number,
    targetLines: PotentialLine[],
    cubeType: 'red' | 'black' = 'black'
  ) => {
    setIsCalculating(true);
    setError(null);

    try {
      const calculation = await potentialService.calculatePotentialCost(
        itemType,
        itemLevel,
        targetLines,
        cubeType
      );
      
      setCurrentCalculation(calculation);
      onCalculationComplete?.(calculation);
      return calculation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate potential costs';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [onCalculationComplete, onError]);

  /**
   * Enhance equipment potential
   */
  const enhancePotential = useCallback(async (request: PotentialEnhancementRequest) => {
    setIsEnhancing(true);
    setError(null);

    try {
      // Validate equipment first
      const validation = potentialService.validateEquipmentForPotential(
        request.itemType,
        request.itemType // You might want to pass actual slot here
      );

      if (!validation.canHavePotential) {
        throw new Error(validation.reason || 'Equipment cannot have potential');
      }

      const result = await potentialService.enhancePotential(request);
      setLastEnhancement(result);
      onEnhancementComplete?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance potential';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsEnhancing(false);
    }
  }, [onEnhancementComplete, onError]);

  /**
   * Validate if equipment can have potential
   */
  const validateEquipment = useCallback((equipmentType: string, slot?: string) => {
    return potentialService.validateEquipmentForPotential(equipmentType, slot);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setAvailableCategories([]);
    setCurrentCalculation(null);
    setLastEnhancement(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    isCalculating,
    isEnhancing,
    availableCategories,
    currentCalculation,
    lastEnhancement,
    error,

    // Actions
    fetchPotentialLines,
    calculateCosts,
    enhancePotential,
    validateEquipment,
    clearError,
    reset,

    // Computed values
    hasAvailableOptions: availableCategories.length > 0,
    hasCalculation: currentCalculation !== null,
    hasEnhancementResult: lastEnhancement !== null,
    isAnyLoading: isLoading || isCalculating || isEnhancing,
  };
}

export default usePotentialManagement;

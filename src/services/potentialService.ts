import { apiService } from './api';
import { PotentialCalculation, EquipmentTier, PotentialLine } from '@/types';

export interface PotentialEnhancementRequest {
  equipmentId: number;
  itemType: string;
  itemLevel: number;
  cubeType: 'red' | 'black';
  targetLines: PotentialLine[];
}

export interface PotentialEnhancementResponse {
  success: boolean;
  newPotential: PotentialLine[];
  cubesUsed: number;
  totalCost: number;
  message?: string;
}

export interface PotentialOption {
  value: string;
  displayText: string;
}

export interface PotentialDropdownCategory {
  label: string;
  options: PotentialOption[];
}

export interface PotentialLinesResponse {
  itemType: string;
  itemLevel: number;
  dropdownOptions: PotentialDropdownCategory[];
}

// New interfaces for bulk calculation with individual cube types
export interface PotentialBulkItem {
  itemType: string;
  itemLevel: number;
  selectedOption: string;
  cubeType: 'red' | 'black' | null; // null for smart cube optimization
  isDMT?: boolean; // Always false
  itemName?: string;
}

export interface PotentialBulkRequest {
  items: PotentialBulkItem[];
}

export interface PotentialBulkItemResult {
  itemType: string;
  itemLevel: number;
  selectedOption: string;
  cubeType: 'red' | 'black';
  isDMT: boolean;
  itemName?: string;
  result: {
    probability: number;
    averageCubes: number;
    medianCubes: number;
    percentile75Cubes: number;
    averageCost: number;
    medianCost: number;
    percentile75Cost: number;
    inputParameters: {
      selectedOption: string;
      itemType: string;
      cubeType: string;
      itemLevel: number;
      isDMT: boolean;
    };
  } | null;
  error?: string | null;
}

export interface PotentialBulkResponse {
  results: PotentialBulkItemResult[];
  summary: {
    totalAverageCost: number;
    totalMedianCost: number;
    totalAverageCubes: number;
    itemCount: number;
  };
}

class PotentialService {
  /**
   * Get available potential lines for a specific item type and level (legendary tier only)
   */
  async getPotentialLines(itemType: string, itemLevel: number): Promise<PotentialLinesResponse> {
    try {
      const response = await apiService.get<PotentialLinesResponse>(
        `/potential/input-options?itemType=${encodeURIComponent(itemType)}&itemLevel=${itemLevel}`
      );
      
      return response;
    } catch (error) {
      console.error('Failed to fetch potential lines:', error);
      throw error;
    }
  }

  /**
   * Calculate potential cube costs and statistics (legendary tier only)
   */
  async calculatePotentialCost(
    itemType: string,
    itemLevel: number,
    targetLines: PotentialLine[],
    cubeType: 'red' | 'black' = 'black'
  ): Promise<PotentialCalculation> {
    try {
      const request = {
        itemType,
        itemLevel,
        cubeType,
        targetLines: targetLines.map(line => line.value)
      };

      return await apiService.post<PotentialCalculation>('/potential/calculate', request);
    } catch (error) {
      console.error('Failed to calculate potential cost:', error);
      throw error;
    }
  }

  /**
   * Bulk calculate potential costs with individual cube types
   */
  async calculateBulkPotentialCosts(items: PotentialBulkItem[]): Promise<PotentialBulkResponse> {
    try {
      const request: PotentialBulkRequest = {
        items: items.map(item => ({
          ...item,
          isDMT: false // Always false as specified
        }))
      };

      return await apiService.post<PotentialBulkResponse>('/potential/bulk-calculate-individual-cubes', request);
    } catch (error) {
      console.error('Failed to calculate bulk potential costs:', error);
      throw error;
    }
  }

  /**
   * Enhance equipment potential (simulate cube usage) - legendary tier only
   */
  async enhancePotential(request: PotentialEnhancementRequest): Promise<PotentialEnhancementResponse> {
    try {
      const enhancementData = {
        itemType: request.itemType,
        itemLevel: request.itemLevel,
        cubeType: request.cubeType,
        targetLines: request.targetLines.map(line => line.value)
      };

      return await apiService.post<PotentialEnhancementResponse>(
        `/potential/enhance/${request.equipmentId}`, 
        enhancementData
      );
    } catch (error) {
      console.error('Failed to enhance potential:', error);
      throw error;
    }
  }

  /**
   * Validate if equipment can have potential
   */
  validateEquipmentForPotential(equipmentType: string, slot?: string): { canHavePotential: boolean; reason?: string } {
    const noPotentialSlots = ['badge', 'medal', 'pocket'];
    
    if (slot && noPotentialSlots.includes(slot.toLowerCase())) {
      return {
        canHavePotential: false,
        reason: `${slot} items do not have potentials and cannot be enhanced`
      };
    }

    return { canHavePotential: true };
  }
}

export const potentialService = new PotentialService();

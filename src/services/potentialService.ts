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

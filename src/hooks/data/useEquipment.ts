import { useCallback } from 'react';
import { Equipment } from '../../types';
import { useCharacterContext } from '../useCharacterContext';

export interface StarForceAdjustable {
  id: string;
  currentStarForce?: number;
  targetStarForce?: number;
}

export interface EquipmentOperations {
  // StarForce operations
  updateStarForce: (equipmentId: string, current: number, target: number) => void;
  quickAdjustStarForce: (equipment: StarForceAdjustable, type: 'current' | 'target', delta: number) => void;
  
  // Cost operations
  updateActualCost: (equipmentId: string, actualCost: number) => void;
  clearActualCost: (equipmentId: string) => void;
  
  // Safeguard operations
  updateSafeguard: (equipmentId: string, safeguard: boolean) => void;
  
  // Equipment CRUD operations
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void;
  removeEquipment: (equipmentId: string) => void;
  clearAllEquipment: () => void;
  
  // Bulk operations
  bulkUpdateStarForce: (updates: Array<{ id: string; current: number; target: number }>) => void;
  bulkUpdateSafeguard: (equipmentIds: string[], safeguard: boolean) => void;
  
  // Transfer operations
  transferStarForce: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
  
  // Advanced transfer operations
  prepareTransfer: (sourceEquipmentId: string, targetEquipmentId: string) => void;
  cancelTransfer: (equipmentId: string) => void;
  completeTransfer: (sourceEquipmentId: string) => void;
  getTransferCost: () => number;
  canTransfer: (sourceEquipment: Equipment, targetEquipment: Equipment) => { canTransfer: boolean; reason?: string };
  getTransferHistory: (equipmentId: string) => Array<{ from?: string; to?: string; stars: number; date?: string }>;
  
  // Utility operations
  duplicateEquipment: (equipmentId: string) => void;
  resetEquipmentProgress: (equipmentId: string) => void;
}

/**
 * Hook for managing all equipment operations
 * Handles StarForce modifications, costs, safeguards, and CRUD operations
 */
export function useEquipment(): EquipmentOperations {
  const { 
    selectedCharacter, 
    updateCharacterEquipment,
    addEquipmentToCharacter,
    removeEquipmentFromCharacter 
  } = useCharacterContext();

  // Update individual equipment properties
  const updateEquipment = useCallback((equipmentId: string, updates: Partial<Equipment>) => {
    if (!selectedCharacter) return;

    const updatedEquipment = selectedCharacter.equipment.map(eq =>
      eq.id === equipmentId ? { ...eq, ...updates } : eq
    );

    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  // StarForce operations
  const updateStarForce = useCallback((equipmentId: string, current: number, target: number) => {
    updateEquipment(equipmentId, {
      currentStarForce: Math.max(0, Math.min(25, current)),
      targetStarForce: Math.max(0, Math.min(25, target))
    });
  }, [updateEquipment]);

  const quickAdjustStarForce = useCallback((equipment: StarForceAdjustable, type: 'current' | 'target', delta: number) => {
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    
    if (type === 'current') {
      const newCurrent = Math.max(0, Math.min(25, current + delta));
      updateStarForce(equipment.id, newCurrent, target);
    } else {
      const newTarget = Math.max(0, Math.min(25, target + delta));
      updateStarForce(equipment.id, current, newTarget);
    }
  }, [updateStarForce]);

  // Cost operations
  const updateActualCost = useCallback((equipmentId: string, actualCost: number) => {
    updateEquipment(equipmentId, { actualCost: Math.max(0, actualCost) });
  }, [updateEquipment]);

  const clearActualCost = useCallback((equipmentId: string) => {
    updateEquipment(equipmentId, { actualCost: undefined });
  }, [updateEquipment]);

  // Safeguard operations
  const updateSafeguard = useCallback((equipmentId: string, safeguard: boolean) => {
    updateEquipment(equipmentId, { safeguard });
  }, [updateEquipment]);

  // Equipment CRUD operations
  const addEquipment = useCallback((equipment: Omit<Equipment, 'id'>) => {
    if (!selectedCharacter) return;
    
    const newEquipment: Equipment = {
      ...equipment,
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    addEquipmentToCharacter(selectedCharacter.id, newEquipment);
  }, [selectedCharacter, addEquipmentToCharacter]);

  const removeEquipment = useCallback((equipmentId: string) => {
    if (!selectedCharacter) return;
    removeEquipmentFromCharacter(selectedCharacter.id, equipmentId);
  }, [selectedCharacter, removeEquipmentFromCharacter]);

  const clearAllEquipment = useCallback(() => {
    if (!selectedCharacter) return;
    updateCharacterEquipment(selectedCharacter.id, []);
  }, [selectedCharacter, updateCharacterEquipment]);

  // Bulk operations
  const bulkUpdateStarForce = useCallback((updates: Array<{ id: string; current: number; target: number }>) => {
    if (!selectedCharacter) return;

    const updatedEquipment = selectedCharacter.equipment.map(eq => {
      const update = updates.find(u => u.id === eq.id);
      if (update) {
        return {
          ...eq,
          currentStarForce: Math.max(0, Math.min(25, update.current)),
          targetStarForce: Math.max(0, Math.min(25, update.target))
        };
      }
      return eq;
    });

    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  const bulkUpdateSafeguard = useCallback((equipmentIds: string[], safeguard: boolean) => {
    if (!selectedCharacter) return;

    const updatedEquipment = selectedCharacter.equipment.map(eq => 
      equipmentIds.includes(eq.id) ? { ...eq, safeguard } : eq
    );

    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  // Transfer operations
  const transferStarForce = useCallback((sourceEquipment: Equipment, targetEquipment: Equipment) => {
    if (!selectedCharacter) return;

    const transferredStars = sourceEquipment.currentStarForce || 0;
    
    // Update both equipments
    const updatedEquipment = selectedCharacter.equipment.map(eq => {
      if (eq.id === sourceEquipment.id) {
        // Source loses stars and is marked for destruction
        return {
          ...eq,
          currentStarForce: 0,
          transferredTo: targetEquipment.id,
          transferredStars,
          isTransferSource: true,
          transferTargetId: targetEquipment.id
        };
      } else if (eq.id === targetEquipment.id) {
        // Target gets the stars
        return {
          ...eq,
          currentStarForce: transferredStars,
          transferredFrom: sourceEquipment.id,
          transferredStars
        };
      }
      return eq;
    });

    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  // Advanced transfer operations
  const prepareTransfer = useCallback((sourceEquipmentId: string, targetEquipmentId: string) => {
    if (!selectedCharacter) return;

    const updatedEquipment = selectedCharacter.equipment.map(eq => {
      if (eq.id === sourceEquipmentId) {
        return {
          ...eq,
          transferTargetId: targetEquipmentId,
          isTransferSource: false // Mark as prepared but not completed
        };
      }
      return eq;
    });

    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  const cancelTransfer = useCallback((equipmentId: string) => {
    updateEquipment(equipmentId, {
      transferTargetId: undefined,
      isTransferSource: undefined,
      transferredTo: undefined,
      transferredFrom: undefined,
      transferredStars: undefined
    });
  }, [updateEquipment]);

  const completeTransfer = useCallback((sourceEquipmentId: string) => {
    if (!selectedCharacter) return;

    const sourceEquipment = selectedCharacter.equipment.find(eq => eq.id === sourceEquipmentId);
    const targetEquipmentId = sourceEquipment?.transferTargetId;
    
    if (!sourceEquipment || !targetEquipmentId) return;

    const targetEquipment = selectedCharacter.equipment.find(eq => eq.id === targetEquipmentId);
    if (!targetEquipment) return;

    // Complete the transfer
    transferStarForce(sourceEquipment, targetEquipment);
  }, [selectedCharacter, transferStarForce]);

  const getTransferCost = useCallback(() => {
    return 100000000; // 100M mesos standard transfer cost
  }, []);

  const canTransfer = useCallback((sourceEquipment: Equipment, targetEquipment: Equipment): { canTransfer: boolean; reason?: string } => {
    // Check if source has stars to transfer
    if ((sourceEquipment.currentStarForce || 0) === 0) {
      return { canTransfer: false, reason: 'Source equipment has no stars to transfer' };
    }

    // Check if equipment is in same slot
    if (sourceEquipment.slot !== targetEquipment.slot) {
      return { canTransfer: false, reason: 'Equipment must be in the same slot' };
    }

    // Check if target already has stars (would lose them)
    if ((targetEquipment.currentStarForce || 0) > 0) {
      return { canTransfer: false, reason: 'Target equipment already has stars (would be overwritten)' };
    }

    // Check if source is already a transfer source
    if (sourceEquipment.isTransferSource) {
      return { canTransfer: false, reason: 'Source equipment is already prepared for transfer' };
    }

    // Check if target is already a transfer target
    if (targetEquipment.transferredFrom) {
      return { canTransfer: false, reason: 'Target equipment already received a transfer' };
    }

    return { canTransfer: true };
  }, []);

  const getTransferHistory = useCallback((equipmentId: string): Array<{ from?: string; to?: string; stars: number; date?: string }> => {
    if (!selectedCharacter) return [];

    const equipment = selectedCharacter.equipment.find(eq => eq.id === equipmentId);
    if (!equipment) return [];

    const history: Array<{ from?: string; to?: string; stars: number; date?: string }> = [];

    // If this equipment received stars
    if (equipment.transferredFrom && equipment.transferredStars) {
      const sourceEquipment = selectedCharacter.equipment.find(eq => eq.id === equipment.transferredFrom);
      history.push({
        from: sourceEquipment?.name || equipment.transferredFrom,
        stars: equipment.transferredStars,
        date: undefined // We don't store transfer dates yet
      });
    }

    // If this equipment transferred stars
    if (equipment.transferredTo && equipment.transferredStars) {
      const targetEquipment = selectedCharacter.equipment.find(eq => eq.id === equipment.transferredTo);
      history.push({
        to: targetEquipment?.name || equipment.transferredTo,
        stars: equipment.transferredStars,
        date: undefined // We don't store transfer dates yet
      });
    }

    return history;
  }, [selectedCharacter]);

  // Utility operations
  const duplicateEquipment = useCallback((equipmentId: string) => {
    if (!selectedCharacter) return;
    
    const equipment = selectedCharacter.equipment.find(eq => eq.id === equipmentId);
    if (!equipment) return;
    
    const duplicated: Equipment = {
      ...equipment,
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${equipment.name} (Copy)`,
      currentStarForce: 0, // Reset progress for duplicate
      actualCost: undefined,
      // Clear transfer-related properties
      transferredFrom: undefined,
      transferredTo: undefined,
      transferredStars: undefined,
      isTransferSource: undefined,
      transferTargetId: undefined
    };
    
    addEquipmentToCharacter(selectedCharacter.id, duplicated);
  }, [selectedCharacter, addEquipmentToCharacter]);

  const resetEquipmentProgress = useCallback((equipmentId: string) => {
    updateEquipment(equipmentId, {
      currentStarForce: 0,
      actualCost: undefined,
      // Clear transfer-related properties
      transferredFrom: undefined,
      transferredTo: undefined,
      transferredStars: undefined,
      isTransferSource: undefined,
      transferTargetId: undefined
    });
  }, [updateEquipment]);

  return {
    updateStarForce,
    quickAdjustStarForce,
    updateActualCost,
    clearActualCost,
    updateSafeguard,
    addEquipment,
    updateEquipment,
    removeEquipment,
    clearAllEquipment,
    bulkUpdateStarForce,
    bulkUpdateSafeguard,
    transferStarForce,
    prepareTransfer,
    cancelTransfer,
    completeTransfer,
    getTransferCost,
    canTransfer,
    getTransferHistory,
    duplicateEquipment,
    resetEquipmentProgress
  };
}

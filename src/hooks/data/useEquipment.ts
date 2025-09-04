import { useCallback } from 'react';
import { Equipment, EquipmentSlot } from '../../types';
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
  clearEquipmentSlot: (slot: EquipmentSlot) => void;
  clearAllEquipment: () => void;
  
  // Bulk operations
  bulkUpdateStarForce: (updates: Array<{ id: string; current: number; target: number }>) => void;
  bulkUpdateSafeguard: (equipmentIds: string[], safeguard: boolean) => void;
  
  // Transfer operations - Enhanced to match EquipmentForm logic
  transferStarForce: (sourceEquipment: Equipment, targetEquipment: Equipment, targetCurrentStars?: number, targetTargetStars?: number, existingEquipment?: Equipment[], onTransfer?: (source: Equipment, target: Equipment) => void) => void;
  
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

  const clearEquipmentSlot = useCallback((slot: EquipmentSlot) => {
    if (!selectedCharacter) return;
    // Find equipment in this slot and remove it
    const equipmentToRemove = selectedCharacter.equipment.find(eq => eq.slot === slot);
    if (equipmentToRemove) {
      removeEquipmentFromCharacter(selectedCharacter.id, equipmentToRemove.id);
    }
  }, [selectedCharacter, removeEquipmentFromCharacter]);

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

  // Transfer operations - Enhanced to match EquipmentForm logic
  const transferStarForce = useCallback((
    sourceEquipment: Equipment, 
    targetEquipment: Equipment, 
    targetCurrentStars?: number, 
    targetTargetStars?: number,
    existingEquipment: Equipment[] = [],
    onTransfer?: (source: Equipment, target: Equipment) => void
  ) => {
    console.log('🔄 transferStarForce called with:', {
      sourceEquipment: { id: sourceEquipment.id, name: sourceEquipment.name, slot: sourceEquipment.slot },
      targetEquipment: { id: targetEquipment.id, name: targetEquipment.name, slot: targetEquipment.slot },
      targetCurrentStars,
      targetTargetStars,
      hasOnTransfer: !!onTransfer,
      selectedCharacterId: selectedCharacter?.id
    });

    // For backward compatibility, use simple logic if optional params not provided
    if (targetCurrentStars === undefined || targetTargetStars === undefined) {
      console.log('⚠️ Using backward compatibility mode');
      if (!selectedCharacter) return;

      const transferredStars = sourceEquipment.currentStarForce || 0;
      
      // Update both equipments with simple logic
      const updatedEquipment = selectedCharacter.equipment.map(eq => {
        if (eq.id === sourceEquipment.id) {
          return {
            ...eq,
            currentStarForce: 0,
            transferredTo: targetEquipment.id,
            transferredStars,
            isTransferSource: true,
            transferTargetId: targetEquipment.id
          };
        } else if (eq.id === targetEquipment.id) {
          return {
            ...eq,
            currentStarForce: transferredStars,
            transferredFrom: sourceEquipment.id,
            transferredStars
          };
        }
        return eq;
      });

      console.log('📝 Updating equipment (simple mode):', updatedEquipment.filter(eq => eq.id === sourceEquipment.id || eq.id === targetEquipment.id));
      updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
      return;
    }

    console.log('✅ Using enhanced mode with specific star values');
    // Enhanced logic that matches EquipmentForm handleTransfer exactly
    // Calculate the actual transferred star amount (source target - 1 for penalty)
    const transferredStarAmount = Math.max(0, sourceEquipment.targetStarForce - 1);
    
    // Ensure we have the correct image for the target equipment
    const targetImage = targetEquipment.image || '';
    
    // Determine the correct specific slot for the target equipment
    // If target has a generic slot (pendant, ring), find an available specific slot
    let targetSlot: EquipmentSlot = targetEquipment.slot;
    const sourceSlot = sourceEquipment.slot;
    
    // Handle multi-slot types (rings, pendants) - check the string value of the slot
    const targetSlotString = targetEquipment.slot as string;
    if (targetSlotString === 'pendant' || targetSlotString === 'ring') {
      // Find an available specific slot for this type
      const possibleSlots: EquipmentSlot[] = targetSlotString === 'pendant' 
        ? ['pendant1', 'pendant2'] 
        : ['ring1', 'ring2', 'ring3', 'ring4'];
      
      // Find first available slot or use the source slot if it's the same type
      const availableSlot = possibleSlots.find(slot => {
        const existing = existingEquipment?.find(eq => eq.slot === slot && eq.id !== sourceEquipment.id);
        return !existing;
      });
      
      targetSlot = availableSlot || sourceSlot; // Fallback to source slot if no available slot found
    }
    
    // Create the updated target equipment with transferred stars
    const updatedTargetEquipment: Equipment = {
      ...targetEquipment,
      slot: targetSlot, // Use the determined specific slot
      currentStarForce: targetCurrentStars,
      targetStarForce: targetTargetStars,
      transferredFrom: sourceEquipment.id, // Mark as transfer target
      transferredStars: transferredStarAmount, // Track the actual transferred star amount as minimum
      image: targetImage, // Explicitly ensure the image is preserved
    };

    // Create the source equipment for the table (with transfer indicator)
    const sourceForTable: Equipment = {
      ...sourceEquipment,
      transferredTo: targetEquipment.id, // Mark as transfer source
    };

    // Always update the equipment directly first
    if (selectedCharacter) {
      // Check if target equipment already exists in character's equipment
      const targetExistsInCharacter = selectedCharacter.equipment.some(eq => eq.id === targetEquipment.id);
      console.log('🔍 Target equipment exists in character?', { exists: targetExistsInCharacter, targetId: targetEquipment.id });
      
      let updatedEquipment;
      
      if (targetExistsInCharacter) {
        // Target exists - update both source and target
        updatedEquipment = selectedCharacter.equipment.map(eq => {
          if (eq.id === sourceEquipment.id) {
            console.log('🔄 Updating existing source equipment:', { id: eq.id, name: eq.name, newState: 'transferred' });
            return sourceForTable;
          } else if (eq.id === targetEquipment.id) {
            console.log('🔄 Updating existing target equipment:', { id: eq.id, name: eq.name, slot: targetSlot, currentStars: targetCurrentStars, targetStars: targetTargetStars });
            return updatedTargetEquipment;
          }
          return eq;
        });
      } else {
        // Target doesn't exist - we need to add target and potentially source
        const sourceExistsInCharacter = selectedCharacter.equipment.some(eq => eq.id === sourceEquipment.id);
        console.log('🔍 Source equipment exists in character?', { exists: sourceExistsInCharacter, sourceId: sourceEquipment.id });
        
        if (sourceExistsInCharacter) {
          // Source exists, target doesn't - update source and add target
          updatedEquipment = [
            ...selectedCharacter.equipment.map(eq => {
              if (eq.id === sourceEquipment.id) {
                console.log('🔄 Updating existing source equipment:', { id: eq.id, name: eq.name, newState: 'transferred' });
                return sourceForTable;
              }
              return eq;
            }),
            updatedTargetEquipment // Add the target equipment as new item
          ];
          console.log('➕ Adding new target equipment:', { id: updatedTargetEquipment.id, name: updatedTargetEquipment.name, slot: targetSlot });
        } else {
          // Neither source nor target exist - add both
          updatedEquipment = [
            ...selectedCharacter.equipment,
            sourceForTable, // Add the source equipment
            updatedTargetEquipment // Add the target equipment as new item
          ];
          console.log('➕ Adding new source equipment:', { id: sourceForTable.id, name: sourceForTable.name });
          console.log('➕ Adding new target equipment:', { id: updatedTargetEquipment.id, name: updatedTargetEquipment.name, slot: targetSlot });
        }
      }
      
      console.log('📝 About to update character equipment. Character ID:', selectedCharacter.id);
      console.log('📝 Updated equipment items:', updatedEquipment.filter(eq => eq.id === sourceEquipment.id || eq.id === targetEquipment.id));
      updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
      console.log('✅ Equipment update completed');
    } else {
      console.log('❌ No selectedCharacter found!');
    }

    // Then call the transfer callback if available (for additional processing like toasts)
    if (onTransfer) {
      console.log('📞 Calling onTransfer callback');
      onTransfer(sourceForTable, updatedTargetEquipment);
    } else {
      console.log('⚠️ No onTransfer callback provided');
    }
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
    // Same slot requirement
    if (sourceEquipment.slot !== targetEquipment.slot) {
      return { canTransfer: false, reason: 'Equipment must be in the same slot' };
    }
    
    // Target level must be within 10 levels ABOVE the source (can only transfer up)
    const levelDiff = targetEquipment.level - sourceEquipment.level;
    if (levelDiff < 0 || levelDiff > 10) {
      return { canTransfer: false, reason: 'Target level must be within 10 levels above source level' };
    }
    
    // Source must have StarForce target and be starforceable
    if (!sourceEquipment.starforceable || (sourceEquipment.targetStarForce || 0) === 0) {
      return { canTransfer: false, reason: 'Source equipment must have target StarForce and be starforceable' };
    }
    
    // Target must be starforceable
    if (!targetEquipment.starforceable) {
      return { canTransfer: false, reason: 'Target equipment must be starforceable' };
    }
    
    // Can't transfer to the same equipment (check by ID, name, and level)
    if (sourceEquipment.id === targetEquipment.id) {
      return { canTransfer: false, reason: 'Cannot transfer to the same equipment' };
    }
    if (sourceEquipment.name === targetEquipment.name && sourceEquipment.level === targetEquipment.level) {
      return { canTransfer: false, reason: 'Cannot transfer to identical equipment' };
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
    clearEquipmentSlot,
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

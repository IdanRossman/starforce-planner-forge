import { useCallback } from 'react';
import { Equipment } from '../../types';

// Type for objects that have the necessary properties for star force adjustments
interface StarForceAdjustable {
  id: string;
  currentStarForce?: number;
  targetStarForce?: number;
}

interface UseEquipmentManagementProps {
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onUpdateSafeguard?: (equipmentId: string, safeguard: boolean) => void;
}

interface UseEquipmentManagementReturn {
  handleQuickAdjust: (equipment: StarForceAdjustable, type: 'current' | 'target', delta: number) => void;
  handleBulkStarforceUpdate: (equipmentId: string, current: number, target: number) => void;
  handleActualCostUpdate: (equipmentId: string, actualCost: number) => void;
  handleSafeguardUpdate: (equipmentId: string, safeguard: boolean) => void;
}

/**
 * Hook for managing equipment modifications (star force, costs, etc.)
 * These operations modify the character's equipment data, not calculator settings
 */
export function useEquipmentManagement({
  onUpdateStarforce,
  onUpdateActualCost,
  onUpdateSafeguard
}: UseEquipmentManagementProps): UseEquipmentManagementReturn {

  const handleQuickAdjust = useCallback((equipment: StarForceAdjustable, type: 'current' | 'target', delta: number) => {
    if (!onUpdateStarforce) return;
    
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    
    if (type === 'current') {
      const newCurrent = Math.max(0, Math.min(25, current + delta));
      onUpdateStarforce(equipment.id, newCurrent, target);
    } else {
      const newTarget = Math.max(0, Math.min(25, target + delta));
      onUpdateStarforce(equipment.id, current, newTarget);
    }
  }, [onUpdateStarforce]);

  const handleBulkStarforceUpdate = useCallback((equipmentId: string, current: number, target: number) => {
    if (!onUpdateStarforce) return;
    onUpdateStarforce(equipmentId, current, target);
  }, [onUpdateStarforce]);

  const handleActualCostUpdate = useCallback((equipmentId: string, actualCost: number) => {
    if (!onUpdateActualCost) return;
    onUpdateActualCost(equipmentId, actualCost);
  }, [onUpdateActualCost]);

  const handleSafeguardUpdate = useCallback((equipmentId: string, safeguard: boolean) => {
    if (!onUpdateSafeguard) return;
    onUpdateSafeguard(equipmentId, safeguard);
  }, [onUpdateSafeguard]);

  return {
    handleQuickAdjust,
    handleBulkStarforceUpdate,
    handleActualCostUpdate,
    handleSafeguardUpdate
  };
}

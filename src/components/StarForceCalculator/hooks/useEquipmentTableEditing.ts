import { useState, useCallback } from 'react';

// Simple editing state that complements existing hooks
export interface EquipmentTableEditingState {
  editingStarforce: string | null;
  editingActualCost: string | null;
  tempValues: { current: number; target: number };
  tempActualCost: number;
  hoveredRow: string | null;
}

/**
 * Hook for managing table editing UI state
 * This complements the existing useStarForceItemSettings hook
 * by handling temporary editing states that don't need persistence
 */
export function useEquipmentTableEditing() {
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [editingActualCost, setEditingActualCost] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [tempActualCost, setTempActualCost] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const startEditStarforce = useCallback((equipmentId: string, current: number, target: number) => {
    setEditingStarforce(equipmentId);
    setTempValues({ current, target });
  }, []);

  const startEditActualCost = useCallback((equipmentId: string, actualCost: number) => {
    setEditingActualCost(equipmentId);
    setTempActualCost(actualCost);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingStarforce(null);
    setEditingActualCost(null);
    setTempValues({ current: 0, target: 0 });
    setTempActualCost(0);
  }, []);

  const cancelStarforceEdit = useCallback(() => {
    setEditingStarforce(null);
    setTempValues({ current: 0, target: 0 });
  }, []);

  const cancelActualCostEdit = useCallback(() => {
    setEditingActualCost(null);
    setTempActualCost(0);
  }, []);

  return {
    // State
    state: {
      editingStarforce,
      editingActualCost,
      tempValues,
      tempActualCost,
      hoveredRow
    },
    
    // Actions
    actions: {
      startEditStarforce,
      startEditActualCost,
      setTempValues,
      setTempActualCost,
      setHoveredRow,
      cancelEdit,
      cancelStarforceEdit,
      cancelActualCostEdit
    },
    
    // Helpers
    isEditingStarforce: (equipmentId: string) => editingStarforce === equipmentId,
    isEditingActualCost: (equipmentId: string) => editingActualCost === equipmentId,
    isEditing: (equipmentId: string) => editingStarforce === equipmentId || editingActualCost === equipmentId,
    isHovered: (equipmentId: string) => hoveredRow === equipmentId
  };
}

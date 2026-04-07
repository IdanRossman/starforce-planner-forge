import React, { useEffect } from 'react';
import { Equipment } from '@/types';
import { CategorizedSelect, SelectCategory, FormFieldWrapper } from '@/components/shared/forms';
import { usePotentialManagement } from '@/hooks/game/usePotentialManagement';

interface SimplePotentialConfigurationSectionProps {
  // Potential state
  currentPotentialValue: string;
  setCurrentPotentialValue: (value: string) => void;
  targetPotentialValue: string;
  setTargetPotentialValue: (value: string) => void;
  
  // Equipment context
  equipment?: Equipment;
  // Fallback values for API calls when equipment is temporarily unavailable
  equipmentType?: string;
  equipmentLevel?: number;
}

/**
 * Simplified component for handling potential configuration with inline current/target
 */
export function SimplePotentialConfigurationSection({
  currentPotentialValue,
  setCurrentPotentialValue,
  targetPotentialValue,
  setTargetPotentialValue,
  equipment,
  equipmentType,
  equipmentLevel
}: SimplePotentialConfigurationSectionProps) {
  
  // Use the potential management hook
  const {
    availableCategories,
    isLoading,
    error,
    fetchPotentialLines,
    clearError
  } = usePotentialManagement();

  // Fetch potential lines when equipment changes
  useEffect(() => {
    // Use specific equipment type for API calls (e.g., "belt", "hat", "weapon")
    // Prioritize form data since it's always up-to-date
    const type = equipmentType || equipment?.type;
    const level = equipmentLevel || equipment?.level; // Prioritize form level over equipment level
    
    console.log('useEffect triggered - equipment change:', {
      hasEquipment: !!equipment,
      equipmentType: equipment?.type,
      equipmentLevel: equipment?.level,
      fallbackType: equipmentType,
      fallbackLevel: equipmentLevel,
      finalType: type,
      finalLevel: level,
      name: equipment?.name,
      willMakeAPICall: !!(type && level)
    });
    
    if (type && level) {
      console.log('Making API call for potential lines with:', { type, level });
      fetchPotentialLines(type, level);
    } else {
      console.log('Skipping API call - missing type or level');
    }
  }, [equipment, equipmentType, equipmentLevel, fetchPotentialLines]);

  // Set potential values after options are loaded and match with existing equipment values
  useEffect(() => {
    if (availableCategories.length > 0 && equipment) {
      // Find all available options across categories
      const allOptions = availableCategories.flatMap(category => category.options);
      
      // If equipment has existing potential values, find and set them
      if (equipment.currentPotentialValue) {
        const matchingCurrentOption = allOptions.find(option => 
          option.displayText === equipment.currentPotentialValue
        );
        if (matchingCurrentOption) {
          setCurrentPotentialValue(matchingCurrentOption.displayText);
        }
      }
      
      if (equipment.targetPotentialValue) {
        const matchingTargetOption = allOptions.find(option => 
          option.displayText === equipment.targetPotentialValue
        );
        if (matchingTargetOption) {
          setTargetPotentialValue(matchingTargetOption.displayText);
        }
      }
    }
  }, [availableCategories, equipment, setCurrentPotentialValue, setTargetPotentialValue]);

  // Transform API response into select categories format
  const getPotentialCategories: SelectCategory[] = availableCategories.map(category => ({
    name: category.label,
    options: category.options.map(option => ({
      value: option.displayText, // Use displayText as value so it gets saved
      label: option.displayText  // Show displayText as label
    }))
  }));
  
  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
          <p className="font-maplestory text-xs text-white/40">Loading potential options…</p>
        </div>
      )}
      {error && (
        <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-400/20">
          <p className="font-maplestory text-xs text-red-400">{error}</p>
          <button onClick={clearError} className="text-red-400/60 underline text-[10px] mt-1">Clear</button>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide mb-1">Current</p>
          <CategorizedSelect
            value={currentPotentialValue}
            onValueChange={setCurrentPotentialValue}
            placeholder={isLoading ? "Loading…" : "Select current"}
            categories={getPotentialCategories}
            className="bg-white/8 border-white/15 font-maplestory w-full"
            variant="dark"
            disabled={isLoading || getPotentialCategories.length === 0}
          />
        </div>
        <div>
          <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide mb-1">Target</p>
          <CategorizedSelect
            value={targetPotentialValue}
            onValueChange={setTargetPotentialValue}
            placeholder={isLoading ? "Loading…" : "Select target"}
            categories={getPotentialCategories}
            className="bg-white/8 border-white/15 font-maplestory w-full"
            variant="dark"
            disabled={isLoading || getPotentialCategories.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

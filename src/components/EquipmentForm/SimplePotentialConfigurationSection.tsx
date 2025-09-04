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
}

/**
 * Simplified component for handling potential configuration with inline current/target
 */
export function SimplePotentialConfigurationSection({
  currentPotentialValue,
  setCurrentPotentialValue,
  targetPotentialValue,
  setTargetPotentialValue,
  equipment
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
    if (equipment?.type && equipment?.level) {
      fetchPotentialLines(equipment.type, equipment.level);
    }
  }, [equipment?.type, equipment?.level, fetchPotentialLines]);

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
      {/* Loading State */}
      {isLoading && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-maplestory text-sm text-blue-800">
            Loading potential options...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="font-maplestory text-sm text-red-800">
            Error: {error}
          </p>
          <button 
            onClick={clearError}
            className="text-red-600 underline text-xs mt-1"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* Current and Target Potential - Inline */}
      <div className="grid grid-cols-2 gap-4">
        <FormFieldWrapper
          name="currentPotential"
          label="Current Potential"
          control={undefined}
        >
          {() => (
            <CategorizedSelect
              value={currentPotentialValue}
              onValueChange={setCurrentPotentialValue}
              placeholder={isLoading ? "Loading..." : "Select current potential"}
              categories={getPotentialCategories}
              className="bg-white border-purple-300 font-maplestory w-full"
              disabled={isLoading || getPotentialCategories.length === 0}
            />
          )}
        </FormFieldWrapper>

        <FormFieldWrapper
          name="targetPotential"
          label="Target Potential"
          control={undefined}
        >
          {() => (
            <CategorizedSelect
              value={targetPotentialValue}
              onValueChange={setTargetPotentialValue}
              placeholder={isLoading ? "Loading..." : "Select target potential"}
              categories={getPotentialCategories}
              className="bg-white border-purple-300 font-maplestory w-full"
              disabled={isLoading || getPotentialCategories.length === 0}
            />
          )}
        </FormFieldWrapper>
      </div>
    </div>
  );
}

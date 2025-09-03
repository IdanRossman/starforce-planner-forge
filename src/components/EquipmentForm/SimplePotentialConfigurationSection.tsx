import React from 'react';
import { Equipment } from '@/types';
import { CategorizedSelect, SelectCategory, FormFieldWrapper } from '@/components/shared/forms';

interface SimplePotentialConfigurationSectionProps {
  // Potential state
  currentPotentialValue: string;
  setCurrentPotentialValue: (value: string) => void;
  targetPotentialValue: string;
  setTargetPotentialValue: (value: string) => void;
  
  // Potential categories from hook
  getPotentialCategories: SelectCategory[];
  
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
  getPotentialCategories,
  equipment
}: SimplePotentialConfigurationSectionProps) {
  
  return (
    <div className="space-y-4">
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
              placeholder="Select current potential"
              categories={getPotentialCategories}
              className="bg-white border-purple-300 font-maplestory w-full"
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
              placeholder="Select target potential"
              categories={getPotentialCategories}
              className="bg-white border-purple-300 font-maplestory w-full"
            />
          )}
        </FormFieldWrapper>
      </div>

      {/* Potential Progress Info */}
      {currentPotentialValue && targetPotentialValue && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="font-maplestory text-sm text-purple-800">
            <span className="font-medium">Potential Goal:</span> {currentPotentialValue} → {targetPotentialValue}
          </p>
        </div>
      )}
    </div>
  );
}

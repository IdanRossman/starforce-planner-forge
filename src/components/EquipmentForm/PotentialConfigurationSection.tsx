import { Equipment } from '@/types';
import { CategorizedSelect, SelectCategory } from '@/components/shared/forms';

interface PotentialConfigurationSectionProps {
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
 * Component for handling potential configuration
 * Includes current and target potential selection
 */
export function PotentialConfigurationSection({
  currentPotentialValue,
  setCurrentPotentialValue,
  targetPotentialValue,
  setTargetPotentialValue,
  getPotentialCategories,
  equipment
}: PotentialConfigurationSectionProps) {
  
  return (
    <>
      {/* Current Potential */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 font-maplestory">
          Current Potential
        </label>
        <CategorizedSelect
          value={currentPotentialValue || "none"}
          onValueChange={(value) => {
            if (value === "none") {
              setCurrentPotentialValue('');
            } else {
              setCurrentPotentialValue(value);
            }
          }}
          placeholder="Select current potential"
          categories={[
            {
              name: 'No Potential',
              options: [{ value: 'none', label: 'No current potential' }]
            },
            ...getPotentialCategories
          ]}
          className="bg-white border-gray-300 font-maplestory w-full"
        />
      </div>

      {/* Target Potential */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 font-maplestory">
          Target Potential
        </label>
        <CategorizedSelect
          value={targetPotentialValue || "none"}
          onValueChange={(value) => {
            if (value === "none") {
              setTargetPotentialValue('');
            } else {
              setTargetPotentialValue(value);
            }
          }}
          placeholder="Select target potential"
          categories={[
            {
              name: 'No Target',
              options: [{ value: 'none', label: 'No target potential' }]
            },
            ...getPotentialCategories
          ]}
          className="bg-white border-gray-300 font-maplestory w-full"
        />
      </div>
    </>
  );
}

import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/types';
import { ToggleField, StarForceSliderField } from '@/components/shared/forms';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { Info } from 'lucide-react';
import type { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';

interface StarForceConfigurationSectionProps {
  // Watch values from form
  watchStarforceable: boolean;
  watchLevel: number;
  
  // Auto-adjustment state
  autoAdjusted: { current?: boolean; target?: boolean };
  
  // Equipment context
  equipment?: Equipment;
}

/**
 * Component for handling StarForce configuration
 * Includes starforceable toggle and star force sliders with validation
 */
export function StarForceConfigurationSection({
  watchStarforceable,
  watchLevel,
  autoAdjusted,
  equipment
}: StarForceConfigurationSectionProps) {
  const form = useFormContext<EquipmentFormData>();
  const { getMaxStars } = useStarForceUtils();

  return (
    <>
      {/* StarForce Toggle */}
      <ToggleField
        name="starforceable"
        title="StarForce Enhancement"
        description="Can this equipment be enhanced with StarForce?"
        control={form.control}
        variant="amber"
      />

      {/* StarForce Sliders - Only show if starforceable */}
      {watchStarforceable && (
        <>
          {/* Auto-adjustment notification */}
          {(autoAdjusted.current || autoAdjusted.target) && (
            <div className="p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-maplestory">
                  Star force values auto-adjusted to match level {watchLevel} limits
                  {autoAdjusted.current && autoAdjusted.target ? ' (current & target)' : 
                   autoAdjusted.current ? ' (current)' : ' (target)'}
                </span>
              </div>
            </div>
          )}

          <StarForceSliderField
            name="currentStarForce"
            title={`Current StarForce: ${form.watch('currentStarForce')}★`}
            subtitle={(() => {
              const transferredStars = equipment?.transferredStars || 0;
              const currentValue = form.watch('currentStarForce');
              
              if (transferredStars > 0) {
                return `(Min: ${transferredStars}★ from transfer, Max: ${getMaxStars(watchLevel)}★ for Lv.${watchLevel})`;
              }
              return `(Max: ${getMaxStars(watchLevel)}★ for Lv.${watchLevel})`;
            })()}
            control={form.control}
            min={equipment?.transferredStars || 0}
            max={getMaxStars(watchLevel)}
          />

          <StarForceSliderField
            name="targetStarForce"
            title={`Target StarForce: ${form.watch('targetStarForce')}★`}
            subtitle={`(Max: ${getMaxStars(watchLevel)}★ for Lv.${watchLevel})`}
            control={form.control}
            min={0}
            max={getMaxStars(watchLevel)}
          />
        </>
      )}
    </>
  );
}

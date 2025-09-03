import React, { useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { FormFieldWrapper } from '@/components/shared/forms';
import { MapleInput } from '@/components/shared/forms/MapleInput';
import { MapleButton } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react';

interface SimpleStarForceConfigurationSectionProps {
  watchStarforceable: boolean;
  watchLevel: number;
  autoAdjusted: { current?: boolean; target?: boolean };
  equipment?: Equipment;
  // Transfer functionality
  availableEquipment?: Equipment[];
  selectedSlot?: string;
  setShowTransferDialog?: (show: boolean) => void;
}

/**
 * Simplified StarForce configuration section with inline current/target inputs
 */
export function SimpleStarForceConfigurationSection({
  watchStarforceable,
  watchLevel,
  autoAdjusted,
  equipment,
  availableEquipment = [],
  selectedSlot,
  setShowTransferDialog
}: SimpleStarForceConfigurationSectionProps) {
  const form = useFormContext<EquipmentFormData>();
  const { getMaxStars } = useStarForceUtils();
  
  const maxStars = getMaxStars(watchLevel);
  const currentStars = form.watch('currentStarForce');
  const targetStars = form.watch('targetStarForce');

  // Transfer logic - calculate valid transfer options
  const transferOptions = useMemo(() => {
    if (!availableEquipment || !selectedSlot || !setShowTransferDialog) {
      return { canTransferFrom: [], canTransferTo: [] };
    }

    const currentEquipmentLevel = watchLevel;
    const currentEquipmentStarforceable = watchStarforceable;
    const currentEquipmentTargetStars = targetStars || 0;

    // Equipment we can transfer FROM this equipment TO (higher level, within 10 levels)
    const canTransferFrom = availableEquipment.filter(eq => {
      if (!eq.starforceable || eq.slot !== selectedSlot) return false;
      const levelDiff = eq.level - currentEquipmentLevel;
      return levelDiff > 0 && levelDiff <= 10 && currentEquipmentStarforceable;
    });

    // Equipment we can transfer TO this equipment FROM (lower level, within 10 levels)
    const canTransferTo = availableEquipment.filter(eq => {
      if (!eq.starforceable || eq.slot !== selectedSlot) return false;
      const levelDiff = currentEquipmentLevel - eq.level;
      return levelDiff > 0 && levelDiff <= 10;
    });

    return { canTransferFrom, canTransferTo };
  }, [availableEquipment, selectedSlot, watchLevel, watchStarforceable, targetStars, setShowTransferDialog]);

  const hasTransferOptions = transferOptions.canTransferFrom.length > 0; // Temporarily disabled canTransferTo

  // Auto-adjust target stars when current stars is set higher than target (including when target is 0)
  useEffect(() => {
    if (currentStars && (targetStars === 0 || currentStars > targetStars)) {
      // Set target to current + 2, but minimum 1, and not exceeding max
      const newTarget = Math.max(1, Math.min(currentStars + 2, maxStars));
      form.setValue('targetStarForce', newTarget, { shouldValidate: true });
    }
  }, [currentStars, targetStars, maxStars, form]);

  if (!watchStarforceable) {
    return (
      <div className="space-y-4 opacity-60">
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-maplestory text-sm text-gray-600 mb-4">
            This equipment cannot be enhanced with StarForce
          </p>
          
          {/* Disabled Current and Target StarForce Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormFieldWrapper
                name="currentStarForce"
                label="Current Stars"
                control={form.control}
              >
                {() => (
                  <MapleInput
                    type="number"
                    disabled
                    value={0}
                    className="font-maplestory bg-gray-100 text-center"
                  />
                )}
              </FormFieldWrapper>
            </div>

            <div>
              <FormFieldWrapper
                name="targetStarForce"
                label="Target Stars"
                control={form.control}
              >
                {() => (
                  <MapleInput
                    type="number"
                    disabled
                    value={0}
                    className="font-maplestory bg-gray-100 text-center"
                  />
                )}
              </FormFieldWrapper>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current and Target StarForce - Inline */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <FormFieldWrapper
            name="currentStarForce"
            label="Current Stars"
            control={form.control}
          >
            {(field) => (
              <MapleInput
                type="number"
                min={0}
                max={maxStars}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                className="font-maplestory text-center"
                value={field.value || 0}
              />
            )}
          </FormFieldWrapper>
          {/* Quick Select Current Buttons */}
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {[0, 15, 17, 19, 21, 22].filter(stars => stars <= maxStars).map(stars => (
              <button
                key={stars}
                type="button"
                onClick={() => {
                  form.setValue('currentStarForce', stars, { shouldValidate: true });
                }}
                className={`px-2 py-1 text-xs font-maplestory rounded border transition-colors ${
                  currentStars === stars
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                }`}
              >
                {stars}★
              </button>
            ))}
          </div>
          {autoAdjusted.current && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-800 text-xs font-maplestory"
            >
              Auto-adjusted
            </Badge>
          )}
        </div>

        <div className="relative">
          <FormFieldWrapper
            name="targetStarForce"
            label="Target Stars"
            control={form.control}
          >
            {(field) => (
              <MapleInput
                type="number"
                min={Math.max(1, currentStars || 0)}
                max={maxStars}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                className="font-maplestory text-center"
                value={field.value || 1}
              />
            )}
          </FormFieldWrapper>
          {/* Quick Select Target Buttons */}
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {[15, 17, 19, 21, 22].filter(stars => stars <= maxStars).map(stars => (
              <button
                key={stars}
                type="button"
                onClick={() => {
                  form.setValue('targetStarForce', stars, { shouldValidate: true });
                }}
                className={`px-2 py-1 text-xs font-maplestory rounded border transition-colors ${
                  targetStars === stars
                    ? 'bg-yellow-500 text-white border-yellow-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50 hover:border-yellow-400'
                }`}
              >
                {stars}★
              </button>
            ))}
          </div>
          {autoAdjusted.target && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-800 text-xs font-maplestory"
            >
              Auto-adjusted
            </Badge>
          )}
        </div>
      </div>

      {/* Transfer Options - Only show when relevant */}
      {hasTransferOptions && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            <span className="font-maplestory text-sm font-medium text-blue-800">
              Transfer Options
            </span>
          </div>
          
          <div className="space-y-2">
            {/* Transfer FROM this equipment (to higher level) */}
            {transferOptions.canTransferFrom.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-maplestory text-gray-700">
                    Transfer FROM this → {transferOptions.canTransferFrom.length} higher level item(s)
                  </span>
                </div>
                <MapleButton
                  variant="blue"
                  size="sm"
                  type="button"
                  onClick={() => setShowTransferDialog?.(true)}
                >
                  Transfer Out
                </MapleButton>
              </div>
            )}

            {/* Transfer TO this equipment (from lower level) - TEMPORARILY DISABLED */}
            {/* 
            {transferOptions.canTransferTo.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-maplestory text-gray-700">
                    Transfer TO this ← {transferOptions.canTransferTo.length} lower level item(s)
                  </span>
                </div>
                <MapleButton
                  variant="orange"
                  size="sm"
                  type="button"
                  onClick={() => setShowTransferDialog?.(true)}
                >
                  Transfer In
                </MapleButton>
              </div>
            )}
            */}
          </div>
        </div>
      )}
    </div>
  );
}

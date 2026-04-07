import React, { useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { FormFieldWrapper } from '@/components/shared/forms';
import { MapleInput } from '@/components/shared/forms/MapleInput';
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
      <div className="py-3 text-center">
        <p className="font-maplestory text-xs text-white/30">Not starforceable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current and Target StarForce - Inline */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide">Current</p>
          <FormFieldWrapper
            name="currentStarForce"
            label="Current Stars"
            control={form.control}
            hideLabel
          >
            {(field) => (
              <MapleInput
                type="number"
                min={0}
                max={maxStars}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                className="font-maplestory text-center !border-white/15 !text-white h-9 [&]:bg-transparent"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                value={field.value || 0}
              />
            )}
          </FormFieldWrapper>
          <div className="flex flex-wrap gap-1">
            {[0, 15, 17, 19, 21, 22].filter(stars => stars <= maxStars).map(stars => (
              <button
                key={stars}
                type="button"
                onClick={() => form.setValue('currentStarForce', stars, { shouldValidate: true })}
                className={`px-1.5 py-0.5 text-[10px] font-maplestory rounded border transition-colors ${
                  currentStars === stars
                    ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {stars}★
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide">Target</p>
          <FormFieldWrapper
            name="targetStarForce"
            label="Target Stars"
            control={form.control}
            hideLabel
          >
            {(field) => (
              <MapleInput
                type="number"
                min={Math.max(1, currentStars || 0)}
                max={maxStars}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                className="font-maplestory text-center !border-white/15 !text-white h-9"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                value={field.value || 1}
              />
            )}
          </FormFieldWrapper>
          <div className="flex flex-wrap gap-1">
            {[15, 17, 19, 21, 22].filter(stars => stars <= maxStars).map(stars => (
              <button
                key={stars}
                type="button"
                onClick={() => form.setValue('targetStarForce', stars, { shouldValidate: true })}
                className={`px-1.5 py-0.5 text-[10px] font-maplestory rounded border transition-colors ${
                  targetStars === stars
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {stars}★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Options - Only show when relevant */}
      {hasTransferOptions && (
        <div className="mt-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-white/40" />
            <span className="font-maplestory text-xs font-medium text-white/60">
              Transfer Options
            </span>
          </div>

          <div className="space-y-1.5">
            {transferOptions.canTransferFrom.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-maplestory text-white/50">
                    {transferOptions.canTransferFrom.length} higher level item(s)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferDialog?.(true)}
                  className="px-2.5 py-1 text-[10px] font-maplestory rounded border border-primary/30 bg-primary/15 text-primary hover:bg-primary/25 hover:border-primary/50 transition-colors"
                >
                  Transfer Out
                </button>
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

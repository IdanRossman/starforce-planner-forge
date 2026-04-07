import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EquipmentSelectionSection } from './EquipmentSelectionSection';
import { SimpleStarForceConfigurationSection } from './SimpleStarForceConfigurationSection';
import { SimplePotentialConfigurationSection } from './SimplePotentialConfigurationSection';
import { SelectCategory } from '@/components/shared/forms';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { 
  Sparkles, 
  Star, 
  Settings2
} from 'lucide-react';

interface SlimEquipmentFormCardsProps {
  form: UseFormReturn<EquipmentFormData>;
  equipment?: Equipment;
  isEditing: boolean;
  
  // Equipment Selection props
  slotCategories: SelectCategory[];
  allowSlotEdit: boolean;
  storageMode?: boolean;
  defaultSlot?: string;
  availableEquipment: Equipment[];
  equipmentLoading: boolean;
  equipmentSource: 'api' | 'local';
  selectedSlot: string;
  selectedEquipmentImage: string;
  setSelectedEquipmentImage: (image: string) => void;
  
  // Potential props
  currentPotentialValue: string;
  setCurrentPotentialValue: (value: string) => void;
  targetPotentialValue: string;
  setTargetPotentialValue: (value: string) => void;
  
  // StarForce props
  watchStarforceable: boolean;
  watchLevel: number;
  autoAdjusted: { current?: boolean; target?: boolean };
  
  // Transfer props
  hasValidTransferCandidates: boolean;
  currentEquipmentForTransfer: Equipment | null;
  setShowTransferDialog: (show: boolean) => void;
}

export function SlimEquipmentFormCards({
  form,
  equipment,
  isEditing,
  slotCategories,
  allowSlotEdit,
  storageMode = false,
  defaultSlot,
  availableEquipment,
  equipmentLoading,
  equipmentSource,
  selectedSlot,
  selectedEquipmentImage,
  setSelectedEquipmentImage,
  currentPotentialValue,
  setCurrentPotentialValue,
  targetPotentialValue,
  setTargetPotentialValue,
  watchStarforceable,
  watchLevel,
  autoAdjusted,
  hasValidTransferCandidates,
  currentEquipmentForTransfer,
  setShowTransferDialog
}: SlimEquipmentFormCardsProps) {
  const { getMaxStars } = useStarForceUtils();
  const hasStarForceCapability = watchStarforceable && watchLevel >= 95;
  const maxStars = watchLevel ? getMaxStars(watchLevel) : 30;
  
  // Watch for equipment selection to conditionally show sections
  const selectedEquipmentSet = form.watch('set');
  const isEquipmentSelected = !!selectedEquipmentSet;

  return (
    <div className="space-y-3">
      {/* Equipment Selection */}
      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="pb-1.5 pt-3 px-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-3.5 w-3.5 text-white/40" />
            <CardTitle className="text-xs font-maplestory text-white/60 uppercase tracking-wide">Equipment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <EquipmentSelectionSection
            slotCategories={slotCategories}
            allowSlotEdit={allowSlotEdit}
            storageMode={storageMode}
            defaultSlot={defaultSlot}
            isEditing={isEditing}
            availableEquipment={availableEquipment}
            equipmentLoading={equipmentLoading}
            equipmentSource={equipmentSource}
            selectedSlot={selectedSlot}
            selectedEquipmentImage={selectedEquipmentImage}
            setSelectedEquipmentImage={setSelectedEquipmentImage}
          />
        </CardContent>
      </Card>

      {/* StarForce + Potential side by side */}
      {isEquipmentSelected && (
        <div className="grid grid-cols-2 gap-3">
          {/* StarForce */}
          <Card className={`border ${hasStarForceCapability ? 'border-yellow-400/20 bg-yellow-400/5' : 'border-white/8 bg-white/3'}`}>
            <CardHeader className="pb-1.5 pt-3 px-3">
              <div className="flex items-center gap-2">
                <Star className={`h-3.5 w-3.5 ${hasStarForceCapability ? 'text-yellow-400' : 'text-white/20'}`} />
                <CardTitle className={`text-xs font-maplestory uppercase tracking-wide ${hasStarForceCapability ? 'text-yellow-400/70' : 'text-white/30'}`}>
                  StarForce
                </CardTitle>
                {hasStarForceCapability && (
                  <span className="text-[10px] text-yellow-400/50 font-maplestory ml-auto">Max {maxStars}★</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <SimpleStarForceConfigurationSection
                watchStarforceable={watchStarforceable}
                watchLevel={watchLevel}
                autoAdjusted={autoAdjusted}
                equipment={equipment}
                availableEquipment={availableEquipment}
                selectedSlot={selectedSlot}
                setShowTransferDialog={setShowTransferDialog}
              />
            </CardContent>
          </Card>

          {/* Potential */}
          <Card className="border border-purple-400/20 bg-purple-400/5">
            <CardHeader className="pb-1.5 pt-3 px-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <CardTitle className="text-xs font-maplestory text-purple-400/70 uppercase tracking-wide">Potential</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <SimplePotentialConfigurationSection
                currentPotentialValue={currentPotentialValue}
                setCurrentPotentialValue={setCurrentPotentialValue}
                targetPotentialValue={targetPotentialValue}
                setTargetPotentialValue={setTargetPotentialValue}
                equipment={equipment}
                equipmentType={form.watch('type')}
                equipmentLevel={form.watch('level')}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

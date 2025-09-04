import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EquipmentSelectionSection } from './EquipmentSelectionSection';
import { SimpleStarForceConfigurationSection } from './SimpleStarForceConfigurationSection';
import { SimplePotentialConfigurationSection } from './SimplePotentialConfigurationSection';
import { TransferActionsSection } from './TransferActionsSection';
import { SelectCategory } from '@/components/shared/forms';

interface CompactEquipmentFormProps {
  form: UseFormReturn<EquipmentFormData>;
  equipment?: Equipment;
  isEditing: boolean;
  
  // Equipment Selection props
  slotCategories: SelectCategory[];
  allowSlotEdit: boolean;
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

export function CompactEquipmentForm({
  form,
  equipment,
  isEditing,
  slotCategories,
  allowSlotEdit,
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
}: CompactEquipmentFormProps) {
  const hasStarForceCapability = watchStarforceable && watchLevel >= 95;

  return (
    <div className="space-y-6 p-1">
      {/* Equipment Selection - Compact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 font-maplestory">Equipment</h3>
          {equipmentSource === 'api' && (
            <Badge variant="outline" className="text-xs">API Data</Badge>
          )}
        </div>
        <EquipmentSelectionSection
          slotCategories={slotCategories}
          allowSlotEdit={allowSlotEdit}
          defaultSlot={defaultSlot}
          isEditing={isEditing}
          availableEquipment={availableEquipment}
          equipmentLoading={equipmentLoading}
          equipmentSource={equipmentSource}
          selectedSlot={selectedSlot}
          selectedEquipmentImage={selectedEquipmentImage}
          setSelectedEquipmentImage={setSelectedEquipmentImage}
        />
      </div>

      <Separator className="my-4" />

      {/* StarForce Enhancement - Compact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 font-maplestory">StarForce</h3>
          {!hasStarForceCapability && (
            <Badge variant="secondary" className="text-xs">Not Available</Badge>
          )}
          {autoAdjusted.current && (
            <Badge variant="outline" className="text-xs text-yellow-600">Auto-adjusted</Badge>
          )}
        </div>
        <SimpleStarForceConfigurationSection
          watchStarforceable={watchStarforceable}
          watchLevel={watchLevel}
          autoAdjusted={autoAdjusted}
          equipment={equipment}
        />
      </div>

      <Separator className="my-4" />

      {/* Potential Configuration - Compact */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 font-maplestory">Potential</h3>
        <SimplePotentialConfigurationSection
          currentPotentialValue={currentPotentialValue}
          setCurrentPotentialValue={setCurrentPotentialValue}
          targetPotentialValue={targetPotentialValue}
          setTargetPotentialValue={setTargetPotentialValue}
          equipment={equipment}
          equipmentType={form.watch('type')}
          equipmentLevel={form.watch('level')}
        />
      </div>

      {/* Transfer Actions - Only show if transfer candidates exist */}
      {hasValidTransferCandidates && (
        <>
          <Separator className="my-4" />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 font-maplestory">Transfer</h3>
            <TransferActionsSection
              currentEquipmentForTransfer={currentEquipmentForTransfer}
              hasValidTransferCandidates={hasValidTransferCandidates}
              setShowTransferDialog={setShowTransferDialog}
              isEditing={isEditing}
            />
          </div>
        </>
      )}
    </div>
  );
}

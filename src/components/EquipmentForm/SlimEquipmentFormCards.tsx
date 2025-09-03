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
  getPotentialCategories: SelectCategory[];
  
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
  getPotentialCategories,
  watchStarforceable,
  watchLevel,
  autoAdjusted,
  hasValidTransferCandidates,
  currentEquipmentForTransfer,
  setShowTransferDialog
}: SlimEquipmentFormCardsProps) {
  const { getMaxStars } = useStarForceUtils();
  const hasStarForceCapability = watchStarforceable && watchLevel >= 95;
  const maxStars = watchLevel ? getMaxStars(watchLevel) : 25;
  
  // Watch for equipment selection to conditionally show sections
  const selectedEquipmentSet = form.watch('set');
  const isEquipmentSelected = !!selectedEquipmentSet;

  return (
    <div className="space-y-4">
      {/* Equipment Selection Card - Minimal */}
      <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-maplestory text-blue-900">Equipment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

      {/* StarForce Card - Slim - Only show when equipment is selected */}
      {isEquipmentSelected && (
        <Card className={`border-2 ${
          hasStarForceCapability 
            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${
                hasStarForceCapability ? 'text-yellow-600' : 'text-gray-400'
              }`} />
              <CardTitle className={`text-sm font-maplestory ${
                hasStarForceCapability ? 'text-yellow-900' : 'text-gray-600'
              }`}>
                StarForce
              </CardTitle>
              {hasStarForceCapability && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 font-maplestory">
                  Max: {maxStars}★
                </Badge>
              )}
              {!hasStarForceCapability && (
                <Badge variant="secondary" className="text-xs">Not Available</Badge>
              )}
              {autoAdjusted.current && (
                <Badge variant="outline" className="text-xs text-yellow-600">Auto-adjusted</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
      )}

      {/* Potential Card - Slim - Only show when equipment is selected */}
      {isEquipmentSelected && (
        <Card className="border-2 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-maplestory text-purple-900">Potential</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <SimplePotentialConfigurationSection
              currentPotentialValue={currentPotentialValue}
              setCurrentPotentialValue={setCurrentPotentialValue}
              targetPotentialValue={targetPotentialValue}
              setTargetPotentialValue={setTargetPotentialValue}
              getPotentialCategories={getPotentialCategories}
              equipment={equipment}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

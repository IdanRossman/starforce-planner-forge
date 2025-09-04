import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EquipmentSelectionSection } from './EquipmentSelectionSection';
import { SimpleStarForceConfigurationSection } from './SimpleStarForceConfigurationSection';
import { SimplePotentialConfigurationSection } from './SimplePotentialConfigurationSection';
import { TransferActionsSection } from './TransferActionsSection';
import { SelectCategory } from '@/components/shared/forms';
import { 
  Sparkles, 
  Star, 
  ArrowRightLeft, 
  Settings2,
  Image as ImageIcon
} from 'lucide-react';

interface EquipmentFormCardsProps {
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

/**
 * Card-based layout for equipment form with better organization and visual hierarchy
 */
export function EquipmentFormCards({
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
}: EquipmentFormCardsProps) {
  const watchedValues = form.watch();
  const starforceable = watchedValues.starforceable ?? false;
  const hasStarForceCapability = starforceable;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Full-width Equipment Selection at Top */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-maplestory text-blue-900">
                Equipment Selection
              </CardTitle>
              <CardDescription className="font-maplestory text-blue-700">
                Choose your equipment and configure basic settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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

      {/* StarForce Configuration Card - Full Width */}
      <Card className={`border-2 transition-all duration-200 ${
        hasStarForceCapability 
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-md' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              hasStarForceCapability 
                ? 'bg-yellow-100' 
                : 'bg-gray-100'
            }`}>
              <Star className={`h-5 w-5 ${
                hasStarForceCapability 
                  ? 'text-yellow-600' 
                  : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-lg font-maplestory ${
                hasStarForceCapability 
                  ? 'text-yellow-900' 
                  : 'text-gray-600'
              }`}>
                StarForce Enhancement
              </CardTitle>
              <CardDescription className={`font-maplestory ${
                hasStarForceCapability 
                  ? 'text-yellow-700' 
                  : 'text-gray-500'
              }`}>
                {hasStarForceCapability 
                  ? 'Configure your StarForce enhancement goals'
                  : 'This equipment cannot be StarForced'
                }
              </CardDescription>
            </div>
            {hasStarForceCapability && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-maplestory">
                Available
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SimpleStarForceConfigurationSection
            watchStarforceable={watchStarforceable}
            watchLevel={watchLevel}
            autoAdjusted={autoAdjusted}
            equipment={equipment}
          />
        </CardContent>
      </Card>

      {/* Potential Configuration Card - Full Width */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-maplestory text-purple-900">
                Potential Configuration
              </CardTitle>
              <CardDescription className="font-maplestory text-purple-700">
                Set up potential tiers and cube planning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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

      {/* Transfer Actions Card - Full Width */}
      {hasValidTransferCandidates && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-maplestory text-green-900">
                  StarForce Transfer
                </CardTitle>
                <CardDescription className="font-maplestory text-green-700">
                  Transfer StarForce from existing equipment
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 font-maplestory">
                Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TransferActionsSection
              hasValidTransferCandidates={hasValidTransferCandidates}
              currentEquipmentForTransfer={currentEquipmentForTransfer}
              setShowTransferDialog={setShowTransferDialog}
              isEditing={isEditing}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Equipment, EquipmentType } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { EquipmentSelectionSection } from './EquipmentSelectionSection';
import { StarForceConfigurationSection } from './StarForceConfigurationSection';
import { EnhancedStarForceConfigurationSection } from './EnhancedStarForceConfigurationSection';
import { PotentialConfigurationSection } from './PotentialConfigurationSection';
import { TransferActionsSection } from './TransferActionsSection';
import { SelectCategory } from '@/components/shared/forms';
import { 
  Sparkles, 
  Star, 
  ArrowRightLeft, 
  Zap,
  Settings2,
  Target
} from 'lucide-react';

interface EquipmentFormAccordionProps {
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
  getPotentialCategories: () => SelectCategory[];
  
  // StarForce props
  watchStarforceable: boolean;
  watchLevel: number;
  watchType: EquipmentType;
  autoAdjusted: { current?: boolean; target?: boolean };
  
  // Transfer props
  currentEquipmentForTransfer?: Equipment | null;
  hasValidTransferCandidates: boolean;
  setShowTransferDialog: (show: boolean) => void;
  onTransfer?: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
}

export function EquipmentFormAccordion({
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
  watchType,
  autoAdjusted,
  currentEquipmentForTransfer,
  hasValidTransferCandidates,
  setShowTransferDialog,
  onTransfer
}: EquipmentFormAccordionProps) {
  
  // Track which sections should be expanded
  const [expandedSections, setExpandedSections] = useState<string[]>(['equipment-selection']);
  
  // Auto-expand logic based on equipment capabilities and form state
  useEffect(() => {
    const newExpanded = ['equipment-selection']; // Always keep equipment selection open
    
    // Auto-expand potential section if equipment type supports potential
    if (watchType && getPotentialCategories().length > 0) {
      newExpanded.push('potential-config');
    }
    
    // Auto-expand StarForce section if equipment is starforceable
    if (watchStarforceable) {
      newExpanded.push('starforce-config');
    }
    
    // Auto-expand transfer section if transfer candidates are available
    if (hasValidTransferCandidates && currentEquipmentForTransfer) {
      newExpanded.push('transfer-actions');
    }
    
    setExpandedSections(newExpanded);
  }, [watchType, watchStarforceable, hasValidTransferCandidates, currentEquipmentForTransfer, getPotentialCategories]);

  return (
    <div className="space-y-2">
      <Accordion 
        type="multiple" 
        value={expandedSections} 
        onValueChange={setExpandedSections}
        className="w-full space-y-2"
      >
        {/* Equipment Selection Section - Always Required */}
        <AccordionItem 
          value="equipment-selection" 
          className="border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-maplestory font-semibold text-gray-900">Equipment Selection</h3>
                <p className="text-xs text-gray-600 font-maplestory">Choose your equipment slot and item</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Required</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* Potential Configuration Section */}
        {watchType && getPotentialCategories().length > 0 && (
          <AccordionItem 
            value="potential-config" 
            className="border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-maplestory font-semibold text-gray-900">Potential Enhancement</h3>
                  <p className="text-xs text-gray-600 font-maplestory">Configure potential cubing goals</p>
                </div>
                {(currentPotentialValue || targetPotentialValue) && (
                  <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <PotentialConfigurationSection
                currentPotentialValue={currentPotentialValue}
                setCurrentPotentialValue={setCurrentPotentialValue}
                targetPotentialValue={targetPotentialValue}
                setTargetPotentialValue={setTargetPotentialValue}
                getPotentialCategories={getPotentialCategories()}
                equipment={equipment}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* StarForce Configuration Section */}
        <AccordionItem 
          value="starforce-config" 
          className="border border-yellow-200 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-left">
                <h3 className="font-maplestory font-semibold text-gray-900">StarForce Enhancement</h3>
                <p className="text-xs text-gray-600 font-maplestory">Configure StarForce enhancement goals</p>
              </div>
              {watchStarforceable && (
                <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-700">
                  <Star className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <EnhancedStarForceConfigurationSection
              watchStarforceable={watchStarforceable}
              watchLevel={watchLevel}
              autoAdjusted={autoAdjusted}
              equipment={equipment}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Transfer Actions Section */}
        {hasValidTransferCandidates && currentEquipmentForTransfer && (
          <AccordionItem 
            value="transfer-actions" 
            className="border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-maplestory font-semibold text-gray-900">StarForce Transfer</h3>
                  <p className="text-xs text-gray-600 font-maplestory">Transfer StarForce to another equipment</p>
                </div>
                <Badge variant="outline" className="ml-auto bg-green-100 text-green-700">
                  <Target className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <TransferActionsSection
                currentEquipmentForTransfer={currentEquipmentForTransfer}
                hasValidTransferCandidates={hasValidTransferCandidates}
                setShowTransferDialog={setShowTransferDialog}
                isEditing={isEditing}
                onTransfer={onTransfer}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Future: Flame Score Section */}
        <AccordionItem 
          value="flame-score" 
          className="border border-red-200 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 shadow-sm opacity-60"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="font-maplestory font-semibold text-gray-900">Flame Score Enhancement</h3>
                <p className="text-xs text-gray-600 font-maplestory">Configure additional stats and flame scores</p>
              </div>
              <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-maplestory text-sm">Flame Score enhancement coming in a future update!</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

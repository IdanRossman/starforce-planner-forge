import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { MapleDialog, MapleButton } from '@/components/shared';
import { FormFieldWrapper, CategorizedSelect, SelectCategory } from '@/components/shared/forms';
import { MapleInput } from '@/components/shared/forms/MapleInput';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';
import {
  Form,
} from '@/components/ui/form';
import { getMaxStarForce, getSlotIcon } from '@/lib/utils';

// Simplified schema since current stars are now static
const transferSchema = z.object({
  targetEquipmentId: z.string().min(1, 'Target equipment is required'),
  targetTargetStarForce: z.number().min(0),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface StarForceTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEquipment: Equipment; // This is actually the SOURCE equipment (being edited)
  existingEquipment: Equipment[];
  onTransfer: (sourceEquipment: Equipment, targetEquipment: Equipment, targetCurrentStars: number, targetTargetStars: number) => void;
}

// Helper function to check if transfer is possible
const canTransfer = (source: Equipment, target: Equipment): boolean => {
  // Same slot requirement
  if (source.slot !== target.slot) return false;
  
  // Target level must be within 10 levels ABOVE the source (can only transfer up)
  // Exclude same level items entirely
  const levelDiff = target.level - source.level;
  if (levelDiff <= 0 || levelDiff > 10) return false;
  
  // Source must have StarForce target and be starforceable
  if (!source.starforceable || source.targetStarForce === 0) return false;
  
  // Target must be starforceable
  if (!target.starforceable) return false;
  
  // Can't transfer to the same equipment (check by ID)
  if (source.id === target.id) return false;
  
  return true;
};

export function StarForceTransferDialog({ 
  open, 
  onOpenChange, 
  targetEquipment, // This is actually the SOURCE equipment (being edited)
  existingEquipment,
  onTransfer
}: StarForceTransferDialogProps) {
  // MapleDialog visibility states
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('scale(0.8)');

  // Handle dialog open/close with proper animations
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => {
        setOpacity(1);
        setTransform('scale(1)');
      }, 10);
    } else {
      setOpacity(0);
      setTransform('scale(0.8)');
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [open]);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      targetEquipmentId: '',
      targetTargetStarForce: 0,
    },
  });

  // Get valid target equipment (same slot, within 10 levels above, starforceable)
  const validTargetEquipment = useMemo(() => {
    const filtered = existingEquipment.filter(eq => canTransfer(targetEquipment, eq));
    return filtered;
  }, [existingEquipment, targetEquipment]);

  // Convert valid equipment to CategorizedSelect format
  const equipmentCategories: SelectCategory[] = useMemo(() => {
    if (validTargetEquipment.length === 0) {
      return [{
        name: "No Equipment Available",
        options: [{
          value: "__no_equipment__",
          label: "No valid equipment found for transfer",
          badges: [{ text: "Source must have StarForce enabled with target > 0", className: "text-xs bg-amber-100 text-amber-700" }]
        }]
      }];
    }

    return [{
      name: "Available Equipment",
      options: validTargetEquipment.map(equipment => ({
        value: equipment.id,
        label: `${equipment.name} (Lv.${equipment.level})`,
        icon: () => (
          <EquipmentImage 
            src={equipment.image} 
            alt={equipment.name || `Equipment ${equipment.id}`}
            size="sm"
            fallbackIcon={getSlotIcon(equipment.slot)}
          />
        )
      }))
    }];
  }, [validTargetEquipment]);

  const watchTargetEquipmentId = form.watch('targetEquipmentId');
  const selectedTargetEquipment = existingEquipment.find(eq => eq.id === watchTargetEquipmentId);

  // Calculate transfer preview with useMemo to prevent useEffect dependency issues
  const transferPreview = useMemo(() => {
    return selectedTargetEquipment ? {
      sourceCurrentStars: targetEquipment.currentStarForce,
      transferredStars: Math.max(0, targetEquipment.targetStarForce - 1), // -1 for transfer penalty
      targetMaxStars: getMaxStarForce(selectedTargetEquipment.level)
    } : null;
  }, [selectedTargetEquipment, targetEquipment.currentStarForce, targetEquipment.targetStarForce]);

  // Update target goal when source changes
  useEffect(() => {
    if (transferPreview) {
      // Set target to a reasonable default if not set
      const currentTarget = form.getValues('targetTargetStarForce');
      if (currentTarget === 0) {
        form.setValue('targetTargetStarForce', Math.min(22, transferPreview.targetMaxStars));
      }
    }
  }, [transferPreview, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        targetEquipmentId: '',
        targetTargetStarForce: 0,
      });
    }
  }, [open, form]);

  const onSubmit = (data: TransferFormData) => {
    if (!selectedTargetEquipment || !transferPreview) return;
    
    console.log('🎯 StarForceTransferDialog onSubmit called with:', {
      formData: data,
      selectedTargetEquipment: { id: selectedTargetEquipment.id, name: selectedTargetEquipment.name },
      transferPreview: { transferredStars: transferPreview.transferredStars, targetMaxStars: transferPreview.targetMaxStars },
      targetEquipment: { id: targetEquipment.id, name: targetEquipment.name }
    });
    
    // No validation needed since current stars are now static and always valid
    onTransfer(
      targetEquipment, // source equipment (being destroyed)
      selectedTargetEquipment, // target equipment (receiving stars)
      transferPreview.transferredStars, // Use the static transferred stars
      data.targetTargetStarForce
    );
    onOpenChange(false);
  };

  const SlotIcon = getSlotIcon(targetEquipment.slot);

  return (
    <MapleDialog
      isVisible={isVisible}
      opacity={opacity}
      transform={transform}
      position="center"
      minWidth="800px"
      className="max-w-6xl"
      onClose={() => onOpenChange(false)}
      bottomRightActions={
        <MapleButton 
          variant="orange" 
          size="sm" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={!selectedTargetEquipment}
        >
          Add Transfer Plan
        </MapleButton>
      }
      bottomLeftActions={undefined}
    >
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold font-maplestory text-gray-900">
              StarForce Transfer
            </h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-maplestory">
              Transfer stars from <span className="font-semibold">{targetEquipment.name}</span> to higher level equipment
            </p>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Warning when source equipment is invalid */}
            {(!targetEquipment.starforceable || targetEquipment.targetStarForce === 0) && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-700 font-maplestory">Transfer Not Available</span>
                </div>
                <p className="text-sm text-amber-700 font-maplestory">
                  Source equipment needs StarForce enabled with target stars {`>`} 0
                  {!targetEquipment.starforceable && " (StarForce disabled)"}
                  {targetEquipment.starforceable && targetEquipment.targetStarForce === 0 && " (Target is 0★)"}
                </p>
              </div>
            )}

            {/* Target Equipment Selection Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900 font-maplestory">Transfer Target</span>
              </div>
              <FormFieldWrapper
                name="targetEquipmentId"
                label=""
                control={form.control}
              >
                {(field) => (
                  <CategorizedSelect
                    value={field.value}
                    onValueChange={(value) => {
                      // Prevent selection of the "no equipment" placeholder
                      if (value !== "__no_equipment__") {
                        field.onChange(value);
                      }
                    }}
                    placeholder="Select equipment to receive stars"
                    categories={equipmentCategories}
                    className="bg-white border-gray-300 font-maplestory"
                    disabled={validTargetEquipment.length === 0}
                  />
                )}
              </FormFieldWrapper>
            </div>

            {/* Combined Transfer Preview & Goal Card - Always Visible */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-900 font-maplestory">Transfer Preview</span>
              </div>
              
              {/* Equipment Preview with Images - Full Width */}
              <div className="flex items-center justify-between mb-6">
                {/* Source Equipment */}
                <div className="flex flex-col items-center gap-3 flex-1">
                  <EquipmentImage 
                    src={targetEquipment.image} 
                    alt={targetEquipment.name || `Equipment ${targetEquipment.id}`}
                    size="lg"
                    fallbackIcon={getSlotIcon(targetEquipment.slot)}
                  />
                  <div className="text-center max-w-[200px]">
                    <div className="text-blue-700 font-maplestory text-sm">{targetEquipment.name}</div>
                    <div className="text-gray-600 text-xs font-maplestory">{targetEquipment.currentStarForce}★ → {targetEquipment.targetStarForce}★</div>
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex-shrink-0 mx-6">
                  <ArrowRight className="w-8 h-8 text-green-600" />
                </div>
                
                {/* Target Equipment */}
                <div className="flex flex-col items-center gap-3 flex-1">
                  {selectedTargetEquipment ? (
                    <>
                      <EquipmentImage 
                        src={selectedTargetEquipment.image} 
                        alt={selectedTargetEquipment.name || `Equipment ${selectedTargetEquipment.id}`}
                        size="lg"
                        fallbackIcon={getSlotIcon(selectedTargetEquipment.slot)}
                      />
                      <div className="text-center max-w-[200px]">
                        <div className="text-blue-700 font-maplestory text-sm">{selectedTargetEquipment.name}</div>
                        <div className="text-gray-600 text-xs font-maplestory">
                          {transferPreview?.transferredStars || 0}★ → {form.watch('targetTargetStarForce') || 0}★
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-maplestory">Select</span>
                      </div>
                      <div className="text-center max-w-[200px]">
                        <div className="text-gray-400 font-maplestory text-sm">Target Equipment</div>
                        <div className="text-gray-400 text-xs font-maplestory">Select equipment above</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Transfer Penalty Info - Only show when target is selected */}
              {selectedTargetEquipment && (
                <div className="mb-6 p-3 bg-green-100 rounded text-center">
                  <div className="text-xs text-green-700 font-maplestory">
                    Transfer penalty: -1 star (MapleStory mechanic)
                  </div>
                </div>
              )}

              {/* Target StarForce Goal - Only show when target is selected */}
              {selectedTargetEquipment && transferPreview && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-gray-900 font-maplestory text-sm">Set Target Goal</span>
                  </div>
                  
                  <FormFieldWrapper
                    name="targetTargetStarForce"
                    label=""
                    control={form.control}
                  >
                    {(field) => {
                      const maxStars = transferPreview.targetMaxStars;
                      const currentTargetStars = field.value;
                      return (
                        <div className="space-y-3">
                          <MapleInput
                            type="number"
                            min={Math.max(1, transferPreview.transferredStars)}
                            max={maxStars}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || transferPreview.transferredStars)}
                            className="font-maplestory text-center"
                            value={field.value}
                          />
                          {/* Quick Select Target Buttons */}
                          <div className="flex flex-wrap gap-1 justify-center">
                            {[15, 17, 19, 21, 22].filter(stars => stars <= maxStars && stars >= transferPreview.transferredStars).map(stars => (
                              <button
                                key={stars}
                                type="button"
                                onClick={() => field.onChange(stars)}
                                className={`px-2 py-1 text-xs font-maplestory rounded border transition-colors ${
                                  currentTargetStars === stars
                                    ? 'bg-yellow-500 text-white border-yellow-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50 hover:border-yellow-400'
                                }`}
                              >
                                {stars}★
                              </button>
                            ))}
                          </div>
                          <div className="text-center">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 font-maplestory">
                              Max: {maxStars}★
                            </Badge>
                          </div>
                        </div>
                      );
                    }}
                  </FormFieldWrapper>
                </div>
              )}
            </div>

            </form>
          </Form>
        </div>
      </MapleDialog>
    );
  }

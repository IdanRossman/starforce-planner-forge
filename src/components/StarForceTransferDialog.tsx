import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { MapleDialog, MapleButton } from '@/components/shared';
import { FormFieldWrapper, CategorizedSelect, SelectCategory } from '@/components/shared/forms';
import { 
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Form,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
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
      <div className="space-y-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold font-maplestory text-black mb-2">
            StarForce Transfer
          </h2>
          <p className="text-sm text-gray-700 font-maplestory">
            Plan StarForce transfer from {targetEquipment.name} to another equipment. 
            This will create two entries in your StarForce planning table with transferred stars reduced by 1.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Warning when source equipment is invalid */}
            {(!targetEquipment.starforceable || targetEquipment.targetStarForce === 0) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-700 font-maplestory">Transfer Not Available</span>
                </div>
                <p className="text-sm text-amber-700 mt-1 font-maplestory">
                  The source equipment must have StarForce enabled with a target greater than 0 to perform transfers.
                  {!targetEquipment.starforceable && " StarForce is currently disabled."}
                  {targetEquipment.starforceable && targetEquipment.targetStarForce === 0 && " Target StarForce is set to 0."}
                </p>
              </div>
            )}

            {/* Target Equipment Selection */}
            <FormFieldWrapper
              name="targetEquipmentId"
              label="Transfer Target (will receive stars)"
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
                  placeholder="Select equipment to transfer to"
                  categories={equipmentCategories}
                  className="bg-white border-gray-300 font-maplestory"
                  disabled={validTargetEquipment.length === 0}
                />
              )}
            </FormFieldWrapper>

            {/* Transfer Preview */}
            {transferPreview && (
              <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 font-maplestory">Planning Preview</span>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm font-maplestory">
                  {/* Source Equipment */}
                  <div className="flex flex-col items-center gap-2">
                    <EquipmentImage 
                      src={targetEquipment.image} 
                      alt={targetEquipment.name || `Equipment ${targetEquipment.id}`}
                      size="lg"
                      fallbackIcon={SlotIcon}
                    />
                    <div className="text-center">
                      <div className="text-blue-700">{targetEquipment.name}</div>
                      <div className="text-gray-600">0★ → {targetEquipment.targetStarForce}★</div>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                  
                  {/* Target Equipment */}
                  <div className="flex flex-col items-center gap-2">
                    <EquipmentImage 
                      src={selectedTargetEquipment?.image} 
                      alt={selectedTargetEquipment?.name || `Target Equipment`}
                      size="lg"
                      fallbackIcon={SlotIcon}
                    />
                    <div className="text-center">
                      <div className="text-blue-700">{transferPreview.transferredStars}★ → {form.watch('targetTargetStarForce')}★</div>
                      <div className="text-xs text-gray-600">(starts with +{transferPreview.transferredStars}★ transfer)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Information */}
            {selectedTargetEquipment && (
              <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 font-maplestory">Planning Information</span>
                </div>
                <p className="text-sm text-blue-700 mt-1 font-maplestory">
                  This will add two StarForce enhancement entries to your planning table. 
                  Transfer penalty reduces stars by 1 as per MapleStory mechanics.
                </p>
              </div>
            )}

            {/* Target StarForce Settings */}
            {transferPreview && selectedTargetEquipment && (
              <div className="space-y-2 -mt-2">
                {/* Static Current StarForce Display - Not Editable */}
                <div className="space-y-2">
                  <label className="text-sm font-medium font-maplestory">
                    Target Current StarForce (after transfer): {transferPreview.transferredStars}★
                  </label>
                  <div className="p-3 bg-blue-100 rounded-md border border-blue-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-maplestory">
                        Transferred stars (fixed)
                      </span>
                      <span className="font-mono font-medium text-blue-600">
                        {transferPreview.transferredStars}★
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 mt-1 font-maplestory">
                      This value is automatically set based on the transfer (-1 penalty applied)
                    </div>
                  </div>
                </div>

                <FormFieldWrapper
                  name="targetTargetStarForce"
                  label={`Target Goal StarForce: ${form.watch('targetTargetStarForce')}★`}
                  control={form.control}
                >
                  {(field) => {
                    const maxStars = transferPreview.targetMaxStars;
                    return (
                      <div className="space-y-3">
                        <Slider
                          min={0}
                          max={maxStars}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-maplestory">Direct input:</span>
                          <Input
                            type="number"
                            min={0}
                            max={maxStars}
                            value={field.value}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const clampedValue = Math.min(Math.max(value, 0), maxStars);
                              field.onChange(clampedValue);
                            }}
                            className="w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground font-maplestory">/ {maxStars}★</span>
                        </div>
                      </div>
                    );
                  }}
                </FormFieldWrapper>
              </div>
            )}

            </form>
          </Form>
        </div>
      </MapleDialog>
    );
  }

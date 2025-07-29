import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot } from '@/types';
import { Button } from '@/components/ui/button';
import { EquipmentImage } from '@/components/EquipmentImage';
import { 
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      targetEquipmentId: '',
      targetTargetStarForce: 0,
    },
  });

  // Get valid target equipment (same slot, within 10 levels above, starforceable)
  const validTargetEquipment = existingEquipment.filter(eq => 
    canTransfer(targetEquipment, eq) // targetEquipment is the source, eq is the target
  );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-maplestory">
            StarForce Transfer
          </DialogTitle>
          <DialogDescription className="font-maplestory">
            Plan StarForce transfer from {targetEquipment.name} to another equipment. 
            This will create two entries in your StarForce planning table with transferred stars reduced by 1.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Source Equipment Display */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <SlotIcon className="h-5 w-5" />
                <span className="font-maplestory font-semibold">Transfer Source:</span>
              </div>
              <div className="flex items-center gap-3">
                <EquipmentImage 
                  src={targetEquipment.image} 
                  alt={targetEquipment.name || `Equipment ${targetEquipment.id}`}
                  size="md"
                  fallbackIcon={SlotIcon}
                />
                <div>
                  <div className="font-maplestory font-medium">{targetEquipment.name}</div>
                  <div className="text-sm text-muted-foreground font-maplestory">
                    Level {targetEquipment.level} • {targetEquipment.slot} • Target: {targetEquipment.targetStarForce}★
                  </div>
                </div>
              </div>
            </div>

            {/* Target Equipment Selection */}
            <FormField
              control={form.control}
              name="targetEquipmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-maplestory">Transfer Target (will receive stars)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-maplestory">
                        <SelectValue placeholder="Select equipment to transfer to">
                          {field.value && selectedTargetEquipment && (
                            <div className="flex items-center gap-2">
                              <EquipmentImage 
                                src={selectedTargetEquipment.image} 
                                alt={selectedTargetEquipment.name || `Equipment ${selectedTargetEquipment.id}`}
                                size="sm"
                                fallbackIcon={SlotIcon}
                              />
                              <span className="font-maplestory">
                                {selectedTargetEquipment.name} (Lv.{selectedTargetEquipment.level})
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {validTargetEquipment.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground font-maplestory">
                          No valid equipment found for transfer
                        </div>
                      ) : (
                        validTargetEquipment.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            <div className="flex items-center gap-2">
                              <EquipmentImage 
                                src={equipment.image} 
                                alt={equipment.name || `Equipment ${equipment.id}`}
                                size="sm"
                                fallbackIcon={SlotIcon}
                              />
                              <div className="flex flex-col">
                                <span className="font-maplestory">
                                  {equipment.name} (Lv.{equipment.level})
                                </span>
                                <span className="text-xs text-muted-foreground font-maplestory">
                                  Current: {equipment.currentStarForce}★ • Target: {equipment.targetStarForce}★
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transfer Preview */}
            {transferPreview && (
              <div className="p-4 bg-slate-900/80 dark:bg-slate-900/60 border border-slate-700 dark:border-slate-600 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-blue-300 font-maplestory">Planning Preview</span>
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
                      <div className="text-slate-400">0★ → {targetEquipment.targetStarForce}★</div>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                  
                  {/* Target Equipment */}
                  <div className="flex flex-col items-center gap-2">
                    <EquipmentImage 
                      src={selectedTargetEquipment?.image} 
                      alt={selectedTargetEquipment?.name || `Target Equipment`}
                      size="lg"
                      fallbackIcon={SlotIcon}
                    />
                    <div className="text-center">
                      <div className="text-blue-300">{transferPreview.transferredStars}★ → {form.watch('targetTargetStarForce')}★</div>
                      <div className="text-xs text-slate-400">(starts with +{transferPreview.transferredStars}★ transfer)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Information */}
            {selectedTargetEquipment && (
              <div className="p-4 bg-slate-900/80 dark:bg-slate-900/60 border border-slate-700 dark:border-slate-600 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white font-maplestory">Planning Information</span>
                </div>
                <p className="text-sm text-slate-200 mt-1 font-maplestory">
                  This will add two StarForce enhancement entries to your planning table. 
                  Transfer penalty reduces stars by 1 as per MapleStory mechanics.
                </p>
              </div>
            )}

            {/* Target StarForce Settings */}
            {transferPreview && (
              <>
                {/* Static Current StarForce Display - Not Editable */}
                <div className="space-y-2">
                  <label className="text-sm font-medium font-maplestory">
                    Target Current StarForce (after transfer): {transferPreview.transferredStars}★
                  </label>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-maplestory">
                        Transferred stars (fixed)
                      </span>
                      <span className="font-mono font-medium text-blue-600">
                        {transferPreview.transferredStars}★
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-maplestory">
                      This value is automatically set based on the transfer (-1 penalty applied)
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="targetTargetStarForce"
                  render={({ field }) => {
                    const maxStars = transferPreview.targetMaxStars;
                    return (
                      <FormItem>
                        <FormLabel className="font-maplestory">
                          Target Goal StarForce: {field.value}★
                        </FormLabel>
                        <div className="space-y-3">
                          <FormControl>
                            <Slider
                              min={0}
                              max={maxStars}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-maplestory">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="default" 
                disabled={!selectedTargetEquipment}
                className="font-maplestory bg-blue-600 hover:bg-blue-700"
              >
                Add Transfer Plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

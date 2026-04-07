import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { FormFieldWrapper, CategorizedSelect, SelectCategory } from '@/components/shared/forms';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Star,
  X,
} from 'lucide-react';
import { Form } from '@/components/ui/form';
import { getMaxStarForce, getSlotIcon } from '@/lib/utils';
import { createPortal } from 'react-dom';

const transferSchema = z.object({
  targetEquipmentId: z.string().min(1, 'Target equipment is required'),
  targetTargetStarForce: z.number().min(0),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface StarForceTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEquipment: Equipment;
  existingEquipment: Equipment[];
  onTransfer: (sourceEquipment: Equipment, targetEquipment: Equipment, targetCurrentStars: number, targetTargetStars: number) => void;
}

const canTransfer = (source: Equipment, target: Equipment): boolean => {
  if (source.slot !== target.slot) return false;
  const levelDiff = target.level - source.level;
  if (levelDiff <= 0 || levelDiff > 10) return false;
  if (!source.starforceable || source.targetStarForce === 0) return false;
  if (!target.starforceable) return false;
  if (source.id === target.id) return false;
  return true;
};

export function StarForceTransferDialog({
  open,
  onOpenChange,
  targetEquipment,
  existingEquipment,
  onTransfer
}: StarForceTransferDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('scale(0.95)');

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => { setOpacity(1); setTransform('scale(1)'); }, 10);
    } else {
      setOpacity(0);
      setTransform('scale(0.95)');
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [open]);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: { targetEquipmentId: '', targetTargetStarForce: 0 },
  });

  const validTargetEquipment = useMemo(() =>
    existingEquipment.filter(eq => canTransfer(targetEquipment, eq)),
    [existingEquipment, targetEquipment]
  );

  const equipmentCategories: SelectCategory[] = useMemo(() => {
    if (validTargetEquipment.length === 0) {
      return [{
        name: 'No Equipment Available',
        options: [{ value: '__no_equipment__', label: 'No valid equipment found for transfer' }]
      }];
    }
    return [{
      name: 'Available Equipment',
      options: validTargetEquipment.map(eq => ({
        value: eq.id,
        label: `${eq.name} (Lv.${eq.level})`,
        icon: () => (
          <EquipmentImage src={eq.image} alt={eq.name || `Equipment ${eq.id}`} size="sm" fallbackIcon={getSlotIcon(eq.slot)} />
        )
      }))
    }];
  }, [validTargetEquipment]);

  const watchTargetEquipmentId = form.watch('targetEquipmentId');
  const selectedTargetEquipment = existingEquipment.find(eq => eq.id === watchTargetEquipmentId);

  const transferPreview = useMemo(() => {
    return selectedTargetEquipment ? {
      sourceCurrentStars: targetEquipment.currentStarForce,
      transferredStars: Math.max(0, targetEquipment.targetStarForce - 1),
      targetMaxStars: getMaxStarForce(selectedTargetEquipment.level)
    } : null;
  }, [selectedTargetEquipment, targetEquipment.currentStarForce, targetEquipment.targetStarForce]);

  useEffect(() => {
    if (transferPreview) {
      const current = form.getValues('targetTargetStarForce');
      if (current === 0) form.setValue('targetTargetStarForce', Math.min(22, transferPreview.targetMaxStars));
    }
  }, [transferPreview, form]);

  useEffect(() => {
    if (open) form.reset({ targetEquipmentId: '', targetTargetStarForce: 0 });
  }, [open, form]);

  const onSubmit = (data: TransferFormData) => {
    if (!selectedTargetEquipment || !transferPreview) return;
    onTransfer(targetEquipment, selectedTargetEquipment, transferPreview.transferredStars, data.targetTargetStarForce);
    onOpenChange(false);
  };

  if (!isVisible) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        style={{ opacity, transition: 'opacity 0.2s ease' }}
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg"
        style={{
          opacity,
          transform: `translate(-50%, -50%) ${transform}`,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div className="bg-[hsl(217_33%_9%)] border border-primary/20 rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
            <div className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white font-maplestory">StarForce Transfer</p>
              <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide truncate">
                {targetEquipment.name} → higher level
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 flex-1 space-y-3">

            {/* Warning */}
            {(!targetEquipment.starforceable || targetEquipment.targetStarForce === 0) && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-400/8 border border-amber-400/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 font-maplestory mb-0.5">Transfer Not Available</p>
                  <p className="text-[11px] text-amber-400/70 font-maplestory">
                    Source equipment needs StarForce enabled with target stars {'>'} 0
                    {!targetEquipment.starforceable && ' (StarForce disabled)'}
                    {targetEquipment.starforceable && targetEquipment.targetStarForce === 0 && ' (Target is 0★)'}
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Target Picker */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-maplestory px-0.5">Transfer Target</p>
                  <FormFieldWrapper name="targetEquipmentId" label="" control={form.control} hideLabel>
                    {(field) => (
                      <CategorizedSelect
                        value={field.value}
                        onValueChange={(value) => { if (value !== '__no_equipment__') field.onChange(value); }}
                        placeholder="Select equipment to receive stars"
                        categories={equipmentCategories}
                        className="bg-white/8 border-white/15 font-maplestory w-full"
                        variant="dark"
                        disabled={validTargetEquipment.length === 0}
                      />
                    )}
                  </FormFieldWrapper>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-3">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-maplestory">Transfer Preview</p>

                  <div className="flex items-center justify-between gap-3">
                    {/* Source */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <EquipmentImage src={targetEquipment.image} alt={targetEquipment.name} size="md" fallbackIcon={getSlotIcon(targetEquipment.slot)} />
                      <p className="text-[11px] text-white/70 font-maplestory text-center truncate w-full">{targetEquipment.name}</p>
                      <p className="text-[10px] text-white/40 font-maplestory">{targetEquipment.currentStarForce}★ → {targetEquipment.targetStarForce}★</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-white/20 shrink-0" />

                    {/* Target */}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      {selectedTargetEquipment ? (
                        <>
                          <EquipmentImage src={selectedTargetEquipment.image} alt={selectedTargetEquipment.name} size="md" fallbackIcon={getSlotIcon(selectedTargetEquipment.slot)} />
                          <p className="text-[11px] text-white/70 font-maplestory text-center truncate w-full">{selectedTargetEquipment.name}</p>
                          <p className="text-[10px] text-white/40 font-maplestory">
                            {transferPreview?.transferredStars ?? 0}★ → {form.watch('targetTargetStarForce') || 0}★
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg border border-dashed border-white/15 bg-white/5 flex items-center justify-center">
                            <span className="text-[9px] text-white/20 font-maplestory">?</span>
                          </div>
                          <p className="text-[11px] text-white/30 font-maplestory text-center">Select above</p>
                          <p className="text-[10px] text-white/20 font-maplestory">—</p>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedTargetEquipment && (
                    <p className="text-[10px] text-white/30 font-maplestory text-center">-1 star transfer penalty (MapleStory mechanic)</p>
                  )}
                </div>

                {/* Target Goal */}
                {selectedTargetEquipment && transferPreview && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-maplestory px-0.5">Target Goal</p>
                    <FormFieldWrapper name="targetTargetStarForce" label="" control={form.control} hideLabel>
                      {(field) => {
                        const maxStars = transferPreview.targetMaxStars;
                        return (
                          <div className="space-y-1.5">
                            <input
                              type="number"
                              min={Math.max(1, transferPreview.transferredStars)}
                              max={maxStars}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || transferPreview.transferredStars)}
                              value={field.value}
                              className="w-full text-center rounded-lg border border-white/15 font-maplestory text-white h-9 text-sm px-3 focus:outline-none focus:border-primary/40"
                              style={{ background: 'rgba(255,255,255,0.08)' }}
                            />
                            <div className="flex flex-wrap gap-1">
                              {[15, 17, 19, 21, 22].filter(s => s <= maxStars && s >= transferPreview.transferredStars).map(stars => (
                                <button
                                  key={stars}
                                  type="button"
                                  onClick={() => field.onChange(stars)}
                                  className={`px-1.5 py-0.5 text-[10px] font-maplestory rounded border transition-colors ${
                                    field.value === stars
                                      ? 'bg-primary/20 text-primary border-primary/30'
                                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'
                                  }`}
                                >
                                  {stars}★
                                </button>
                              ))}
                              <span className="text-[10px] text-white/25 font-maplestory ml-auto self-center">Max {maxStars}★</span>
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

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/8 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-1.5 text-sm font-maplestory rounded-lg text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={!selectedTargetEquipment}
              className="px-5 py-1.5 text-sm font-maplestory rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Transfer Plan
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}

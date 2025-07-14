import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sword, 
  Shield, 
  Crown, 
  Shirt, 
  Footprints,
  Hand,
  Glasses,
  CircleDot,
  Heart,
  Gem,
  Badge,
  Eye,
  Circle,
  Square
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
import { EQUIPMENT_BY_SLOT } from '@/data/equipmentSets';

const equipmentSchema = z.object({
  slot: z.string().min(1, 'Equipment slot is required'),
  type: z.enum(['armor', 'weapon', 'accessory'] as const),
  level: z.number().min(1, 'Equipment level is required').max(300, 'Level cannot exceed 300'),
  set: z.string().optional(),
  tier: z.enum(['rare', 'epic', 'unique', 'legendary'] as const).nullable(),
  currentStarForce: z.number().min(0).max(23),
  targetStarForce: z.number().min(0).max(23),
  starforceable: z.boolean(),
}).refine((data) => {
  // Only validate StarForce levels if the item is starforceable
  if (!data.starforceable) return true;
  return data.targetStarForce >= data.currentStarForce;
}, {
  message: "Target StarForce must be greater than or equal to current StarForce",
  path: ["targetStarForce"],
});

// Helper function to determine default starforceable status based on slot
const getDefaultStarforceable = (slot: string): boolean => {
  const nonStarforceableSlots = ['pocket', 'emblem', 'badge', 'secondary'];
  return !nonStarforceableSlots.includes(slot);
};

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  defaultSlot?: EquipmentSlot;
  onSave: (equipment: Omit<Equipment, 'id'> | Equipment) => void;
  allowSlotEdit?: boolean;
}

const getSlotIcon = (slotValue: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    weapon: Sword,
    secondary: Shield,
    emblem: Badge,
    hat: Crown,
    top: Shirt,
    bottom: Square,
    overall: Shirt,
    shoes: Footprints,
    gloves: Hand,
    cape: Square,
    belt: Circle,
    shoulder: Square,
    face: Glasses,
    eye: Eye,
    earring: CircleDot,
    ring1: Circle,
    ring2: Circle,
    ring3: Circle,
    ring4: Circle,
    pendant1: Gem,
    pendant2: Gem,
    pocket: Square,
    heart: Heart,
    badge: Badge,
    medal: Badge,
  };
  return iconMap[slotValue] || Square;
};

const EQUIPMENT_SLOTS = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'emblem', label: 'Emblem' },
  { value: 'hat', label: 'Hat' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'overall', label: 'Overall' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'cape', label: 'Cape' },
  { value: 'belt', label: 'Belt' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'face', label: 'Face' },
  { value: 'eye', label: 'Eye' },
  { value: 'earring', label: 'Earring' },
  { value: 'ring1', label: 'Ring 1' },
  { value: 'ring2', label: 'Ring 2' },
  { value: 'ring3', label: 'Ring 3' },
  { value: 'ring4', label: 'Ring 4' },
  { value: 'pendant1', label: 'Pendant 1' },
  { value: 'pendant2', label: 'Pendant 2' },
  { value: 'pocket', label: 'Pocket' },
  { value: 'heart', label: 'Heart' },
  { value: 'badge', label: 'Badge' },
  { value: 'medal', label: 'Medal' },
];

const EQUIPMENT_TYPES = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'accessory', label: 'Accessory' },
];

const EQUIPMENT_TIERS = [
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'unique', label: 'Unique' },
  { value: 'legendary', label: 'Legendary' },
];

export function EquipmentForm({ 
  open, 
  onOpenChange, 
  equipment, 
  defaultSlot, 
  onSave,
  allowSlotEdit = false
}: EquipmentFormProps) {
  const isEditing = !!equipment;

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      slot: defaultSlot || '',
      type: 'armor',
      level: 200,
      set: '',
      tier: null,
      currentStarForce: 0,
      targetStarForce: 22,
      starforceable: true,
    },
  });

  // Watch for starforceable toggle and slot changes
  const watchStarforceable = form.watch('starforceable');
  const watchSlot = form.watch('slot');

  // Update starforceable default when slot changes
  useEffect(() => {
    if (watchSlot && !equipment) { // Only for new equipment, not editing
      const defaultStarforceable = getDefaultStarforceable(watchSlot);
      form.setValue('starforceable', defaultStarforceable);
      
      // Reset StarForce values if turning off starforceable
      if (!defaultStarforceable) {
        form.setValue('currentStarForce', 0);
        form.setValue('targetStarForce', 0);
      }
    }
  }, [watchSlot, equipment, form]);

  // Reset form when dialog opens/closes or equipment changes
  useEffect(() => {
    if (open) {
      if (equipment) {
        form.reset({
          slot: equipment.slot,
          type: equipment.type,
          level: equipment.level,
          set: equipment.set || '',
          tier: equipment.tier,
          currentStarForce: equipment.currentStarForce,
          targetStarForce: equipment.targetStarForce,
          starforceable: equipment.starforceable,
        });
      } else {
        form.reset({
          slot: defaultSlot || '',
          type: 'armor',
          level: 200,
          set: '',
          tier: null,
          currentStarForce: 0,
          targetStarForce: 22,
          starforceable: defaultSlot ? getDefaultStarforceable(defaultSlot) : true,
        });
      }
    }
  }, [open, equipment, defaultSlot, form]);

  const selectedSlot = form.watch('slot');
  const availableEquipment = selectedSlot ? EQUIPMENT_BY_SLOT[selectedSlot as keyof typeof EQUIPMENT_BY_SLOT] || [] : [];
  
  // Watch for overall/top/bottom conflicts
  const currentSlot = form.watch('slot');

  const onSubmit = (data: EquipmentFormData) => {
    if (isEditing && equipment) {
      onSave({
        ...equipment,
        ...data,
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        tier: data.tier as EquipmentTier | null | undefined,
      });
    } else {
      onSave({
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        level: data.level,
        set: data.set,
        tier: data.tier as EquipmentTier | null | undefined,
        currentStarForce: data.starforceable ? data.currentStarForce : 0,
        targetStarForce: data.starforceable ? data.targetStarForce : 0,
        starforceable: data.starforceable,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Equipment' : 'Add Equipment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your equipment details and StarForce goals.' 
              : 'Add a new piece of equipment to track its StarForce progress.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* First line: Slot (readonly with icon) */}
            <FormField
              control={form.control}
              name="slot"
              render={({ field }) => {
                const SlotIcon = getSlotIcon(field.value);
                return (
                  <FormItem>
                    <FormLabel>Equipment Slot</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={(isEditing && !allowSlotEdit) || (!!defaultSlot && !allowSlotEdit)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment slot">
                            {field.value && (
                              <div className="flex items-center gap-2">
                                <SlotIcon className="h-4 w-4" />
                                {EQUIPMENT_SLOTS.find(s => s.value === field.value)?.label}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {EQUIPMENT_SLOTS.map((slot) => {
                           const IconComponent = getSlotIcon(slot.value);
                           return (
                             <SelectItem key={slot.value} value={slot.value}>
                               <div className="flex items-center gap-2">
                                 <IconComponent className="h-4 w-4" />
                                 {slot.label}
                                 {(slot.value === 'overall' && (currentSlot === 'top' || currentSlot === 'bottom')) && 
                                   <span className="text-xs text-muted-foreground">(conflicts with top/bottom)</span>
                                 }
                                 {((slot.value === 'top' || slot.value === 'bottom') && currentSlot === 'overall') && 
                                   <span className="text-xs text-muted-foreground">(conflicts with overall)</span>
                                 }
                               </div>
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Second line: Equipment (main selection) */}
            <FormField
              control={form.control}
              name="set"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-update tier and level based on equipment selection
                    const equipData = availableEquipment.find(eq => eq.name === value);
                    if (equipData) {
                      form.setValue('tier', equipData.tier);
                      form.setValue('level', equipData.level);
                      // Auto-determine type based on slot
                      const slot = form.getValues('slot');
                      if (['weapon', 'secondary', 'emblem'].includes(slot)) {
                        form.setValue('type', 'weapon');
                      } else if (['hat', 'top', 'bottom', 'overall', 'shoes', 'gloves', 'cape', 'belt', 'shoulder'].includes(slot)) {
                        form.setValue('type', 'armor');
                      } else {
                        form.setValue('type', 'accessory');
                      }
                      
                      // Set starforceable default for the equipment slot
                      const defaultStarforceable = getDefaultStarforceable(slot);
                      form.setValue('starforceable', defaultStarforceable);
                      
                      // Reset StarForce if not starforceable
                      if (!defaultStarforceable) {
                        form.setValue('currentStarForce', 0);
                        form.setValue('targetStarForce', 0);
                      }
                    }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.name} value={equipment.name}>
                          {equipment.name} (Lv.{equipment.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Third line: Level, Type, and Tier */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="200" 
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potential Tier</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(null);
                        } else {
                          field.onChange(value);
                        }
                      }} 
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select potential tier (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Potential</SelectItem>
                        {EQUIPMENT_TIERS.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* StarForce Toggle */}
            <FormField
              control={form.control}
              name="starforceable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      StarForce Enhancement
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Can this equipment be enhanced with StarForce?
                      {watchSlot && !getDefaultStarforceable(watchSlot) && (
                        <div className="text-amber-600 dark:text-amber-400 mt-1">
                          Note: {watchSlot.charAt(0).toUpperCase() + watchSlot.slice(1)} items are typically not starforceable
                        </div>
                      )}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* StarForce Sliders - Only show if starforceable */}
            {watchStarforceable && (
              <>

            <FormField
              control={form.control}
              name="currentStarForce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current StarForce: {field.value}★</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={23}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetStarForce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target StarForce: {field.value}★</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={23}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update' : 'Add'} Equipment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
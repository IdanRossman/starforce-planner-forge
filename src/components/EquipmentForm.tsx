import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EquipmentImage } from '@/components/EquipmentImage';
import { getEquipmentBySlot } from '@/services/equipmentService';
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
  Square,
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
import { getMaxStarForce, getDefaultTargetStarForce } from '@/lib/utils';

const equipmentSchema = z.object({
  slot: z.string().min(1, 'Equipment slot is required'),
  type: z.enum(['armor', 'weapon', 'accessory'] as const),
  level: z.number().min(1, 'Equipment level is required').max(300, 'Level cannot exceed 300'),
  set: z.string().optional(),
  tier: z.enum(['rare', 'epic', 'unique', 'legendary'] as const).nullable(),
  currentStarForce: z.number().min(0),
  targetStarForce: z.number().min(0),
  starforceable: z.boolean(),
}).refine((data) => {
  // Only validate StarForce levels if the item is starforceable
  if (!data.starforceable) return true;
  const maxStars = getMaxStarForce(data.level);
  return data.currentStarForce <= maxStars && data.targetStarForce <= maxStars;
}, {
  message: "StarForce levels cannot exceed the maximum for this equipment level",
  path: ["targetStarForce"],
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
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

  // State to track the selected equipment's image
  const [selectedEquipmentImage, setSelectedEquipmentImage] = useState<string>('');
  // State to track if star force values were auto-adjusted
  const [autoAdjusted, setAutoAdjusted] = useState<{current?: boolean, target?: boolean}>({});
  // State for equipment data from API
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState<boolean>(false);
  const [equipmentSource, setEquipmentSource] = useState<'api' | 'local'>('local');

  // Watch for starforceable toggle and slot changes
  const watchStarforceable = form.watch('starforceable');
  const watchSlot = form.watch('slot');
  const watchLevel = form.watch('level');

  // Update StarForce values when level changes
  useEffect(() => {
    if (watchLevel && watchStarforceable) {
      const maxStars = getMaxStarForce(watchLevel);
      const defaultTarget = getDefaultTargetStarForce(watchLevel);
      const currentTarget = form.getValues('targetStarForce');
      const currentCurrent = form.getValues('currentStarForce');
      let adjustments = {};
      
      // Always update current StarForce if it's above the new max
      if (currentCurrent > maxStars) {
        form.setValue('currentStarForce', maxStars);
        adjustments = { ...adjustments, current: true };
      }
      
      // Update target StarForce logic
      if (currentTarget > maxStars) {
        // If target is above new max, clamp it to max
        form.setValue('targetStarForce', maxStars);
        adjustments = { ...adjustments, target: true };
      } else if (!equipment && currentTarget === 0) {
        // For new equipment only: if target is 0, set it to default
        form.setValue('targetStarForce', defaultTarget);
      }
      
      // Set auto-adjustment tracking and clear after 3 seconds
      if (Object.keys(adjustments).length > 0) {
        setAutoAdjusted(adjustments);
        setTimeout(() => setAutoAdjusted({}), 3000);
      }
    }
  }, [watchLevel, equipment, watchStarforceable, form]);

  // Update starforceable default when slot changes
  useEffect(() => {
    if (watchSlot && !equipment) { // Only for new equipment, not editing
      const defaultStarforceable = getDefaultStarforceable(watchSlot);
      form.setValue('starforceable', defaultStarforceable);
      
      // Reset StarForce values if turning off starforceable
      if (!defaultStarforceable) {
        form.setValue('currentStarForce', 0);
        form.setValue('targetStarForce', 0);
      } else {
        // If turning on starforceable, set target to default for current level (22 for 140+, max otherwise)
        const currentLevel = form.getValues('level');
        const defaultTarget = getDefaultTargetStarForce(currentLevel);
        form.setValue('targetStarForce', defaultTarget);
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
        
        // Set the image state for existing equipment
        setSelectedEquipmentImage(equipment.image || '');
      } else {
        const defaultLevel = 200;
        const defaultTarget = getDefaultTargetStarForce(defaultLevel);
        form.reset({
          slot: defaultSlot || '',
          type: 'armor',
          level: defaultLevel,
          set: '',
          tier: null,
          currentStarForce: 0,
          targetStarForce: defaultTarget,
          starforceable: defaultSlot ? getDefaultStarforceable(defaultSlot) : true,
        });
        // Reset image state for new equipment
        setSelectedEquipmentImage('');
      }
    }
  }, [open, equipment, defaultSlot, form]);

  const selectedSlot = form.watch('slot');
  
  // Fetch equipment data when slot changes
  useEffect(() => {
    if (selectedSlot) {
      setEquipmentLoading(true);
      getEquipmentBySlot(selectedSlot as EquipmentSlot)
        .then(({ equipment, source }) => {
          setAvailableEquipment(equipment);
          setEquipmentSource(source);
        })
        .catch((error) => {
          console.error('Failed to load equipment:', error);
          setAvailableEquipment([]);
        })
        .finally(() => {
          setEquipmentLoading(false);
        });
    } else {
      setAvailableEquipment([]);
    }
  }, [selectedSlot]);
  
  // Watch for overall/top/bottom conflicts
  const currentSlot = form.watch('slot');

  const onSubmit = (data: EquipmentFormData) => {
    // Find the selected equipment to get its image, prioritizing tracked state
    const selectedEquipment = availableEquipment.find(eq => eq.set === data.set);
    const equipmentImage = selectedEquipmentImage || selectedEquipment?.image;

    if (isEditing && equipment) {
      onSave({
        ...equipment,
        ...data,
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        tier: data.tier as EquipmentTier | null | undefined,
        image: equipmentImage,
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
        image: equipmentImage,
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear equipment selection when slot changes since equipment might not be valid for new slot
                        form.setValue('set', '');
                        setSelectedEquipmentImage('');
                      }} 
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
                    const equipData = availableEquipment.find(eq => eq.set === value);
                    if (equipData) {
                      form.setValue('tier', equipData.tier);
                      form.setValue('level', equipData.level);
                      // Update the image state immediately
                      setSelectedEquipmentImage(equipData.image);
                      
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
                        <SelectValue placeholder={equipmentLoading ? "Loading equipment..." : "Select equipment"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipmentLoading ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Loading equipment...
                        </div>
                      ) : availableEquipment.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No equipment found for this slot
                        </div>
                      ) : (
                        <>
                          {equipmentSource === 'local' && (
                            <div className="p-2 text-xs text-muted-foreground bg-yellow-50 border-b">
                              ⚠️ Using local data (API unavailable)
                            </div>
                          )}
                          {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.set || equipment.id}>
                          <div className="flex items-center gap-2">
                            <EquipmentImage 
                              src={equipment.image} 
                              alt={equipment.set || `Equipment ${equipment.id}`}
                              size="sm"
                              fallbackIcon={getSlotIcon(selectedSlot)}
                            />
                            <span>{equipment.set || `Equipment ${equipment.id}`} (Lv.{equipment.level})</span>
                          </div>
                        </SelectItem>
                      ))}
                        </>
                      )}
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
              {/* Auto-adjustment notification */}
              {(autoAdjusted.current || autoAdjusted.target) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Star force values auto-adjusted to match level {watchLevel} limits
                      {autoAdjusted.current && autoAdjusted.target ? ' (current & target)' : 
                       autoAdjusted.current ? ' (current)' : ' (target)'}
                    </span>
                  </div>
                </div>
              )}

            <FormField
              control={form.control}
              name="currentStarForce"
              render={({ field }) => {
                const maxStars = getMaxStarForce(watchLevel);
                return (
                  <FormItem>
                    <FormLabel>Current StarForce: {field.value}★</FormLabel>
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
                        <span className="text-sm text-muted-foreground">Direct input:</span>
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
                        <span className="text-sm text-muted-foreground">/ {maxStars}★</span>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="targetStarForce"
              render={({ field }) => {
                const maxStars = getMaxStarForce(watchLevel);
                return (
                  <FormItem>
                    <FormLabel>Target StarForce: {field.value}★ (Max: {maxStars}★ for Lv.{watchLevel})</FormLabel>
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
                        <span className="text-sm text-muted-foreground">Direct input:</span>
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
                        <span className="text-sm text-muted-foreground">/ {maxStars}★</span>
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
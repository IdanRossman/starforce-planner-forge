import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier } from '@/types';
import { Button } from '@/components/ui/button';
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

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  slot: z.string().min(1, 'Equipment slot is required'),
  type: z.enum(['armor', 'weapon', 'accessory'] as const),
  tier: z.enum(['rare', 'epic', 'unique', 'legendary'] as const),
  currentStarForce: z.number().min(0).max(25),
  targetStarForce: z.number().min(0).max(25),
}).refine((data) => data.targetStarForce >= data.currentStarForce, {
  message: "Target StarForce must be greater than or equal to current StarForce",
  path: ["targetStarForce"],
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  defaultSlot?: EquipmentSlot;
  onSave: (equipment: Omit<Equipment, 'id'> | Equipment) => void;
}

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
  onSave 
}: EquipmentFormProps) {
  const isEditing = !!equipment;

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      slot: defaultSlot || '',
      type: 'armor',
      tier: 'epic',
      currentStarForce: 0,
      targetStarForce: 17,
    },
  });

  // Reset form when dialog opens/closes or equipment changes
  useEffect(() => {
    if (open) {
      if (equipment) {
        form.reset({
          name: equipment.name,
          slot: equipment.slot,
          type: equipment.type,
          tier: equipment.tier,
          currentStarForce: equipment.currentStarForce,
          targetStarForce: equipment.targetStarForce,
        });
      } else {
        form.reset({
          name: '',
          slot: defaultSlot || '',
          type: 'armor',
          tier: 'epic',
          currentStarForce: 0,
          targetStarForce: 17,
        });
      }
    }
  }, [open, equipment, defaultSlot, form]);

  const onSubmit = (data: EquipmentFormData) => {
    if (isEditing && equipment) {
      onSave({
        ...equipment,
        ...data,
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        tier: data.tier as EquipmentTier,
      });
    } else {
      onSave({
        name: data.name,
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        tier: data.tier as EquipmentTier,
        currentStarForce: data.currentStarForce,
        targetStarForce: data.targetStarForce,
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Arcane Umbra Katara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slot</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {EQUIPMENT_SLOTS.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
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
            </div>

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <FormField
              control={form.control}
              name="currentStarForce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current StarForce: {field.value}★</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={25}
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
                      max={25}
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
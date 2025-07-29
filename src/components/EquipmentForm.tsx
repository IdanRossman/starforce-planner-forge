import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EquipmentImage } from '@/components/EquipmentImage';
import { StarForceTransferDialog } from '@/components/StarForceTransferDialog';
import { getEquipmentBySlot, getEquipmentBySlotAndJob } from '@/services/equipmentService';
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
  Info,
  ArrowRightLeft
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { getMaxStarForce, getDefaultTargetStarForce, getSlotIcon } from '@/lib/utils';

// Create dynamic schema that considers transferred stars
const createEquipmentSchema = (transferredStars: number = 0) => z.object({
  slot: z.string().min(1, 'Equipment slot is required'),
  type: z.enum(['armor', 'weapon', 'accessory'] as const),
  level: z.number().min(1, 'Equipment level is required').max(300, 'Level cannot exceed 300'),
  set: z.string().optional(),
  tier: z.enum(['rare', 'epic', 'unique', 'legendary'] as const).nullable(),
  currentStarForce: z.number().min(transferredStars, transferredStars > 0 ? `Current StarForce cannot be below ${transferredStars}★ (transferred stars)` : 'Current StarForce must be at least 0'),
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

// Default schema for new equipment (no transferred stars)
const equipmentSchema = createEquipmentSchema(0);

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
  onTransfer?: (sourceEquipment: Equipment, targetEquipment: Equipment) => void; // New transfer callback
  allowSlotEdit?: boolean;
  selectedJob?: string;
  existingEquipment?: Equipment[]; // Add this for transfer functionality
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
  onTransfer,
  allowSlotEdit = false,
  selectedJob,
  existingEquipment = []
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
  // Transfer dialog state
  const [showTransferDialog, setShowTransferDialog] = useState<boolean>(false);

  // Watch for starforceable toggle and slot changes
  const watchStarforceable = form.watch('starforceable');
  const watchSlot = form.watch('slot');
  const watchLevel = form.watch('level');
  const watchCurrentStars = form.watch('currentStarForce');

  // Real-time validation for transferred stars minimum
  useEffect(() => {
    const transferredStars = equipment?.transferredStars || 0;
    if (transferredStars > 0 && watchCurrentStars < transferredStars) {
      form.setError('currentStarForce', {
        type: 'manual',
        message: `Current StarForce cannot be below ${transferredStars}★ (transferred stars)`
      });
    } else {
      // Clear the error if the value is valid
      const errors = form.formState.errors;
      if (errors.currentStarForce?.type === 'manual') {
        form.clearErrors('currentStarForce');
      }
    }
  }, [watchCurrentStars, equipment?.transferredStars, form]);

  // Update form resolver when equipment changes to use correct schema for transferred stars
  useEffect(() => {
    const transferredStars = equipment?.transferredStars || 0;
    const newSchema = createEquipmentSchema(transferredStars);
    form.clearErrors(); // Clear any existing validation errors
    // Note: We can't dynamically change the resolver in react-hook-form
    // So we'll rely on the UI constraints instead
  }, [equipment, form]);

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
      // Always start with StarForce off for new equipment
      form.setValue('starforceable', false);
      form.setValue('currentStarForce', 0);
      form.setValue('targetStarForce', 0);
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
          set: equipment.name || equipment.set || '', // Use name if available, fallback to set
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
          starforceable: false, // Start with StarForce off for new equipment
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
      
      // Use job-specific API if job is selected, otherwise use slot-only
      const fetchEquipment = selectedJob 
        ? getEquipmentBySlotAndJob(selectedSlot as EquipmentSlot, selectedJob)
        : getEquipmentBySlot(selectedSlot as EquipmentSlot);
      
      fetchEquipment
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
  }, [selectedSlot, selectedJob]);
  
  // Watch for overall/top/bottom conflicts
  const currentSlot = form.watch('slot');

  // Helper function to check if transfer is possible
  const canTransfer = (source: Equipment, target: Equipment): boolean => {
    // Same slot requirement
    if (source.slot !== target.slot) return false;
    
    // Target level must be within 10 levels ABOVE the source (can only transfer up)
    const levelDiff = target.level - source.level;
    if (levelDiff < 0 || levelDiff > 10) return false;
    
    // Source must have StarForce target and be starforceable
    if (!source.starforceable || source.targetStarForce === 0) return false;
    
    // Target must be starforceable
    if (!target.starforceable) return false;
    
    // Can't transfer to the same equipment (check by ID, name, and level)
    if (source.id === target.id) return false;
    if (source.name === target.name && source.level === target.level) return false;
    
    return true;
  };

  // Watch form values for real-time transfer eligibility check
  const watchedValues = form.watch();
  
  // Create current equipment object with form values for transfer dialog
  // This works for both editing existing equipment and creating new equipment
  const currentEquipmentForTransfer: Equipment | null = (() => {
    // Must have required values for transfer
    if (!watchedValues.level || watchedValues.currentStarForce === undefined || 
        watchedValues.targetStarForce === undefined || watchedValues.starforceable === undefined) {
      return null;
    }
    
    // Get equipment name from either existing equipment or selected from dropdown
    let equipmentName = '';
    let equipmentImage = '';
    
    if (equipment) {
      // Editing existing equipment
      equipmentName = equipment.name;
      equipmentImage = equipment.image || '';
    } else if (watchedValues.set && availableEquipment.find(eq => eq.name === watchedValues.set)) {
      // Creating new equipment and user selected from dropdown
      const selectedEquipment = availableEquipment.find(eq => eq.name === watchedValues.set)!;
      equipmentName = selectedEquipment.name;
      equipmentImage = selectedEquipment.image || '';
    } else {
      // Creating new equipment without selecting from dropdown - no name yet
      return null;
    }
    
    // Base equipment from form values
    const baseEquipment: Equipment = {
      id: equipment?.id || crypto.randomUUID(), // Use existing ID or generate new one
      name: equipmentName,
      slot: watchedValues.slot as EquipmentSlot,
      type: watchedValues.type as EquipmentType,
      level: watchedValues.level,
      currentStarForce: watchedValues.currentStarForce,
      targetStarForce: watchedValues.targetStarForce,
      starforceable: watchedValues.starforceable,
      tier: watchedValues.tier as EquipmentTier | null | undefined,
      set: watchedValues.set,
      image: equipmentImage,
      actualCost: equipment?.actualCost,
    };
    
    // If user selected a different equipment from dropdown, merge that equipment's data
    if (watchedValues.set && availableEquipment.find(eq => eq.name === watchedValues.set)) {
      const selectedEquipment = availableEquipment.find(eq => eq.name === watchedValues.set)!;
      return {
        ...selectedEquipment,
        id: baseEquipment.id, // Keep original ID for tracking
        currentStarForce: watchedValues.currentStarForce,
        targetStarForce: watchedValues.targetStarForce,
        starforceable: watchedValues.starforceable,
      };
    }
    
    // Use base equipment with form values
    return baseEquipment;
  })();
  
  // Check if the current form values can transfer to any available equipment from API
  // Works for both editing existing equipment and creating new equipment from dropdown
  const hasValidTransferCandidates = currentEquipmentForTransfer && availableEquipment.some(eq => {
    return canTransfer(currentEquipmentForTransfer, eq);
  });

  // Handle transfer completion
  const handleTransfer = (sourceEquipment: Equipment, targetEquipment: Equipment, targetCurrentStars: number, targetTargetStars: number) => {
    // Calculate the actual transferred star amount (source target - 1 for penalty)
    const transferredStarAmount = Math.max(0, sourceEquipment.targetStarForce - 1);
    
    // Ensure we have the correct image for the target equipment
    const targetImage = targetEquipment.image || availableEquipment.find(eq => eq.id === targetEquipment.id)?.image || '';
    
    // Determine the correct specific slot for the target equipment
    // If target has a generic slot (pendant, ring), find an available specific slot
    let targetSlot: EquipmentSlot = targetEquipment.slot;
    const sourceSlot = sourceEquipment.slot;
    
    // Handle multi-slot types (rings, pendants) - check the string value of the slot
    const targetSlotString = targetEquipment.slot as string;
    if (targetSlotString === 'pendant' || targetSlotString === 'ring') {
      // Find an available specific slot for this type
      const possibleSlots: EquipmentSlot[] = targetSlotString === 'pendant' 
        ? ['pendant1', 'pendant2'] 
        : ['ring1', 'ring2', 'ring3', 'ring4'];
      
      // Find first available slot or use the source slot if it's the same type
      const availableSlot = possibleSlots.find(slot => {
        const existing = existingEquipment?.find(eq => eq.slot === slot && eq.id !== sourceEquipment.id);
        return !existing;
      });
      
      targetSlot = availableSlot || sourceSlot; // Fallback to source slot if no available slot found
    }
    
    // Create the updated target equipment with transferred stars
    const updatedTargetEquipment: Equipment = {
      ...targetEquipment,
      slot: targetSlot, // Use the determined specific slot
      currentStarForce: targetCurrentStars,
      targetStarForce: targetTargetStars,
      transferredFrom: sourceEquipment.id, // Mark as transfer target
      transferredStars: transferredStarAmount, // Track the actual transferred star amount as minimum
      image: targetImage, // Explicitly ensure the image is preserved
    };

    // Create the source equipment for the table (with transfer indicator)
    const sourceForTable: Equipment = {
      ...sourceEquipment,
      transferredTo: targetEquipment.id, // Mark as transfer source
    };

    // Use the transfer callback if available, otherwise use regular save for the target
    if (onTransfer) {
      onTransfer(sourceForTable, updatedTargetEquipment);
    } else {
      // Fallback: just save the target equipment
      onSave(updatedTargetEquipment);
    }
    onOpenChange(false);
  };

  const onSubmit = (data: EquipmentFormData) => {
    // Additional validation for transferred stars
    const transferredStars = equipment?.transferredStars || 0;
    if (transferredStars > 0 && data.currentStarForce < transferredStars) {
      form.setError('currentStarForce', {
        type: 'manual',
        message: `Current StarForce cannot be below ${transferredStars}★ (transferred stars)`
      });
      return;
    }

    // Reset any manual errors
    form.clearErrors('currentStarForce');

    // Find the selected equipment to get its image, prioritizing tracked state
    const selectedEquipment = availableEquipment.find(eq => eq.name === data.set);
    const equipmentImage = selectedEquipmentImage || selectedEquipment?.image;

    if (isEditing && equipment) {
      onSave({
        ...equipment,
        ...data,
        name: data.set, // Store the selected name
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        tier: data.tier as EquipmentTier | null | undefined,
        image: equipmentImage,
      });
    } else {
      onSave({
        id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID for new equipment
        name: data.set, // Store the selected name
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        level: data.level,
        set: selectedEquipment?.set, // Store the actual set name from API
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-maplestory">
            {isEditing ? 'Edit Equipment' : 'Add Equipment'}
          </DialogTitle>
          <DialogDescription className="font-maplestory">
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
                      <FormLabel className="font-maplestory">Equipment Slot</FormLabel>
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
                          <SelectTrigger className="font-maplestory">
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
                                   <span className="font-maplestory">{slot.label}</span>
                                   {(slot.value === 'overall' && (currentSlot === 'top' || currentSlot === 'bottom')) && 
                                     <span className="text-xs text-muted-foreground font-maplestory">(conflicts with top/bottom)</span>
                                   }
                                   {((slot.value === 'top' || slot.value === 'bottom') && currentSlot === 'overall') && 
                                     <span className="text-xs text-muted-foreground font-maplestory">(conflicts with overall)</span>
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
                    <FormLabel className="font-maplestory">Equipment</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Auto-update tier and level based on equipment selection
                      const equipData = availableEquipment.find(eq => eq.name === value);
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
                        
                        // Set starforceable based on API data
                        form.setValue('starforceable', equipData.starforceable);
                        
                        // Reset StarForce if not starforceable
                        if (!equipData.starforceable) {
                          form.setValue('currentStarForce', 0);
                          form.setValue('targetStarForce', 0);
                        } else {
                          // If starforceable, set target to default for current level and ensure current is valid
                          const defaultTarget = getDefaultTargetStarForce(equipData.level);
                          form.setValue('targetStarForce', defaultTarget);
                          // Ensure current StarForce doesn't exceed the max for this level
                          const maxStars = getMaxStarForce(equipData.level);
                          const currentCurrent = form.getValues('currentStarForce');
                          if (currentCurrent > maxStars) {
                            form.setValue('currentStarForce', 0);
                          }
                        }
                      }
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-maplestory">
                          <SelectValue placeholder={equipmentLoading ? "Loading equipment..." : "Select equipment"}>
                            {field.value && (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const selectedEquip = availableEquipment.find(eq => eq.name === field.value);
                                  return selectedEquip ? (
                                    <>
                                      <EquipmentImage 
                                        src={selectedEquip.image} 
                                        alt={selectedEquip.name || `Equipment ${selectedEquip.id}`}
                                        size="sm"
                                        fallbackIcon={getSlotIcon(selectedSlot)}
                                      />
                                      <span className="font-maplestory">{selectedEquip.name} (Lv.{selectedEquip.level})</span>
                                    </>
                                  ) : (
                                    <span className="font-maplestory">{field.value}</span>
                                  );
                                })()}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {equipmentLoading ? (
                          <div className="p-2 text-center text-sm text-muted-foreground font-maplestory">
                            Loading equipment...
                          </div>
                        ) : availableEquipment.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground font-maplestory">
                            No equipment found for this slot
                          </div>
                        ) : (
                          <>
                            {equipmentSource === 'local' && (
                              <div className="p-2 text-xs text-muted-foreground bg-yellow-50 border-b font-maplestory">
                                ⚠️ Using local data (API unavailable)
                              </div>
                            )}
                            {availableEquipment.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.name || equipment.id}>
                            <div className="flex items-center gap-2">
                              <EquipmentImage 
                                src={equipment.image} 
                                alt={equipment.name || `Equipment ${equipment.id}`}
                                size="md"
                                fallbackIcon={getSlotIcon(selectedSlot)}
                              />
                              <span className="font-maplestory">
                                {equipment.name && equipment.name.trim() 
                                  ? `${equipment.name} (Lv.${equipment.level})`
                                  : `Level ${equipment.level} Equipment`
                                }
                              </span>
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

              {/* Third line: Potential Tier */}
              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-maplestory">Potential Tier</FormLabel>
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
                        <SelectTrigger className="font-maplestory">
                          <SelectValue placeholder="Select potential tier (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none"><span className="font-maplestory">No Potential</span></SelectItem>
                        {EQUIPMENT_TIERS.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            <span className="font-maplestory">{tier.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* StarForce Toggle */}
              <FormField
                control={form.control}
                name="starforceable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-maplestory">
                        StarForce Enhancement
                      </FormLabel>
                      <div className="text-sm text-muted-foreground font-maplestory">
                        Can this equipment be enhanced with StarForce?
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
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-maplestory">
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
                  const minStars = equipment?.transferredStars || 0; // Minimum is transferred stars or 0
                  return (
                    <FormItem>
                      <FormLabel className="font-maplestory">
                        Current StarForce: {field.value}★
                        {minStars > 0 && (
                          <span className="text-xs text-blue-600 ml-2">
                            (min: {minStars}★ transferred)
                          </span>
                        )}
                      </FormLabel>
                      <div className="space-y-3">
                        <FormControl>
                          <Slider
                            min={minStars}
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
                            min={minStars}
                            max={maxStars}
                            value={field.value}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const clampedValue = Math.min(Math.max(value, minStars), maxStars);
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

              <FormField
                control={form.control}
                name="targetStarForce"
                render={({ field }) => {
                  const maxStars = getMaxStarForce(watchLevel);
                  return (
                    <FormItem>
                      <FormLabel className="font-maplestory">Target StarForce: {field.value}★ (Max: {maxStars}★ for Lv.{watchLevel})</FormLabel>
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
                <div className="flex justify-between w-full">
                  <div className="flex flex-col gap-2">
                    {/* Transfer button - always show when transfer candidates exist, but disable if no callback */}
                    {currentEquipmentForTransfer && hasValidTransferCandidates && (
                      <div className="flex flex-col gap-1">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={() => onTransfer ? setShowTransferDialog(true) : undefined} 
                          disabled={!onTransfer}
                          className="font-maplestory"
                        >
                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                          Transfer StarForce
                        </Button>
                        {!onTransfer && (
                          <span className="text-xs text-muted-foreground font-maplestory">
                            Available after character creation
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-maplestory">
                      Cancel
                    </Button>
                    <Button type="submit" className="font-maplestory">
                      {isEditing ? 'Update' : 'Add'} Equipment
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* StarForce Transfer Dialog - only render when transfer callback is available */}
      {currentEquipmentForTransfer && onTransfer && (
        <StarForceTransferDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          targetEquipment={currentEquipmentForTransfer!} // Pass current form values as source equipment
          existingEquipment={availableEquipment} // Use API equipment as transfer targets
          onTransfer={handleTransfer}
        />
      )}
    </>
  );
}
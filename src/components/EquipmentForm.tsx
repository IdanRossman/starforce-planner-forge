import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier, PotentialLine } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { StarForceTransferDialog } from '@/components/StarForceTransferDialog';
import { getEquipmentBySlot, getEquipmentBySlotAndJob } from '@/services/equipmentService';
import { MapleDialog, MapleButton, ApiStatusBadge } from '@/components/shared';
import { CategorizedSelect, SelectCategory, MapleInput, StarForceSlider, FormFieldWrapper, ToggleField, StarForceSliderField } from '@/components/shared/forms';
import { usePotential } from '@/hooks/game/usePotential';
import { 
  ArrowRightLeft,
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
} from '@/components/ui/form';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import { getMaxStarForce, getDefaultTargetStarForce, getSlotIcon } from '@/lib/utils';

// Create dynamic schema that considers transferred stars
const createEquipmentSchema = (transferredStars: number = 0) => z.object({
  slot: z.string().min(1, 'Equipment slot is required'),
  type: z.enum(['armor', 'weapon', 'accessory'] as const),
  level: z.number().min(1, 'Equipment level is required').max(300, 'Level cannot exceed 300'),
  set: z.string().optional(),
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

// Create categorized equipment slots
const EQUIPMENT_SLOT_CATEGORIES: SelectCategory[] = [
  {
    name: 'Weapons',
    options: [
      { value: 'weapon', label: 'Weapon', icon: getSlotIcon('weapon') },
      { value: 'secondary', label: 'Secondary', icon: getSlotIcon('secondary') },
      { value: 'emblem', label: 'Emblem', icon: getSlotIcon('emblem') },
    ]
  },
  {
    name: 'Armor',
    options: [
      { value: 'hat', label: 'Hat', icon: getSlotIcon('hat') },
      { value: 'top', label: 'Top', icon: getSlotIcon('top') },
      { value: 'bottom', label: 'Bottom', icon: getSlotIcon('bottom') },
      { value: 'overall', label: 'Overall', icon: getSlotIcon('overall') },
      { value: 'shoes', label: 'Shoes', icon: getSlotIcon('shoes') },
      { value: 'gloves', label: 'Gloves', icon: getSlotIcon('gloves') },
      { value: 'cape', label: 'Cape', icon: getSlotIcon('cape') },
      { value: 'belt', label: 'Belt', icon: getSlotIcon('belt') },
      { value: 'shoulder', label: 'Shoulder', icon: getSlotIcon('shoulder') },
    ]
  },
  {
    name: 'Accessories', 
    options: [
      { value: 'face', label: 'Face', icon: getSlotIcon('face') },
      { value: 'eye', label: 'Eye', icon: getSlotIcon('eye') },
      { value: 'earring', label: 'Earring', icon: getSlotIcon('earring') },
      { value: 'ring1', label: 'Ring 1', icon: getSlotIcon('ring1') },
      { value: 'ring2', label: 'Ring 2', icon: getSlotIcon('ring2') },
      { value: 'ring3', label: 'Ring 3', icon: getSlotIcon('ring3') },
      { value: 'ring4', label: 'Ring 4', icon: getSlotIcon('ring4') },
      { value: 'pendant1', label: 'Pendant 1', icon: getSlotIcon('pendant1') },
      { value: 'pendant2', label: 'Pendant 2', icon: getSlotIcon('pendant2') },
    ]
  },
  {
    name: 'Special',
    options: [
      { value: 'pocket', label: 'Pocket', icon: getSlotIcon('pocket') },
      { value: 'heart', label: 'Heart', icon: getSlotIcon('heart') },
      { value: 'badge', label: 'Badge', icon: getSlotIcon('badge') },
      { value: 'medal', label: 'Medal', icon: getSlotIcon('medal') },
    ]
  }
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

// Create categorized potential tiers
const POTENTIAL_TIER_CATEGORIES: SelectCategory[] = [
  {
    name: 'Potential Tiers',
    options: [
      { value: 'none', label: 'No Potential' },
      { value: 'rare', label: 'Rare' },
      { value: 'epic', label: 'Epic' },
      { value: 'unique', label: 'Unique' },
      { value: 'legendary', label: 'Legendary' },
    ]
  }
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
  console.log('🔄 EquipmentForm render:', {
    equipmentProp: equipment?.name || 'none',
    equipmentExists: !!equipment,
    open,
    isEditing: !!equipment
  });

  const isEditing = !!equipment;

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

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      slot: defaultSlot || '',
      type: 'armor',
      level: 200,
      set: '',
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

  // Potential hook for managing potential templates
  const { 
    getPotentialTemplates, 
    formatPotentialLine, 
    createPotentialLine
  } = usePotential();

  // State for potential value management
  const [targetPotentialValue, setTargetPotentialValue] = useState<string>('');
  const [currentPotentialValue, setCurrentPotentialValue] = useState<string>('');

  // Watch for starforceable toggle and slot changes
  const watchStarforceable = form.watch('starforceable');
  const watchSlot = form.watch('slot');
  const watchLevel = form.watch('level');
  const watchCurrentStars = form.watch('currentStarForce');
  const watchType = form.watch('type');

  // Create categorized potential options based on equipment type
  const getPotentialCategories = useMemo((): SelectCategory[] => {
    if (!watchType) return [];

    const tiers: EquipmentTier[] = ['rare', 'epic', 'unique', 'legendary'];
    
    return tiers.map(tier => {
      const templates = getPotentialTemplates(watchType, tier);
      return {
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        options: templates.map(template => ({
          value: `${tier}:${template}`, // Encode tier and template in value
          label: formatPotentialLine(template),
          badges: [
            {
              text: tier.charAt(0).toUpperCase() + tier.slice(1),
              className: `text-xs px-1.5 py-0.5 rounded ${
                tier === 'rare' ? 'bg-blue-100 text-blue-800' :
                tier === 'epic' ? 'bg-purple-100 text-purple-800' :
                tier === 'unique' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`
            }
          ]
        }))
      };
    }).filter(category => category.options.length > 0); // Only show tiers that have options
  }, [watchType, getPotentialTemplates, formatPotentialLine]);

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
    // Helper function to decode potential value
    const decodePotentialValue = (value: string) => {
      const [tier, template] = value.split(':');
      return { tier: tier as EquipmentTier, template };
    };

    // Don't process transfer logic when dialog is closed to avoid form corruption
    if (!open) {
      console.log('⏸️ currentEquipmentForTransfer: Dialog closed, skipping processing');
      return null;
    }
    
    // Must have required values for transfer
    if (!watchedValues.level || watchedValues.currentStarForce === undefined || 
        watchedValues.targetStarForce === undefined || watchedValues.starforceable === undefined) {
      console.log('❌ currentEquipmentForTransfer: Missing required values', {
        level: watchedValues.level,
        currentStarForce: watchedValues.currentStarForce,
        targetStarForce: watchedValues.targetStarForce,
        starforceable: watchedValues.starforceable
      });
      return null;
    }
    
    // Get equipment name from either existing equipment or selected from dropdown
    let equipmentName = '';
    let equipmentImage = '';
    
    if (equipment) {
      // Editing existing equipment
      equipmentName = equipment.name;
      equipmentImage = equipment.image || '';
      console.log('✅ currentEquipmentForTransfer: Using existing equipment', {
        name: equipmentName,
        originalTargetStarForce: equipment.targetStarForce,
        formTargetStarForce: watchedValues.targetStarForce,
        starforceable: watchedValues.starforceable,
        isEditing,
        equipmentExists: !!equipment
      });
    } else if (watchedValues.set && availableEquipment.find(eq => eq.name === watchedValues.set)) {
      // Creating new equipment and user selected from dropdown
      const selectedEquipment = availableEquipment.find(eq => eq.name === watchedValues.set)!;
      equipmentName = selectedEquipment.name;
      equipmentImage = selectedEquipment.image || '';
      console.log('✅ currentEquipmentForTransfer: Using new equipment from dropdown', {
        name: equipmentName,
        targetStarForce: watchedValues.targetStarForce,
        selectedEquipmentStarforceable: selectedEquipment.starforceable,
        formStarforceable: watchedValues.starforceable,
        isEditing,
        equipmentExists: !!equipment
      });
    } else {
      // Creating new equipment without selecting from dropdown - no name yet
      console.log('❌ currentEquipmentForTransfer: No equipment name available', {
        isEditing,
        equipmentExists: !!equipment,
        watchedSet: watchedValues.set,
        availableEquipmentCount: availableEquipment.length
      });
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
      tier: targetPotentialValue ? decodePotentialValue(targetPotentialValue)?.tier : equipment?.tier,
      set: watchedValues.set,
      image: equipmentImage,
      actualCost: equipment?.actualCost,
    };
    
    // If user selected a different equipment from dropdown, merge that equipment's data
    if (watchedValues.set && availableEquipment.find(eq => eq.name === watchedValues.set)) {
      const selectedEquipment = availableEquipment.find(eq => eq.name === watchedValues.set)!;
      return {
        ...selectedEquipment,
        // Always prioritize form values over API values for StarForce settings
        id: baseEquipment.id, // Keep original ID for tracking
        currentStarForce: watchedValues.currentStarForce,
        targetStarForce: watchedValues.targetStarForce,
        starforceable: watchedValues.starforceable,
        // Use tier from potential selection or selected equipment
        tier: targetPotentialValue ? decodePotentialValue(targetPotentialValue)?.tier : selectedEquipment.tier,
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

  // Helper functions to handle encoded potential values
  const encodePotentialValue = (tier: EquipmentTier, template: string): string => {
    return `${tier}:${template}`;
  };

  const decodePotentialValue = (encodedValue: string): { tier: EquipmentTier; template: string } | null => {
    if (!encodedValue || encodedValue === 'none') return null;
    const [tier, ...templateParts] = encodedValue.split(':');
    const template = templateParts.join(':'); // In case template contains colons
    return { tier: tier as EquipmentTier, template };
  };

  const getTemplateFromEncodedValue = (encodedValue: string): string => {
    const decoded = decodePotentialValue(encodedValue);
    return decoded ? decoded.template : '';
  };

  // Initialize potential values from existing equipment
  useEffect(() => {
    if (equipment?.targetPotential && equipment.targetPotential.length > 0) {
      const targetTemplate = equipment.targetPotential[0].value;
      const targetTier = equipment.targetPotentialTier;
      if (targetTier) {
        setTargetPotentialValue(encodePotentialValue(targetTier, targetTemplate));
      } else {
        setTargetPotentialValue(targetTemplate);
      }
    } else {
      setTargetPotentialValue('');
    }
    
    if (equipment?.currentPotential && equipment.currentPotential.length > 0) {
      const currentTemplate = equipment.currentPotential[0].value;
      const currentTier = equipment.tier; // Use equipment tier for current potential
      if (currentTier) {
        setCurrentPotentialValue(encodePotentialValue(currentTier, currentTemplate));
      } else {
        setCurrentPotentialValue(currentTemplate);
      }
    } else {
      setCurrentPotentialValue('');
    }
  }, [equipment]);

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

    // Helper function to decode potential value
    const decodePotentialValue = (value: string) => {
      const [tier, template] = value.split(':');
      return { tier: tier as EquipmentTier, template };
    };

    if (isEditing && equipment) {
      onSave({
        ...equipment,
        ...data,
        name: data.set, // Store the selected name
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        image: equipmentImage,
        // Preserve itemType and base_attack from selected equipment or existing equipment, with fallbacks
        itemType: selectedEquipment?.itemType || equipment.itemType || data.slot,
        base_attack: selectedEquipment?.base_attack || equipment.base_attack || (data.type === 'weapon' ? 0 : undefined),
        // Include potential values
        currentPotential: currentPotentialValue ? [createPotentialLine(getTemplateFromEncodedValue(currentPotentialValue))] : undefined,
        targetPotential: targetPotentialValue ? [createPotentialLine(getTemplateFromEncodedValue(targetPotentialValue))] : undefined,
        targetPotentialTier: targetPotentialValue ? decodePotentialValue(targetPotentialValue)?.tier : undefined,
      });
    } else {
      onSave({
        id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID for new equipment
        name: data.set, // Store the selected name
        slot: data.slot as EquipmentSlot,
        type: data.type as EquipmentType,
        level: data.level,
        set: selectedEquipment?.set, // Store the actual set name from API
        currentStarForce: data.starforceable ? data.currentStarForce : 0,
        targetStarForce: data.starforceable ? data.targetStarForce : 0,
        starforceable: data.starforceable,
        image: equipmentImage,
        // Include itemType and base_attack from selected equipment with fallbacks
        itemType: selectedEquipment?.itemType || data.slot,
        base_attack: selectedEquipment?.base_attack || (data.type === 'weapon' ? 0 : undefined),
        // Include potential values
        currentPotential: currentPotentialValue ? [createPotentialLine(getTemplateFromEncodedValue(currentPotentialValue))] : undefined,
        targetPotential: targetPotentialValue ? [createPotentialLine(getTemplateFromEncodedValue(targetPotentialValue))] : undefined,
        targetPotentialTier: targetPotentialValue ? decodePotentialValue(targetPotentialValue)?.tier : undefined,
      });
    }
    onOpenChange(false);
  };

  return (
    <>
      <MapleDialog
        isVisible={isVisible}
        opacity={opacity}
        transform={transform}
        position="center"
        minWidth="800px"
        className="max-w-4xl max-h-[90vh]"
        onClose={() => onOpenChange(false)}
        character={{
          name: form.getValues('set') || equipment?.name || 'Equipment',
          image: selectedEquipmentImage || equipment?.image || '/placeholder.svg'
        }}
        bottomRightActions={
          <MapleButton variant="orange" size="sm" onClick={form.handleSubmit(onSubmit)}>
            Accept
          </MapleButton>
        }
        bottomLeftActions={undefined}
      >
        <div className="space-y-4 p-6 max-h-[calc(90vh-200px)] overflow-y-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold font-maplestory text-black mb-2">
              {isEditing ? 'Edit Equipment' : 'Add Equipment'}
            </h2>
            <p className="text-sm text-gray-700 font-maplestory">
              {isEditing 
                ? 'Update your equipment details and StarForce goals.' 
                : 'Add a new piece of equipment to track its StarForce progress.'
              }
            </p>
          </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
              {/* Equipment Slot Selection */}
              <FormFieldWrapper
                name="slot"
                label="Equipment Slot"
                control={form.control}
              >
                {(field) => (
                  <CategorizedSelect
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear equipment selection when slot changes since equipment might not be valid for new slot
                      form.setValue('set', '');
                      setSelectedEquipmentImage('');
                    }}
                    placeholder="Select equipment slot"
                    categories={EQUIPMENT_SLOT_CATEGORIES}
                    className="bg-white border-gray-300 font-maplestory w-full"
                    disabled={(isEditing && !allowSlotEdit) || (!!defaultSlot && !allowSlotEdit)}
                  />
                )}
              </FormFieldWrapper>

              {/* Second line: Equipment (main selection) */}
              <FormFieldWrapper
                name="set"
                label="Equipment"
                control={form.control}
                underText={equipmentSource === 'local' && availableEquipment.length > 0 ? (
                  <ApiStatusBadge status="local" />
                ) : undefined}
              >
                {(field) => {
                  // Create categories for equipment selection
                  const equipmentCategories: SelectCategory[] = (() => {
                    if (equipmentLoading) return [];
                    if (availableEquipment.length === 0) return [];
                    
                    // Single category with all equipment items
                    return [{
                      name: 'Available Equipment',
                      options: availableEquipment
                        .sort((a, b) => a.level - b.level) // Sort by level ascending
                        .map(eq => ({
                          value: eq.name || eq.id,
                          label: eq.name && eq.name.trim() 
                            ? `${eq.name} (Lv.${eq.level})`
                            : `Level ${eq.level} Equipment`,
                          icon: () => (
                            <EquipmentImage 
                              src={eq.image} 
                              alt={eq.name || `Equipment ${eq.id}`}
                              size="sm"
                              fallbackIcon={getSlotIcon(selectedSlot)}
                            />
                          )
                        }))
                    }];
                  })();
                  
                  if (equipmentLoading) {
                    return (
                      <div className="p-4 text-center text-sm text-muted-foreground font-maplestory border rounded-md w-full">
                        Loading equipment...
                      </div>
                    );
                  }
                  
                  if (availableEquipment.length === 0) {
                    return (
                      <div className="p-4 text-center text-sm text-muted-foreground font-maplestory border rounded-md w-full">
                        No equipment found for this slot
                      </div>
                    );
                  }
                  
                  return (
                    <CategorizedSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                          // Auto-update level based on equipment selection
                        const equipData = availableEquipment.find(eq => eq.name === value);
                        if (equipData) {
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
                          }                          // Only auto-set StarForce values for new equipment, not when editing existing equipment
                          if (!isEditing) {
                            // Set starforceable based on API data for new equipment only
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
                        }
                      }}
                      placeholder="Select equipment"
                      categories={equipmentCategories}
                      className="bg-white border-gray-300 font-maplestory w-full"
                    />
                  );
                }}
              </FormFieldWrapper>

              {/* Current Potential Selection - Only show if equipment type is selected */}
              {watchType && getPotentialCategories.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 font-maplestory">
                    Current Potential
                  </label>
                  
                  <CategorizedSelect
                    value={currentPotentialValue || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setCurrentPotentialValue('');
                      } else {
                        setCurrentPotentialValue(value);
                      }
                    }}
                    placeholder="Select current potential"
                    categories={[
                      {
                        name: 'No Potential',
                        options: [{ value: 'none', label: 'No current potential' }]
                      },
                      ...getPotentialCategories
                    ]}
                    className="bg-white border-gray-300 font-maplestory w-full"
                  />
                </div>
              )}

              {/* Target Potential Selection - Only show if equipment type is selected */}
              {watchType && getPotentialCategories.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 font-maplestory">
                    Target Potential
                  </label>
                  
                  <CategorizedSelect
                    value={targetPotentialValue || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setTargetPotentialValue('');
                      } else {
                        setTargetPotentialValue(value);
                      }
                    }}
                    placeholder="Select target potential"
                    categories={[
                      {
                        name: 'No Target',
                        options: [{ value: 'none', label: 'No target potential' }]
                      },
                      ...getPotentialCategories
                    ]}
                    className="bg-white border-gray-300 font-maplestory w-full"
                  />
                </div>
              )}

              {/* StarForce Toggle */}
              <ToggleField
                name="starforceable"
                title="StarForce Enhancement"
                description="Can this equipment be enhanced with StarForce?"
                control={form.control}
                variant="amber"
              />

              {/* StarForce Sliders - Only show if starforceable */}
              {watchStarforceable && (
                <>
                {/* Auto-adjustment notification */}
                {(autoAdjusted.current || autoAdjusted.target) && (
                  <div className="p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-maplestory">
                        Star force values auto-adjusted to match level {watchLevel} limits
                        {autoAdjusted.current && autoAdjusted.target ? ' (current & target)' : 
                         autoAdjusted.current ? ' (current)' : ' (target)'}
                      </span>
                    </div>
                  </div>
                )}

              <StarForceSliderField
                name="currentStarForce"
                title={`Current StarForce: ${watchCurrentStars}★`}
                subtitle={(() => {
                  const minStars = equipment?.transferredStars || 0;
                  return minStars > 0 ? `(min: ${minStars}★ transferred)` : undefined;
                })()}
                control={form.control}
                min={equipment?.transferredStars || 0}
                max={getMaxStarForce(watchLevel)}
              />

              <StarForceSliderField
                name="targetStarForce"
                title={`Target StarForce: ${form.watch('targetStarForce')}★`}
                subtitle={`(Max: ${getMaxStarForce(watchLevel)}★ for Lv.${watchLevel})`}
                control={form.control}
                min={0}
                max={getMaxStarForce(watchLevel)}
              />
                </>
              )}

              {/* Transfer StarForce Button - Only show when transfer is possible */}
              {currentEquipmentForTransfer && hasValidTransferCandidates && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-maplestory">
                      <Info className="w-4 h-4" />
                      <span>StarForce Transfer Available</span>
                    </div>
                    <MapleButton 
                      variant="blue"
                      size="sm"
                      type="button"
                      onClick={() => onTransfer ? setShowTransferDialog(true) : undefined} 
                      disabled={!onTransfer}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Transfer StarForce
                    </MapleButton>
                    {!onTransfer && (
                      <span className="text-xs text-muted-foreground font-maplestory text-center">
                        Available after character creation
                      </span>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </MapleDialog>

      {/* StarForce Transfer Dialog - only render when transfer callback is available */}
      {onTransfer && currentEquipmentForTransfer && (
        <StarForceTransferDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          targetEquipment={currentEquipmentForTransfer} // Pass current form values as source equipment
          existingEquipment={availableEquipment} // Use API equipment as transfer targets
          onTransfer={handleTransfer}
        />
      )}
    </>
  );
}
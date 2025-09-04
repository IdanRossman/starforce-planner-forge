import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier, PotentialLine } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { StarForceTransferDialog } from '@/components/StarForceTransferDialog';
import { getEquipmentBySlot, getEquipmentBySlotAndJob } from '@/services/equipmentService';
import { MapleDialog, MapleButton, ApiStatusBadge } from '@/components/shared';
import { SelectCategory } from '@/components/shared/forms';
import { usePotential } from '@/hooks/game/usePotential';
import { useEquipment } from '@/hooks/data/useEquipment';
import { useEquipmentFormValidation, type EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { EquipmentFormCards } from './EquipmentForm/EquipmentFormCards';
import { CompactEquipmentForm } from './EquipmentForm/CompactEquipmentForm';
import { SlimEquipmentFormCards } from './EquipmentForm/SlimEquipmentFormCards';
import { EnhancedStarForceConfigurationSection } from '@/components/EquipmentForm/EnhancedStarForceConfigurationSection';
import {
  Form,
} from '@/components/ui/form';
import { getSlotIcon } from '@/lib/utils';

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

  // Form validation hook for schema and validation logic
  const { createEquipmentSchema, equipmentSchema, getDefaultStarforceable } = useEquipmentFormValidation();

  // StarForce utilities hook for calculations and validation
  const { getMaxStars, getDefaultTarget, validateAndAdjustStarForce } = useStarForceUtils();

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
  // State to track when we last reset the form to prevent unnecessary resets
  const [lastResetKey, setLastResetKey] = useState<string>('');

  // Potential hook for managing potential templates
  const { 
    getPotentialTemplates, 
    formatPotentialLine, 
    createPotentialLine
  } = usePotential();

  // Equipment operations hook for transfer functionality
  const { canTransfer, transferStarForce } = useEquipment();

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

  // TEMPORARILY DISABLED - Real-time validation for transferred stars minimum
  // useEffect(() => {
  //   const transferredStars = equipment?.transferredStars || 0;
  //   if (transferredStars > 0 && watchCurrentStars < transferredStars) {
  //     form.setError('currentStarForce', {
  //       type: 'manual',
  //       message: `Current StarForce cannot be below ${transferredStars}★ (transferred stars)`
  //     });
  //   } else {
  //     // Clear the error if the value is valid
  //     const errors = form.formState.errors;
  //     if (errors.currentStarForce?.type === 'manual') {
  //       form.clearErrors('currentStarForce');
  //     }
  //   }
  // }, [watchCurrentStars, equipment?.transferredStars, form]);

  // TEMPORARILY DISABLED - Update form resolver when equipment changes
  // useEffect(() => {
  //   const transferredStars = equipment?.transferredStars || 0;
  //   const newSchema = createEquipmentSchema(transferredStars);
  //   form.clearErrors(); // Clear any existing validation errors
  //   // Note: We can't dynamically change the resolver in react-hook-form
  //   // So we'll rely on the UI constraints instead
  // }, [equipment, form, createEquipmentSchema]);

  // TEMPORARILY DISABLED - Update StarForce values when level changes
  // useEffect(() => {
  //   if (watchLevel && watchStarforceable) {
  //     const maxStars = getMaxStars(watchLevel);
  //     const currentTarget = form.getValues('targetStarForce');
  //     const currentCurrent = form.getValues('currentStarForce');
  //     let adjustments = {};
      
  //     // Only clamp values if they exceed the maximum allowed
  //     if (currentCurrent > maxStars) {
  //       form.setValue('currentStarForce', maxStars);
  //       adjustments = { ...adjustments, current: true };
  //     }
      
  //     if (currentTarget > maxStars) {
  //       form.setValue('targetStarForce', maxStars);
  //       adjustments = { ...adjustments, target: true };
  //     }
      
  //     // Set auto-adjustment tracking and clear after 3 seconds
  //     if (Object.keys(adjustments).length > 0) {
  //       setAutoAdjusted(adjustments);
  //       setTimeout(() => setAutoAdjusted({}), 3000);
  //     }
  //   }
  // }, [watchLevel, equipment, watchStarforceable, form, getMaxStars]);

  // Note: Removed auto-reset of starforceable when slot changes to allow user input

  // Reset form when dialog opens/closes or equipment changes (FIXED)
  useEffect(() => {
    if (open) {
      // Create a unique key for this dialog state
      const currentResetKey = `${defaultSlot || 'new'}-${equipment?.id || 'new'}`;
      
      // Only reset if this is a different slot/equipment combination than last time
      if (currentResetKey !== lastResetKey) {
        if (equipment) {
          // Editing existing equipment - populate with equipment data
          form.reset({
            slot: equipment.slot,
            type: equipment.type,
            level: equipment.level,
            set: equipment.name || equipment.set || '',
            currentStarForce: equipment.currentStarForce,
            targetStarForce: equipment.targetStarForce,
            starforceable: equipment.starforceable,
          });
          
          setSelectedEquipmentImage(equipment.image || '');
        } else {
          // New equipment - clean slate
          const defaultLevel = 200;
          const defaultTarget = getDefaultTarget(defaultLevel);
          
          form.reset({
            slot: defaultSlot || '',
            type: 'armor',
            level: defaultLevel,
            set: '',
            currentStarForce: 0,
            targetStarForce: defaultTarget,
            starforceable: false,
          });
          
          setSelectedEquipmentImage('');
          setCurrentPotentialValue('');
          setTargetPotentialValue('');
        }
        
        // Update the reset key
        setLastResetKey(currentResetKey);
      }
    } else {
      // Dialog closed - clear the reset key so next open will reset properly
      setLastResetKey('');
    }
  }, [open, equipment, defaultSlot, form, getDefaultTarget, setCurrentPotentialValue, setTargetPotentialValue, setSelectedEquipmentImage, lastResetKey, setLastResetKey]);

  const selectedSlot = form.watch('slot');
  
  // TEMPORARILY DISABLED - Reset form when slot actually changes (not on equipment selection)
  // useEffect(() => {
  //   if (open && selectedSlot && !equipment && selectedSlot !== previousSlot) {
  //     // Only reset when the slot actually changes, not when equipment is selected
  //     const defaultLevel = 200;
  //     const defaultTarget = getDefaultTarget(defaultLevel);
      
  //     // Reset the form for new slot
  //     form.reset({
  //       slot: selectedSlot,
  //       type: 'armor',
  //       level: defaultLevel,
  //       set: '',
  //       currentStarForce: 0,
  //       targetStarForce: defaultTarget,
  //       starforceable: false,
  //     });
      
  //     // Clear all additional state
  //     setCurrentPotentialValue('');
  //     setTargetPotentialValue('');
  //     setSelectedEquipmentImage('');
      
  //     // Update previous slot tracking
  //     setPreviousSlot(selectedSlot);
      
  //     // Clear errors
  //     setTimeout(() => {
  //       form.clearErrors();
  //     }, 0);
  //   } else if (selectedSlot && selectedSlot !== previousSlot) {
  //     // Just update tracking if not resetting
  //     setPreviousSlot(selectedSlot);
  //   }
  // }, [selectedSlot, open, equipment, previousSlot, form, getDefaultTarget, setCurrentPotentialValue, setTargetPotentialValue, setSelectedEquipmentImage]);
  
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
      return null;
    }
    
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

  // Handle transfer completion using the useEquipment hook
  const handleTransfer = (sourceEquipment: Equipment, targetEquipment: Equipment, targetCurrentStars: number, targetTargetStars: number) => {
    console.log('🚀 EquipmentForm handleTransfer called with:', {
      sourceEquipment: { id: sourceEquipment.id, name: sourceEquipment.name },
      targetEquipment: { id: targetEquipment.id, name: targetEquipment.name },
      targetCurrentStars,
      targetTargetStars,
      hasOnTransfer: !!onTransfer
    });

    // Create updated equipment with form values for transfer
    const updatedSourceEquipment: Equipment = {
      ...sourceEquipment,
      currentStarForce: sourceEquipment.targetStarForce || 0, // Use target as current for transfer
    };
    
    const updatedTargetEquipment: Equipment = {
      ...targetEquipment,
      currentStarForce: targetCurrentStars,
      targetStarForce: targetTargetStars,
    };
    
    console.log('📦 Prepared equipment for transfer:', {
      updatedSource: { id: updatedSourceEquipment.id, currentStars: updatedSourceEquipment.currentStarForce, targetStars: updatedSourceEquipment.targetStarForce },
      updatedTarget: { id: updatedTargetEquipment.id, currentStars: updatedTargetEquipment.currentStarForce, targetStars: updatedTargetEquipment.targetStarForce }
    });

    // Use the hook's enhanced transfer function - it handles all the complex logic
    transferStarForce(
      updatedSourceEquipment, 
      updatedTargetEquipment, 
      targetCurrentStars, 
      targetTargetStars,
      existingEquipment || [],
      onTransfer // Pass the onTransfer callback to the hook
    );
    console.log('🔚 Closing transfer dialog');
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
        // Include potential values as strings
        currentPotentialValue: currentPotentialValue || undefined,
        targetPotentialValue: targetPotentialValue || undefined,
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
        // Include potential values as strings
        currentPotentialValue: currentPotentialValue || undefined,
        targetPotentialValue: targetPotentialValue || undefined,
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
        minWidth="900px"
        className="max-w-5xl max-h-[90vh] mx-auto"
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
              {/* Slim Equipment Form Cards */}
              <SlimEquipmentFormCards
                form={form}
                equipment={equipment}
                isEditing={isEditing}
                slotCategories={EQUIPMENT_SLOT_CATEGORIES}
                allowSlotEdit={allowSlotEdit}
                defaultSlot={defaultSlot}
                availableEquipment={availableEquipment}
                equipmentLoading={equipmentLoading}
                equipmentSource={equipmentSource}
                selectedSlot={selectedSlot}
                selectedEquipmentImage={selectedEquipmentImage}
                setSelectedEquipmentImage={setSelectedEquipmentImage}
                currentPotentialValue={currentPotentialValue}
                setCurrentPotentialValue={setCurrentPotentialValue}
                targetPotentialValue={targetPotentialValue}
                setTargetPotentialValue={setTargetPotentialValue}
                getPotentialCategories={getPotentialCategories}
                watchStarforceable={watchStarforceable}
                watchLevel={watchLevel}
                autoAdjusted={autoAdjusted}
                hasValidTransferCandidates={hasValidTransferCandidates}
                currentEquipmentForTransfer={currentEquipmentForTransfer}
                setShowTransferDialog={setShowTransferDialog}
              />
            </form>
          </Form>
        </div>
      </MapleDialog>

      {/* StarForce Transfer Dialog */}
      {currentEquipmentForTransfer && (
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
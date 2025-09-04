import { z } from 'zod';
import { getMaxStarForce } from '@/lib/utils';

/**
 * Hook for managing equipment form validation logic
 * Provides dynamic schema creation and validation rules for equipment forms
 */
export function useEquipmentFormValidation() {
  
  /**
   * Helper function to determine default starforceable status based on slot
   */
  const getDefaultStarforceable = (slot: string): boolean => {
    const nonStarforceableSlots = ['pocket', 'emblem', 'badge', 'secondary'];
    return !nonStarforceableSlots.includes(slot);
  };

  /**
   * Creates a dynamic equipment validation schema that considers transferred stars
   * @param transferredStars - Number of stars already transferred to this equipment
   * @returns Zod schema for equipment validation
   */
  const createEquipmentSchema = (transferredStars: number = 0) => z.object({
    slot: z.string().min(1, 'Equipment slot is required'),
    type: z.string(), // Allow any equipment type string from API
    level: z.number().min(1, 'Equipment level is required').max(300, 'Level cannot exceed 300'),
    set: z.string().optional(),
    currentStarForce: z.number().min(
      transferredStars, 
      transferredStars > 0 
        ? `Current StarForce cannot be below ${transferredStars}★ (transferred stars)` 
        : 'Current StarForce must be at least 0'
    ),
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

  /**
   * Validates StarForce values against equipment level constraints
   * @param level - Equipment level
   * @param currentStarForce - Current StarForce value
   * @param targetStarForce - Target StarForce value
   * @param starforceable - Whether the equipment can be starforced
   * @returns Validation result with error messages
   */
  const validateStarForce = (
    level: number, 
    currentStarForce: number, 
    targetStarForce: number, 
    starforceable: boolean
  ) => {
    const errors: string[] = [];
    
    if (!starforceable) {
      // Non-starforceable items should have 0 stars
      if (currentStarForce > 0 || targetStarForce > 0) {
        errors.push('This equipment type cannot be starforced');
      }
      return { isValid: errors.length === 0, errors };
    }

    const maxStars = getMaxStarForce(level);
    
    if (currentStarForce > maxStars) {
      errors.push(`Current StarForce cannot exceed ${maxStars}★ for level ${level} equipment`);
    }
    
    if (targetStarForce > maxStars) {
      errors.push(`Target StarForce cannot exceed ${maxStars}★ for level ${level} equipment`);
    }
    
    if (targetStarForce < currentStarForce) {
      errors.push('Target StarForce must be greater than or equal to current StarForce');
    }

    return { isValid: errors.length === 0, errors };
  };

  /**
   * Validates equipment slot requirements
   * @param slot - Equipment slot value
   * @returns Validation result
   */
  const validateSlot = (slot: string) => {
    if (!slot || slot.trim().length === 0) {
      return { isValid: false, error: 'Equipment slot is required' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Validates equipment level requirements
   * @param level - Equipment level value
   * @returns Validation result
   */
  const validateLevel = (level: number) => {
    if (level < 1) {
      return { isValid: false, error: 'Equipment level is required' };
    }
    if (level > 300) {
      return { isValid: false, error: 'Level cannot exceed 300' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Gets the inferred TypeScript type for the equipment form data
   */
  type EquipmentFormData = z.infer<typeof equipmentSchema>;

  return {
    // Schema functions
    createEquipmentSchema,
    equipmentSchema,
    
    // Validation functions
    validateStarForce,
    validateSlot,
    validateLevel,
    getDefaultStarforceable,
    
    // Types
    type: {} as EquipmentFormData, // Type helper for TypeScript inference
  };
}

// Export the type for use in components
export type EquipmentFormData = z.infer<ReturnType<typeof useEquipmentFormValidation>['equipmentSchema']>;

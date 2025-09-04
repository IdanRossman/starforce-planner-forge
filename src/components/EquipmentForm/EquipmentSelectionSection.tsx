import { useFormContext } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { Equipment } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { getSlotIcon } from '@/lib/utils';
import { CategorizedSelect, SelectCategory, FormFieldWrapper } from '@/components/shared/forms';
import { ApiStatusBadge } from '@/components/shared';
import type { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';

interface EquipmentSelectionSectionProps {
  // Equipment slot configuration
  slotCategories: SelectCategory[];
  allowSlotEdit: boolean;
  defaultSlot?: string;
  isEditing: boolean;
  
  // Equipment data state
  availableEquipment: Equipment[];
  equipmentLoading: boolean;
  equipmentSource: 'api' | 'local';
  selectedSlot: string;
  
  // Image state management
  selectedEquipmentImage: string;
  setSelectedEquipmentImage: (image: string) => void;
}

/**
 * Component for handling equipment slot and equipment selection
 * Includes both slot selection and equipment dropdown with API data
 */
export function EquipmentSelectionSection({
  slotCategories,
  allowSlotEdit,
  defaultSlot,
  isEditing,
  availableEquipment,
  equipmentLoading,
  equipmentSource,
  selectedSlot,
  selectedEquipmentImage,
  setSelectedEquipmentImage
}: EquipmentSelectionSectionProps) {
  const form = useFormContext<EquipmentFormData>();

  // TEMPORARILY DISABLED - Clear equipment selection only when slot changes and equipment becomes invalid
  // useEffect(() => {
  //   if (!isEditing && availableEquipment.length > 0) {
  //     const currentSet = form.getValues('set');
  //     if (currentSet) {
  //       // Check if current selection is valid for current slot
  //       const isValidForSlot = availableEquipment.some(eq => 
  //         (eq.name || eq.id) === currentSet
  //       );
        
  //       if (!isValidForSlot) {
  //         // Only clear if the current selection is not valid for this slot
  //         form.setValue('set', '');
  //         setSelectedEquipmentImage('');
  //       }
  //     }
  //   }
  // }, [selectedSlot, availableEquipment, isEditing, form, setSelectedEquipmentImage]);

  // Create categories for equipment selection - memoized to prevent infinite re-renders
  const equipmentCategories: SelectCategory[] = useMemo(() => {
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
  }, [availableEquipment, equipmentLoading, selectedSlot]);

  return (
    <>
      {/* Equipment Slot Selection - Hidden but still controlled */}
      <input 
        type="hidden" 
        {...form.register('slot')}
        value={selectedSlot}
      />

      {/* Equipment Selection */}
      <FormFieldWrapper
        name="set"
        label="Equipment"
        control={form.control}
        underText={equipmentSource === 'local' && availableEquipment.length > 0 ? (
          <ApiStatusBadge status="local" />
        ) : undefined}
      >
        {(field) => {
          if (equipmentLoading) {
            return (
              <div className="p-4 text-center text-sm text-muted-foreground font-maplestory border rounded-md w-full">
                Loading equipment data...
              </div>
            );
          }

          if (availableEquipment.length === 0) {
            return (
              <div className="p-4 text-center text-sm text-muted-foreground font-maplestory border rounded-md w-full">
                {equipmentSource === 'api' 
                  ? 'No equipment found for this slot and job'
                  : 'Equipment data not available - using manual entry'
                }
              </div>
            );
          }

          return (
            <CategorizedSelect
              value={field.value}
              onValueChange={(value) => {
                console.log('Equipment selection changed to:', value);
                
                // Find the selected equipment and set its details
                const selectedEquipment = availableEquipment.find(eq => 
                  (eq.name || eq.id) === value
                );
                
                if (selectedEquipment) {
                  console.log('Found selected equipment:', selectedEquipment);
                  const equipData = selectedEquipment;
                  
                  // Use a timeout to ensure other effects don't interfere
                  setTimeout(() => {
                    // Map slot to correct equipment type for potential API
                    const getEquipmentTypeFromSlot = (slot: string): string => {
                      // Complete mapping for all equipment types
                      const slotMapping: Record<string, string> = {
                        // Rings and pendants (multi-slot items)
                        'ring1': 'ring', 'ring2': 'ring', 'ring3': 'ring', 'ring4': 'ring',
                        'pendant1': 'pendant', 'pendant2': 'pendant',
                        // Accessories
                        'face': 'face',
                        'eye': 'eye', 
                        'earring': 'accessory',
                        // Armor pieces
                        'hat': 'hat',
                        'top': 'top',
                        'bottom': 'bottom',
                        'shoes': 'shoes',
                        'shoulder': 'shoulder',
                        'gloves': 'gloves',
                        'cape': 'cape',
                        // Special items
                        'emblem': 'emblem',
                        'secondary': 'secondary',
                        'heart': 'heart',
                        'badge': 'badge'
                      };
                      
                      return slotMapping[slot] || equipData.type; // Fallback to original type
                    };
                    
                    // Update all fields at once to prevent conflicts
                    const updates = {
                      set: value,
                      type: getEquipmentTypeFromSlot(equipData.slot), // Use mapped type
                      level: equipData.level,
                      starforceable: equipData.starforceable ?? false,
                      currentStarForce: equipData.starforceable ? (equipData.currentStarForce ?? 0) : 0,
                      targetStarForce: equipData.starforceable ? (equipData.targetStarForce ?? 15) : 0,
                    };
                    
                    console.log('Applying updates:', updates);
                    
                    // Apply all updates
                    Object.entries(updates).forEach(([key, val]) => {
                      form.setValue(key as keyof typeof updates, val, { 
                        shouldValidate: true,
                        shouldDirty: true 
                      });
                    });
                    
                    // Set the image
                    setSelectedEquipmentImage(equipData.image || '');
                  }, 0);
                } else {
                  console.log('Equipment not found, just setting value');
                  // Just update the set field if equipment not found
                  field.onChange(value);
                }
              }}
              placeholder="Select equipment"
              categories={equipmentCategories}
              className="bg-white border-gray-300 font-maplestory w-full"
            />
          );
        }}
      </FormFieldWrapper>
    </>
  );
}

import { useFormContext } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { Info } from 'lucide-react';

/**
 * Component for displaying auto-determined equipment details
 * Shows read-only information based on equipment selection
 */
export function EquipmentDetailsSection() {
  const form = useFormContext<EquipmentFormData>();
  
  const equipmentType = form.watch('type');
  const equipmentLevel = form.watch('level');
  const equipmentSlot = form.watch('slot');
  const equipmentName = form.watch('set');

  // Only show if we have equipment selected
  if (!equipmentName) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-maplestory font-semibold text-gray-900 mb-2">Equipment Details</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-maplestory mb-1">Type</p>
              <Badge variant="secondary" className="font-maplestory">
                {equipmentType?.charAt(0).toUpperCase() + equipmentType?.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-gray-600 font-maplestory mb-1">Level</p>
              <Badge variant="secondary" className="font-maplestory">
                Lv. {equipmentLevel}
              </Badge>
            </div>
            <div>
              <p className="text-gray-600 font-maplestory mb-1">Slot</p>
              <Badge variant="secondary" className="font-maplestory">
                {equipmentSlot?.charAt(0).toUpperCase() + equipmentSlot?.slice(1)}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-maplestory mt-2">
            These details are automatically determined from your equipment selection
          </p>
        </div>
      </div>
    </Card>
  );
}

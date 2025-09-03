import { Equipment } from '@/types';
import { MapleButton } from '@/components/shared';
import { ArrowRightLeft, Info } from 'lucide-react';

interface TransferActionsSectionProps {
  // Transfer state
  currentEquipmentForTransfer?: Equipment;
  hasValidTransferCandidates: boolean;
  setShowTransferDialog: (show: boolean) => void;
  
  // Form context  
  isEditing: boolean;
  onTransfer?: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
}

/**
 * Component for handling StarForce transfer actions
 * Shows transfer button when transfer is possible
 */
export function TransferActionsSection({
  currentEquipmentForTransfer,
  hasValidTransferCandidates,
  setShowTransferDialog,
  isEditing,
  onTransfer
}: TransferActionsSectionProps) {
  
  // Only show transfer section if transfer is possible
  if (!currentEquipmentForTransfer || !hasValidTransferCandidates) {
    return null;
  }

  return (
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
          onClick={() => setShowTransferDialog(true)} 
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Transfer StarForce
        </MapleButton>
      </div>
    </div>
  );
}

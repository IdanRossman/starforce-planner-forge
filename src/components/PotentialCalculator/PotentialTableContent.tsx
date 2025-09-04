import { TableBody } from "@/components/ui/table";
import { Equipment } from "@/types";
import { PotentialBulkItemResult } from "@/services/potentialService";
import { PotentialTableRow } from "./PotentialTableRow";

interface PotentialTableContentProps {
  potentialEquipment: Equipment[];
  calculationResults: Map<string, PotentialBulkItemResult>;
  isCalculating: boolean;
  onUpdateCubeType?: (equipmentName: string, cubeType: 'red' | 'black') => void;
  onUpdatePotential?: (equipmentId: string, currentPotential: string, targetPotential: string) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  isItemIncluded: (id: string) => boolean;
  toggleItemIncluded: (id: string) => void;
  smartOptimizationEnabled?: boolean;
  resetUserModifications?: number;
}

export function PotentialTableContent({
  potentialEquipment,
  calculationResults,
  isCalculating,
  onUpdateCubeType,
  onUpdatePotential,
  onSaveEquipment,
  onSaveAdditionalEquipment,
  isItemIncluded,
  toggleItemIncluded,
  smartOptimizationEnabled = false,
  resetUserModifications = 0
}: PotentialTableContentProps) {
  return (
    <TableBody>
      {potentialEquipment.map((item) => {
        const calculation = calculationResults.get(item.name);
        
        return (
          <PotentialTableRow
            key={item.id}
            equipment={item}
            calculation={calculation}
            isCalculating={isCalculating}
            onUpdateCubeType={onUpdateCubeType}
            onUpdatePotential={onUpdatePotential}
            onSaveEquipment={onSaveEquipment}
            onSaveAdditionalEquipment={onSaveAdditionalEquipment}
            isItemIncluded={isItemIncluded}
            toggleItemIncluded={toggleItemIncluded}
            smartOptimizationEnabled={smartOptimizationEnabled}
            resetUserModifications={resetUserModifications}
          />
        );
      })}
    </TableBody>
  );
}

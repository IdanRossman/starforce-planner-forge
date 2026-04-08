import { useMemo } from "react";
import { Equipment } from "@/types";
import { PotentialBulkItemResult } from "@/services/potentialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PotentialTableHeader } from "./PotentialTableHeader";
import { PotentialTableContent } from "./PotentialTableContent";
import { PotentialMobileCard } from "./PotentialTableRow";
import { useIsMobile } from "@/hooks/use-mobile";
import { Zap } from "lucide-react";

interface PotentialCalculatorTableProps {
  equipment: Equipment[];
  additionalEquipment?: Equipment[];
  calculationResults: Map<string, PotentialBulkItemResult>;
  isCalculating: boolean;
  onUpdateCubeType?: (equipmentId: string, cubeType: 'red' | 'black') => void;
  onUpdatePotential?: (equipmentId: string, currentPotential: string, targetPotential: string) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  isItemIncluded: (id: string) => boolean;
  toggleItemIncluded: (id: string) => void;
  smartOptimizationEnabled?: boolean;
  resetUserModifications?: number;
}

export function PotentialCalculatorTable({
  equipment,
  additionalEquipment = [],
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
}: PotentialCalculatorTableProps) {
  const isMobile = useIsMobile();

  const potentialEquipment = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.filter(eq => {
      const hasCurrentPotential = eq.currentPotentialValue && eq.currentPotentialValue.trim() !== '';
      const hasTargetPotential = eq.targetPotentialValue && eq.targetPotentialValue.trim() !== '';
      if (!hasCurrentPotential && !hasTargetPotential) return false;
      return eq.currentPotentialValue !== eq.targetPotentialValue;
    });
  }, [equipment, additionalEquipment]);

  if (potentialEquipment.length === 0) {
    return (
      <div className="border border-white/10 bg-[hsl(217_33%_9%)] rounded-xl p-12 text-center">
        <Zap className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <p className="text-sm font-maplestory text-white/40">No potential goals set — add targets to your equipment to see cost estimates.</p>
      </div>
    );
  }

  const tableHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
      <p className="text-sm font-bold text-white font-maplestory">Potential Planning</p>
      {isCalculating && (
        <span className="text-[10px] font-maplestory text-white/40 animate-pulse uppercase tracking-widest">Calculating…</span>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="border border-white/10 bg-[hsl(217_33%_9%)] rounded-xl overflow-hidden">
        {tableHeader}
        <div className="p-3 space-y-2">
          {potentialEquipment.map(item => (
            <PotentialMobileCard
              key={item.id}
              equipment={item}
              calculation={calculationResults.get(item.name)}
              isCalculating={isCalculating}
              onUpdateCubeType={onUpdateCubeType}
              onUpdatePotential={onUpdatePotential}
              isItemIncluded={isItemIncluded}
              toggleItemIncluded={toggleItemIncluded}
              smartOptimizationEnabled={smartOptimizationEnabled}
              resetUserModifications={resetUserModifications}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[hsl(217_33%_9%)] rounded-xl overflow-hidden">
      {tableHeader}
      <div className="overflow-x-auto">
        <Table>
          <PotentialTableHeader />
          <PotentialTableContent
            potentialEquipment={potentialEquipment}
            calculationResults={calculationResults}
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
        </Table>
      </div>
    </div>
  );
}

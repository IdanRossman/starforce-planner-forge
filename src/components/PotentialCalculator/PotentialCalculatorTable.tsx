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
      <Card>
        <CardContent className="p-8 text-center">
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2 font-maplestory">No Potential Goals Set</h3>
          <p className="text-muted-foreground mb-4 font-maplestory">
            Add potential goals to your equipment to see cost calculations and optimization suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cardHeader = (
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 font-maplestory">
        <Zap className="w-5 h-5 text-purple-500" />
        {isMobile ? 'Potential' : 'Potential Enhancement Calculations'}
        <Badge variant="secondary" className="ml-2 font-maplestory bg-purple-500/20 text-purple-600">
          {potentialEquipment.length} item{potentialEquipment.length !== 1 ? 's' : ''}
        </Badge>
        {isCalculating && (
          <Badge variant="secondary" className="ml-2 font-maplestory bg-blue-500/20 text-blue-600 animate-pulse">
            Calculating...
          </Badge>
        )}
      </CardTitle>
    </CardHeader>
  );

  if (isMobile) {
    return (
      <Card>
        {cardHeader}
        <CardContent className="p-3 space-y-2">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {cardHeader}
      <CardContent className="p-0">
        <div className="rounded-md border border-border overflow-hidden">
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
      </CardContent>
    </Card>
  );
}

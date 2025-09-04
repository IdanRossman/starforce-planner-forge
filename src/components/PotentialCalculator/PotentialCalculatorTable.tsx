import { useMemo } from "react";
import { Equipment } from "@/types";
import { PotentialBulkItemResult } from "@/services/potentialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PotentialTableHeader } from "./PotentialTableHeader";
import { PotentialTableContent } from "./PotentialTableContent";
import { Zap, AlertCircle } from "lucide-react";

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
  // Filter equipment that has potential configuration and current != target (show only incomplete)
  const potentialEquipment = useMemo(() => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.filter(eq => {
      // Must have at least one potential value set
      const hasCurrentPotential = eq.currentPotentialValue && eq.currentPotentialValue.trim() !== '';
      const hasTargetPotential = eq.targetPotentialValue && eq.targetPotentialValue.trim() !== '';
      
      if (!hasCurrentPotential && !hasTargetPotential) {
        return false; // No potential values set
      }
      
      // Show only if current != target (incomplete goals)
      return eq.currentPotentialValue !== eq.targetPotentialValue;
    });
  }, [equipment, additionalEquipment]);

  // Show message if no potential equipment
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-maplestory">
          <Zap className="w-5 h-5 text-purple-500" />
          Potential Enhancement Calculations
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

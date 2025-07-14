import { useState } from "react";
import { Equipment } from "@/types";
import { calculateStarForce } from "@/components/StarForceCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calculator, 
  Coins, 
  Package, 
  Target,
  Sword,
  Shield,
  Crown,
  Shirt,
  Footprints,
  Hand,
  Gem,
  Eye,
  Ear,
  Heart,
  Star
} from "lucide-react";

interface StarForceTableProps {
  equipment: Equipment[];
}

interface CalculationRow {
  equipment: Equipment;
  sparesCount: number;
  expectedCost: number;
  expectedSpares: number;
  isCalculated: boolean;
}

// Equipment slot icons mapping
const getSlotIcon = (slot: string) => {
  const iconMap: { [key: string]: any } = {
    weapon: Sword,
    secondary: Shield,
    emblem: Star,
    hat: Crown,
    top: Shirt,
    bottom: Shirt,
    overall: Shirt,
    shoes: Footprints,
    gloves: Hand,
    cape: Shield,
    belt: Shield,
    shoulder: Shield,
    face: Eye,
    eye: Eye,
    earring: Ear,
    ring1: Gem,
    ring2: Gem,
    ring3: Gem,
    ring4: Gem,
    pendant1: Gem,
    pendant2: Gem,
    pocket: Package,
    heart: Heart,
    badge: Star,
  };
  
  const IconComponent = iconMap[slot] || Package;
  return <IconComponent className="w-4 h-4" />;
};

const formatMesos = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
};

const getTierColor = (tier: string) => {
  const colors = {
    rare: 'bg-blue-500/20 text-blue-400',
    epic: 'bg-purple-500/20 text-purple-400',
    unique: 'bg-yellow-500/20 text-yellow-400',
    legendary: 'bg-green-500/20 text-green-400'
  };
  return colors[tier as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
};

const getDangerColor = (currentStars: number) => {
  if (currentStars >= 20) return 'text-red-400';
  if (currentStars >= 15) return 'text-yellow-400';
  return 'text-green-400';
};

export function StarForceTable({ equipment }: StarForceTableProps) {
  const [calculations, setCalculations] = useState<CalculationRow[]>(
    equipment.map(eq => ({
      equipment: eq,
      sparesCount: 0,
      expectedCost: 0,
      expectedSpares: 0,
      isCalculated: false,
    }))
  );

  const updateSparesCount = (equipmentId: string, count: number) => {
    setCalculations(prev => 
      prev.map(calc => 
        calc.equipment.id === equipmentId 
          ? { ...calc, sparesCount: Math.max(0, count) }
          : calc
      )
    );
  };

  const calculateAll = () => {
    setCalculations(prev => 
      prev.map(calc => {
        const { equipment } = calc;
        const starForceCalc = calculateStarForce(
          equipment.currentStarForce, 
          equipment.targetStarForce, 
          equipment.tier
        );
        
        // Estimate spares needed (simplified calculation)
        const expectedSpares = Math.ceil(starForceCalc.averageBooms * 1.2);
        
        return {
          ...calc,
          expectedCost: starForceCalc.averageCost,
          expectedSpares,
          isCalculated: true,
        };
      })
    );
  };

  const totalCost = calculations.reduce((sum, calc) => sum + calc.expectedCost, 0);
  const totalSpares = calculations.reduce((sum, calc) => sum + calc.expectedSpares, 0);
  const hasCalculations = calculations.some(calc => calc.isCalculated);

  return (
    <Card className="bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            StarForce Bulk Calculator
          </CardTitle>
          <Button onClick={calculateAll} className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Calculate All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead className="text-center">Current ★</TableHead>
                <TableHead className="text-center">Target ★</TableHead>
                <TableHead className="text-center">Current Spares</TableHead>
                <TableHead className="text-center">Expected Cost</TableHead>
                <TableHead className="text-center">Spares Needed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow key={calc.equipment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getSlotIcon(calc.equipment.slot)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {calc.equipment.set 
                            ? `${calc.equipment.set}` 
                            : `Lv.${calc.equipment.level} Equipment`
                          }
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getTierColor(calc.equipment.tier)}>
                            {calc.equipment.tier}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {calc.equipment.slot}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${getDangerColor(calc.equipment.currentStarForce)}`}>
                      ★{calc.equipment.currentStarForce}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-primary">
                      ★{calc.equipment.targetStarForce}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      value={calc.sparesCount}
                      onChange={(e) => updateSparesCount(calc.equipment.id, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="0"
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {calc.isCalculated ? (
                      <span className="font-semibold text-maple-gold">
                        {formatMesos(calc.expectedCost)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {calc.isCalculated ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">
                          {calc.expectedSpares}
                        </span>
                        {calc.sparesCount < calc.expectedSpares && (
                          <span className="text-xs text-red-400">
                            Need {calc.expectedSpares - calc.sparesCount} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hasCalculations && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total Summary
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                <Coins className="w-5 h-5 text-maple-gold" />
                <div>
                  <span className="text-sm text-muted-foreground">Total Expected Cost</span>
                  <p className="text-lg font-bold text-maple-gold">
                    {formatMesos(totalCost)} mesos
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <span className="text-sm text-muted-foreground">Total Spares Needed</span>
                  <p className="text-lg font-bold text-primary">
                    {totalSpares} items
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
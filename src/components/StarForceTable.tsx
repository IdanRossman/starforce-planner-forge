import { useState, useEffect, useMemo } from "react";
import { Equipment } from "@/types";
import { calculateStarForce } from "@/components/StarForceCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  starForceItems: Equipment[];
  onAddStarForceItem: () => void;
  onRemoveStarForceItem: (id: string) => void;
}

interface StarForceEvents {
  fiveTenFifteen: boolean;
  thirtyPercentOff: boolean;
}

interface CalculationRow {
  equipment: Equipment;
  sparesCount: number;
  starCatching: boolean;
  safeguard: boolean;
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
    rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    unique: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    legendary: 'bg-green-500/20 text-green-400 border-green-500/30'
  };
  return colors[tier as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

const getDangerColor = (currentStars: number) => {
  if (currentStars >= 20) return 'text-red-400';
  if (currentStars >= 15) return 'text-yellow-400';
  return 'text-green-400';
};

export function StarForceTable({ equipment, starForceItems, onAddStarForceItem, onRemoveStarForceItem }: StarForceTableProps) {
  // Filter equipped items that haven't reached target stars
  const incompleteEquipment = useMemo(
    () => equipment.filter(eq => eq.currentStarForce < eq.targetStarForce),
    [equipment]
  );
  
  // Combine incomplete equipped items with standalone starforce items
  const allStarForceItems = useMemo(
    () => [...incompleteEquipment, ...starForceItems],
    [incompleteEquipment, starForceItems]
  );
  
  // Event states
  const [events, setEvents] = useState<StarForceEvents>({
    fiveTenFifteen: false,
    thirtyPercentOff: false,
  });
  
  const [calculations, setCalculations] = useState<CalculationRow[]>([]);

  // Update calculations when items change
  useEffect(() => {
    const existingCalcs = new Map(calculations.map(calc => [calc.equipment.id, calc]));
    const newCalculations = allStarForceItems.map(eq => 
      existingCalcs.get(eq.id) || {
        equipment: eq,
        sparesCount: 0,
        starCatching: false,
        safeguard: false,
        expectedCost: 0,
        expectedSpares: 0,
        isCalculated: false,
      }
    );
    setCalculations(newCalculations);
  }, [allStarForceItems]);

  const updateSparesCount = (equipmentId: string, count: number) => {
    setCalculations(prev => 
      prev.map(calc => 
        calc.equipment.id === equipmentId 
          ? { ...calc, sparesCount: Math.max(0, count) }
          : calc
      )
    );
  };

  const updateStarCatching = (equipmentId: string, enabled: boolean) => {
    setCalculations(prev => 
      prev.map(calc => 
        calc.equipment.id === equipmentId 
          ? { ...calc, starCatching: enabled, isCalculated: false }
          : calc
      )
    );
  };

  const updateSafeguard = (equipmentId: string, enabled: boolean) => {
    setCalculations(prev => 
      prev.map(calc => 
        calc.equipment.id === equipmentId 
          ? { ...calc, safeguard: enabled, isCalculated: false }
          : calc
      )
    );
  };

  const calculateAll = () => {
    setCalculations(prev => 
      prev.map(calc => {
        const { equipment, starCatching, safeguard } = calc;
        
        // Apply event modifiers
        let costMultiplier = 1;
        let successRateBonus = 0;
        
        if (events.thirtyPercentOff) {
          costMultiplier *= 0.7;
        }
        if (events.fiveTenFifteen) {
          successRateBonus = 0.1;
        }
        
        const starForceCalc = calculateStarForce(
          equipment.level || 150,
          equipment.currentStarForce, 
          equipment.targetStarForce, 
          equipment.tier || "epic",
          "Regular",
          { 
            costMultiplier, 
            successRateBonus,
            starCatching,
            safeguard
          }
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
          <div className="flex items-center gap-2">
            <Button 
              onClick={onAddStarForceItem}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Add Equipment
            </Button>
            <Button onClick={calculateAll} className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculate All
            </Button>
          </div>
        </div>
        
        {/* Event Toggles */}
        <div className="space-y-4 pt-4">
          <div>
            <h4 className="text-sm font-medium mb-3 text-foreground">StarForce Events</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fiveTenFifteen"
                  checked={events.fiveTenFifteen}
                  onCheckedChange={(checked) => 
                    setEvents(prev => ({ 
                      ...prev, 
                      fiveTenFifteen: checked
                    }))
                  }
                />
                <Label htmlFor="fiveTenFifteen" className="text-sm">
                  5/10/15 Event (+10% success at ★5, ★10, ★15)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="thirtyPercentOff"
                  checked={events.thirtyPercentOff}
                  onCheckedChange={(checked) => 
                    setEvents(prev => ({ 
                      ...prev, 
                      thirtyPercentOff: checked
                    }))
                  }
                />
                <Label htmlFor="thirtyPercentOff" className="text-sm">
                  30% Off Event (30% cost reduction)
                </Label>
              </div>
            </div>
          </div>
          <Separator />
        </div>
      </CardHeader>
      
      <CardContent>
        {allStarForceItems.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="text-center">Current ★</TableHead>
                  <TableHead className="text-center">Target ★</TableHead>
                  <TableHead className="text-center">Current Spares</TableHead>
                  <TableHead className="text-center">Star Catching</TableHead>
                  <TableHead className="text-center">Safeguard</TableHead>
                  <TableHead className="text-center">Expected Cost</TableHead>
                  <TableHead className="text-center">Spares Needed</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
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
                          {calc.equipment.tier && (
                            <Badge variant="outline" className={getTierColor(calc.equipment.tier)}>
                              {calc.equipment.tier.charAt(0).toUpperCase() + calc.equipment.tier.slice(1)}
                            </Badge>
                          )}
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
                    <Switch
                      checked={calc.starCatching}
                      onCheckedChange={(checked) => updateStarCatching(calc.equipment.id, checked)}
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Switch
                      checked={calc.safeguard}
                      onCheckedChange={(checked) => updateSafeguard(calc.equipment.id, checked)}
                      disabled={calc.equipment.currentStarForce >= 17} // Only useful for 15->16 and 16->17
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
                  
                  <TableCell className="text-center">
                    {starForceItems.some(item => item.id === calc.equipment.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveStarForceItem(calc.equipment.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Equipment to Calculate
            </h3>
            <p className="text-muted-foreground mb-6">
              Add equipment with incomplete star force goals to start calculating
            </p>
            <Button 
              onClick={onAddStarForceItem}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Add Equipment for StarForce
            </Button>
          </div>
        )}

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
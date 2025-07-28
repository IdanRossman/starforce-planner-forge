import { useState, useEffect, useMemo } from "react";
import { Equipment } from "@/types";
import { calculateStarForce } from "@/components/StarForceCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EquipmentImage } from "@/components/EquipmentImage";
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
  Star,
  Package
} from "lucide-react";

interface QuickStarForceTableProps {
  equipment: Equipment[];
}

interface StarForceEvents {
  fiveTenFifteen: boolean;
  thirtyPercentOff: boolean;
  starCatching: boolean;
}

interface CalculationRow {
  equipment: Equipment;
  expectedCost: number;
  isCalculated: boolean;
}

// Equipment slot icons mapping
const getSlotIcon = (slot: string) => {
  const iconMap: { [key: string]: React.ComponentType } = {
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

export function QuickStarForceTable({ equipment }: QuickStarForceTableProps) {
  // Event states with global star catching
  const [events, setEvents] = useState<StarForceEvents>({
    fiveTenFifteen: false,
    thirtyPercentOff: false,
    starCatching: true, // Default enabled for quick calculator
  });
  
  const [calculations, setCalculations] = useState<CalculationRow[]>([]);

  // Update calculations when equipment or events change
  useEffect(() => {
    const newCalculations = equipment.map(eq => {
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
        eq.level || 150,
        eq.currentStarForce,
        eq.targetStarForce,
        eq.tier || "epic",
        "Regular",
        { 
          costMultiplier, 
          successRateBonus,
          starCatching: events.starCatching,
          safeguard: false // Simplified for quick calculator
        }
      );
      
      return {
        equipment: eq,
        expectedCost: starForceCalc.averageCost,
        isCalculated: true,
      };
    });
    
    setCalculations(newCalculations);
  }, [equipment, events]);

  const totalCost = calculations.reduce((sum, calc) => sum + calc.expectedCost, 0);

  if (equipment.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 font-maplestory">
          No Equipment to Calculate
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto font-maplestory">
          Select a template or add equipment that needs StarForce upgrades to see cost calculations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Cost Summary - Moved to top */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <Coins className="w-5 h-5 text-primary" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-maplestory">Total Expected Cost</p>
              <p className="text-2xl font-bold text-primary font-maplestory">
                {formatMesos(totalCost)} mesos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Toggles - Simplified */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Switch
              id="starCatching"
              checked={events.starCatching}
              onCheckedChange={(checked) => 
                setEvents(prev => ({ ...prev, starCatching: checked }))
              }
            />
            <Label htmlFor="starCatching" className="text-sm font-medium font-maplestory">
              Star Catching (All Equipment)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Switch
              id="fiveTenFifteen"
              checked={events.fiveTenFifteen}
              onCheckedChange={(checked) => 
                setEvents(prev => ({ ...prev, fiveTenFifteen: checked }))
              }
            />
            <Label htmlFor="fiveTenFifteen" className="text-sm font-medium font-maplestory">
              5/10/15 Event
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Switch
              id="thirtyPercentOff"
              checked={events.thirtyPercentOff}
              onCheckedChange={(checked) => 
                setEvents(prev => ({ ...prev, thirtyPercentOff: checked }))
              }
            />
            <Label htmlFor="thirtyPercentOff" className="text-sm font-medium font-maplestory">
              30% Off Event
            </Label>
          </div>
        </div>
      </div>

      {/* Calculation Table - Simplified */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-maplestory">Equipment</TableHead>
              <TableHead className="text-center font-maplestory">Current ★</TableHead>
              <TableHead className="text-center font-maplestory">Target ★</TableHead>
              <TableHead className="text-center font-maplestory">Expected Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculations.map((calc) => (
              <TableRow key={calc.equipment.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Equipment Image or Icon */}
                    {calc.equipment.image ? (
                      <EquipmentImage 
                        src={calc.equipment.image} 
                        alt={calc.equipment.name || calc.equipment.set || "Equipment"}
                        size="sm"
                        className="shrink-0"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        {getSlotIcon(calc.equipment.slot)}
                      </div>
                    )}
                    
                    {/* Equipment Details */}
                    <div>
                      <div className="font-medium font-maplestory">
                        {calc.equipment.name || calc.equipment.set 
                          ? `${calc.equipment.name || calc.equipment.set}` 
                          : `Lv.${calc.equipment.level} Equipment`
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {calc.equipment.tier && (
                          <Badge variant="outline" className={`${getTierColor(calc.equipment.tier)} font-maplestory`}>
                            {calc.equipment.tier.charAt(0).toUpperCase() + calc.equipment.tier.slice(1)}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground capitalize font-maplestory">
                          {calc.equipment.slot}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge variant="outline" className={`${getDangerColor(calc.equipment.currentStarForce)} font-maplestory`}>
                    ★{calc.equipment.currentStarForce}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-primary font-maplestory">
                    ★{calc.equipment.targetStarForce}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <span className="font-semibold text-foreground font-maplestory">
                    {formatMesos(calc.expectedCost)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

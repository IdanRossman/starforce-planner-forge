import { useState, useEffect, useMemo } from "react";
import { Equipment } from "@/types";
import { calculateBulkStarforce, BulkEnhancedStarforceRequestDto } from "@/services/starforceService";
import { useStarforceStrategy } from "@/hooks/useStarforceStrategy";
import { getDefaultEventState, createApiEventObject, StarforceEventState } from "@/lib/starforceEvents";
import { StarforceEventToggles } from "@/components/StarforceEventToggles";
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

interface CalculationRow {
  equipment: Equipment;
  expectedCost: number;
  isCalculated: boolean;
  isCalculating?: boolean;
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
  // Get global strategy
  const [globalStrategy] = useStarforceStrategy();
  
  // Event states - dynamic based on strategy
  const [events, setEvents] = useState<StarforceEventState>(() => 
    getDefaultEventState(globalStrategy)
  );
  
  const [calculations, setCalculations] = useState<CalculationRow[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Update events when strategy changes
  useEffect(() => {
    setEvents(getDefaultEventState(globalStrategy));
  }, [globalStrategy]);

  // Update calculations when equipment, events, or strategy change
  useEffect(() => {
    if (equipment.length === 0) {
      setCalculations([]);
      return;
    }

    calculateEquipmentCosts();
  }, [equipment, events, globalStrategy]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateEquipmentCosts = async () => {
    if (equipment.length === 0) return;

    setIsCalculating(true);
    
    // Set all items as calculating
    const calculatingItems = equipment.map(eq => ({
      equipment: eq,
      expectedCost: 0,
      isCalculated: false,
      isCalculating: true,
    }));
    setCalculations(calculatingItems);

    try {
      // Build API request
      const request: BulkEnhancedStarforceRequestDto = {
        isInteractive: true, // Quick planner is always interactive
        strategy: globalStrategy,
        events: createApiEventObject(globalStrategy, events),
        items: equipment.map(eq => ({
          itemLevel: eq.level || 150,
          fromStar: eq.currentStarForce || 0,
          toStar: eq.targetStarForce || 0,
          safeguardEnabled: false, // Simplified for quick calculator
          spareCount: 0,
          spareCost: 0,
          actualCost: 0,
          itemName: eq.name || `${eq.slot} Equipment`,
        })),
      };

      // Call backend API
      const { response } = await calculateBulkStarforce(request);
      
      // Transform response to match current format
      const newCalculations: CalculationRow[] = response.results.map((result, index) => ({
        equipment: equipment[index],
        expectedCost: result.averageCost || 0,
        isCalculated: true,
        isCalculating: false,
      }));

      setCalculations(newCalculations);
    } catch (error) {
      console.error('Failed to calculate starforce costs:', error);
      
      // On error, show items as not calculated
      const errorCalculations = equipment.map(eq => ({
        equipment: eq,
        expectedCost: 0,
        isCalculated: false,
        isCalculating: false,
      }));
      setCalculations(errorCalculations);
    } finally {
      setIsCalculating(false);
    }
  };

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

      {/* Event Toggles - Dynamic based on strategy */}
      <StarforceEventToggles
        key={globalStrategy} // Force re-render when strategy changes
        strategy={globalStrategy}
        events={events}
        onEventsChange={setEvents}
        compact={false}
      />

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
                  {calc.isCalculating ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : (
                    <span className="font-semibold text-foreground font-maplestory">
                      {formatMesos(calc.expectedCost)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

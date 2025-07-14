import { Equipment, EquipmentSlot } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentGridProps {
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onAddEquipment: (slot: EquipmentSlot) => void;
}

const EQUIPMENT_SLOTS: { slot: EquipmentSlot; label: string; position: string }[] = [
  { slot: 'hat', label: 'Hat', position: 'col-start-2 row-start-1' },
  { slot: 'face', label: 'Face', position: 'col-start-1 row-start-2' },
  { slot: 'eye', label: 'Eye', position: 'col-start-3 row-start-2' },
  { slot: 'earring', label: 'Earring', position: 'col-start-1 row-start-3' },
  { slot: 'top', label: 'Top', position: 'col-start-2 row-start-3' },
  { slot: 'pendant1', label: 'Pendant', position: 'col-start-3 row-start-3' },
  { slot: 'weapon', label: 'Weapon', position: 'col-start-1 row-start-4' },
  { slot: 'bottom', label: 'Bottom', position: 'col-start-2 row-start-4' },
  { slot: 'secondary', label: 'Secondary', position: 'col-start-3 row-start-4' },
  { slot: 'gloves', label: 'Gloves', position: 'col-start-1 row-start-5' },
  { slot: 'shoes', label: 'Shoes', position: 'col-start-2 row-start-5' },
  { slot: 'cape', label: 'Cape', position: 'col-start-3 row-start-5' },
  { slot: 'ring1', label: 'Ring 1', position: 'col-start-4 row-start-1' },
  { slot: 'ring2', label: 'Ring 2', position: 'col-start-4 row-start-2' },
  { slot: 'ring3', label: 'Ring 3', position: 'col-start-4 row-start-3' },
  { slot: 'ring4', label: 'Ring 4', position: 'col-start-4 row-start-4' },
  { slot: 'belt', label: 'Belt', position: 'col-start-4 row-start-5' },
];

export function EquipmentGrid({ equipment, onEditEquipment, onAddEquipment }: EquipmentGridProps) {
  const getEquipmentForSlot = (slot: EquipmentSlot) => {
    return equipment.find(eq => eq.slot === slot);
  };

  const getStarForceColor = (current: number, target: number) => {
    if (current >= target) return 'text-starforce-safe';
    if (current >= 15) return 'text-starforce-danger';
    if (current >= 10) return 'text-starforce-caution';
    return 'text-muted-foreground';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'legendary': return 'bg-maple-gold/20 text-maple-gold border-maple-gold/30';
      case 'unique': return 'bg-maple-purple/20 text-maple-purple border-maple-purple/30';
      case 'epic': return 'bg-maple-blue/20 text-maple-blue border-maple-blue/30';
      case 'rare': return 'bg-maple-green/20 text-maple-green border-maple-green/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-6 bg-card/30 rounded-lg border border-border/50">
      {EQUIPMENT_SLOTS.map(({ slot, label, position }) => {
        const eq = getEquipmentForSlot(slot);
        
        return (
          <Card 
            key={slot} 
            className={cn(
              "relative aspect-square hover:shadow-md transition-all duration-200 group",
              position,
              eq ? "bg-gradient-to-br from-card to-card/80 cursor-pointer hover:scale-105" : "bg-muted/30 border-dashed border-muted"
            )}
          >
            <CardContent className="p-3 h-full flex flex-col justify-between">
              {eq ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-1 py-0", getTierColor(eq.tier))}
                      >
                        {eq.tier}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        onClick={() => onEditEquipment(eq)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-foreground truncate">
                        {eq.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className={cn("w-3 h-3", getStarForceColor(eq.currentStarForce, eq.targetStarForce))} />
                      <span className={cn("text-xs font-bold", getStarForceColor(eq.currentStarForce, eq.targetStarForce))}>
                        {eq.currentStarForce}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /{eq.targetStarForce}
                    </div>
                  </div>
                </>
              ) : (
                <Button
                  variant="ghost"
                  className="h-full w-full border-0 bg-transparent hover:bg-muted/50 flex flex-col gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddEquipment(slot)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
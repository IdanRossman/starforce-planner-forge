import { Equipment, EquipmentSlot } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Edit, 
  Star,
  Calculator,
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
  Package,
  X
} from "lucide-react";

const getTierColor = (tier: string | null | undefined) => {
  if (!tier) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  const colors = {
    rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    unique: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    legendary: 'bg-green-500/20 text-green-400 border-green-500/30'
  };
  return colors[tier as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

interface EquipmentGridProps {
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onAddEquipment: (slot: EquipmentSlot) => void;
  onClearEquipment: (slot: EquipmentSlot) => void;
  onOpenCalculator?: () => void;
}

const EQUIPMENT_SLOTS: { slot: EquipmentSlot; label: string; position: string }[] = [
  // Column 1: Rings + Pocket
  { slot: 'ring1', label: 'Ring 1', position: 'col-start-1 row-start-1' },
  { slot: 'ring2', label: 'Ring 2', position: 'col-start-1 row-start-2' },
  { slot: 'ring3', label: 'Ring 3', position: 'col-start-1 row-start-3' },
  { slot: 'ring4', label: 'Ring 4', position: 'col-start-1 row-start-4' },
  { slot: 'pocket', label: 'Pocket', position: 'col-start-1 row-start-5' },
  
  // Column 2: Pendants + Weapon + Belt
  { slot: 'pendant1', label: 'Pendant 1', position: 'col-start-2 row-start-2' },
  { slot: 'pendant2', label: 'Pendant 2', position: 'col-start-2 row-start-3' },
  { slot: 'weapon', label: 'Weapon', position: 'col-start-2 row-start-4' },
  { slot: 'belt', label: 'Belt', position: 'col-start-2 row-start-5' },
  
  // Column 3: Main armor pieces
  { slot: 'hat', label: 'Hat', position: 'col-start-3 row-start-1' },
  { slot: 'face', label: 'Face', position: 'col-start-3 row-start-2' },
  { slot: 'eye', label: 'Eye', position: 'col-start-3 row-start-3' },
  { slot: 'top', label: 'Top', position: 'col-start-3 row-start-4' },
  { slot: 'bottom', label: 'Bottom', position: 'col-start-3 row-start-5' },
  { slot: 'shoes', label: 'Shoes', position: 'col-start-3 row-start-6' },
  
  // Column 4: Overall (centered)
  { slot: 'overall', label: 'Overall', position: 'col-start-4 row-start-4' },
  
  // Column 5: Accessories
  { slot: 'earring', label: 'Earring', position: 'col-start-5 row-start-3' },
  { slot: 'shoulder', label: 'Shoulder', position: 'col-start-5 row-start-4' },
  { slot: 'gloves', label: 'Gloves', position: 'col-start-5 row-start-5' },
  
  // Column 6: Secondary equipment
  { slot: 'emblem', label: 'Emblem', position: 'col-start-6 row-start-1' },
  { slot: 'badge', label: 'Badge', position: 'col-start-6 row-start-2' },
  { slot: 'medal', label: 'Medal', position: 'col-start-6 row-start-3' },
  { slot: 'secondary', label: 'Secondary', position: 'col-start-6 row-start-4' },
  { slot: 'cape', label: 'Cape', position: 'col-start-6 row-start-5' },
  { slot: 'heart', label: 'Heart', position: 'col-start-6 row-start-6' },
];

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
    medal: Star,
  };
  
  const IconComponent = iconMap[slot] || Package;
  return <IconComponent className="w-4 h-4" />;
};

export function EquipmentGrid({ equipment, onEditEquipment, onAddEquipment, onClearEquipment, onOpenCalculator }: EquipmentGridProps) {
  const equipmentBySlot = equipment.reduce((acc, item) => {
    acc[item.slot] = item;
    return acc;
  }, {} as Record<EquipmentSlot, Equipment>);

  const hasIncompleteStarForce = equipment.some(eq => eq.currentStarForce < eq.targetStarForce);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="grid grid-cols-6 grid-rows-6 gap-3 p-6 bg-card/30 rounded-lg border border-border/50">
        {EQUIPMENT_SLOTS.map(({ slot, label, position }) => {
          const equipment = equipmentBySlot[slot];
          
          // Check for conflicting equipment (overall vs top/bottom)
          const hasOverall = equipmentBySlot['overall'];
          const hasTopOrBottom = equipmentBySlot['top'] || equipmentBySlot['bottom'];
          
          const isDisabled = !equipment && (
            (slot === 'overall' && !!hasTopOrBottom) ||
            ((slot === 'top' || slot === 'bottom') && !!hasOverall)
          );
          
          const getTooltipMessage = () => {
            if (slot === 'overall' && hasTopOrBottom) {
              return "Cannot equip Overall when Top or Bottom is equipped";
            }
            if ((slot === 'top' || slot === 'bottom') && hasOverall) {
              return "Cannot equip Top/Bottom when Overall is equipped";
            }
            return "";
          };
          
          const cardContent = (
            <Card 
              key={slot} 
              className={`relative transition-all duration-200 group ${position} ${
                equipment 
                  ? "bg-gradient-to-br from-card to-card/80 cursor-pointer hover:scale-105 hover:shadow-md" 
                  : isDisabled
                    ? "bg-muted/10 border-dashed border-muted/50 opacity-50"
                    : "bg-muted/30 border-dashed border-muted"
              }`}
            >
              <CardContent className="p-3 h-full flex flex-col justify-between">
                {equipment ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        {equipment.tier && (
                          <Badge variant="outline" className={`${getTierColor(equipment.tier)} text-xs px-1.5 py-0.5 shrink-0`}>
                            {equipment.tier.charAt(0).toUpperCase()}
                          </Badge>
                        )}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0.5 h-auto w-auto"
                            onClick={() => onEditEquipment(equipment)}
                          >
                            <Edit className="w-2.5 h-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0.5 h-auto w-auto text-destructive hover:text-destructive"
                            onClick={() => onClearEquipment(equipment.slot)}
                          >
                            <X className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        {getSlotIcon(slot)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {equipment.set || `Lv.${equipment.level} Equipment`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {label}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">
                        {equipment.currentStarForce}
                      </span>
                      {equipment.targetStarForce > equipment.currentStarForce && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-medium">
                            {equipment.targetStarForce}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className={`h-full w-full border-0 bg-transparent flex flex-col gap-2 ${
                      isDisabled 
                        ? "text-muted-foreground/50 cursor-not-allowed" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => !isDisabled && onAddEquipment(slot)}
                    disabled={isDisabled}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          );

          return isDisabled ? (
            <TooltipProvider key={slot}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {cardContent}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipMessage()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : cardContent;
        })}
      </div>
      
      {/* Calculator Button */}
      {hasIncompleteStarForce && onOpenCalculator && (
        <div className="text-center">
          <Button 
            onClick={onOpenCalculator}
            className="flex items-center gap-2"
            size="lg"
          >
            <Calculator className="w-5 h-5" />
            Calculate StarForce Costs
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Plan your upgrades and estimate costs for incomplete equipment
          </p>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
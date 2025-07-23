import { Equipment, EquipmentSlot } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentImage } from "@/components/EquipmentImage";
import { useState, useEffect } from "react";
import { 
  Plus, 
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

const EQUIPMENT_SLOTS: { 
  slot: EquipmentSlot; 
  label: string; 
  position: string;
  mobileOrder: number;
  category: string;
}[] = [
  // Weapons & Secondary
  { slot: 'weapon', label: 'Weapon', position: 'col-start-2 row-start-4', mobileOrder: 1, category: 'Weapons' },
  { slot: 'secondary', label: 'Secondary', position: 'col-start-5 row-start-4', mobileOrder: 2, category: 'Weapons' },
  
  // Armor
  { slot: 'hat', label: 'Hat', position: 'col-start-3 row-start-1', mobileOrder: 3, category: 'Armor' },
  { slot: 'top', label: 'Top', position: 'col-start-3 row-start-4', mobileOrder: 4, category: 'Armor' },
  { slot: 'bottom', label: 'Bottom', position: 'col-start-3 row-start-5', mobileOrder: 5, category: 'Armor' },
  { slot: 'shoes', label: 'Shoes', position: 'col-start-3 row-start-6', mobileOrder: 6, category: 'Armor' },
  { slot: 'gloves', label: 'Gloves', position: 'col-start-4 row-start-5', mobileOrder: 7, category: 'Armor' },
  { slot: 'cape', label: 'Cape', position: 'col-start-5 row-start-5', mobileOrder: 8, category: 'Armor' },
  { slot: 'belt', label: 'Belt', position: 'col-start-2 row-start-5', mobileOrder: 9, category: 'Armor' },
  { slot: 'shoulder', label: 'Shoulder', position: 'col-start-4 row-start-4', mobileOrder: 10, category: 'Armor' },
  
  // Accessories
  { slot: 'face', label: 'Face', position: 'col-start-3 row-start-2', mobileOrder: 11, category: 'Accessories' },
  { slot: 'eye', label: 'Eye', position: 'col-start-3 row-start-3', mobileOrder: 12, category: 'Accessories' },
  { slot: 'earring', label: 'Earring', position: 'col-start-4 row-start-3', mobileOrder: 13, category: 'Accessories' },
  
  // Jewelry
  { slot: 'pendant1', label: 'Pendant 1', position: 'col-start-2 row-start-2', mobileOrder: 14, category: 'Jewelry' },
  { slot: 'pendant2', label: 'Pendant 2', position: 'col-start-2 row-start-3', mobileOrder: 15, category: 'Jewelry' },
  { slot: 'ring1', label: 'Ring 1', position: 'col-start-1 row-start-1', mobileOrder: 16, category: 'Jewelry' },
  { slot: 'ring2', label: 'Ring 2', position: 'col-start-1 row-start-2', mobileOrder: 17, category: 'Jewelry' },
  { slot: 'ring3', label: 'Ring 3', position: 'col-start-1 row-start-3', mobileOrder: 18, category: 'Jewelry' },
  { slot: 'ring4', label: 'Ring 4', position: 'col-start-1 row-start-4', mobileOrder: 19, category: 'Jewelry' },
  
  // Special Items
  { slot: 'emblem', label: 'Emblem', position: 'col-start-5 row-start-1', mobileOrder: 20, category: 'Special' },
  { slot: 'badge', label: 'Badge', position: 'col-start-5 row-start-2', mobileOrder: 21, category: 'Special' },
  { slot: 'medal', label: 'Medal', position: 'col-start-5 row-start-3', mobileOrder: 22, category: 'Special' },
  { slot: 'heart', label: 'Heart', position: 'col-start-5 row-start-6', mobileOrder: 23, category: 'Special' },
  { slot: 'pocket', label: 'Pocket', position: 'col-start-1 row-start-5', mobileOrder: 24, category: 'Special' },
];

// Equipment slot icons mapping
const getSlotIcon = (slot: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
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

// Component to handle equipment display with image state
const EquipmentDisplay = ({ equipment, slot, label }: { equipment: Equipment, slot: string, label: string }) => {
  const [imageFailedToLoad, setImageFailedToLoad] = useState(false);
  
  // Reset state when equipment changes
  useEffect(() => {
    setImageFailedToLoad(false);
  }, [equipment.id, equipment.image]);

  // If no image or image failed, show text layout
  const shouldShowTextLayout = !equipment.image || imageFailedToLoad;
  
  return (
    <div className="space-y-2">
      {!shouldShowTextLayout ? (
        // Image-centered layout: image with centered StarForce below
        <div className="flex flex-col items-center justify-center space-y-1">
          <EquipmentImage 
            src={equipment.image} 
            alt={equipment.name || equipment.set || "Equipment"}
            size="lg"
            showFallback={false}
            maxRetries={3}
            className="shrink-0"
            onImageStatusChange={(hasImage) => {
              if (!hasImage) {
                setImageFailedToLoad(true);
              }
            }}
          />
          {/* StarForce display - centered below image */}
          {equipment.starforceable && (
            <div className="flex items-center justify-center gap-0.5 text-xs">
              <Star className="w-2.5 h-2.5 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-xs">
                {equipment.currentStarForce}
              </span>
              {equipment.targetStarForce > equipment.currentStarForce && (
                <>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="text-primary font-medium text-xs">
                    {equipment.targetStarForce}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        // Text layout: no image or image failed to load, show equipment details with slot icon
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded shrink-0">
              {getSlotIcon(slot)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {equipment.name || equipment.set || `Lv.${equipment.level} Equipment`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {label}
              </p>
            </div>
          </div>
          {/* StarForce display - normal layout for text mode */}
          {equipment.starforceable && (
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
          )}
        </div>
      )}
    </div>
  );
};

export function EquipmentGrid({ equipment, onEditEquipment, onAddEquipment, onClearEquipment, onOpenCalculator }: EquipmentGridProps) {
  const equipmentBySlot = equipment.reduce((acc, item) => {
    acc[item.slot] = item;
    return acc;
  }, {} as Record<EquipmentSlot, Equipment>);

  const hasIncompleteStarForce = equipment.some(eq => eq.starforceable && eq.currentStarForce < eq.targetStarForce);

  // Group equipment by category for mobile view
  const categorizedSlots = EQUIPMENT_SLOTS.reduce((acc, slot) => {
    if (!acc[slot.category]) acc[slot.category] = [];
    acc[slot.category].push(slot);
    return acc;
  }, {} as Record<string, typeof EQUIPMENT_SLOTS>);

  const renderEquipmentSlot = (slotData: typeof EQUIPMENT_SLOTS[0]) => {
    const { slot, label, position } = slotData;
    const equipment = equipmentBySlot[slot];
    
    const cardContent = (
      <Card 
        key={slot} 
        className={`relative transition-all duration-200 group ${position} ${
          equipment 
            ? "bg-gradient-to-br from-card to-card/80 cursor-pointer hover:scale-105 hover:shadow-md" 
            : "bg-muted/30 border-dashed border-muted cursor-pointer hover:bg-muted/50"
        }`}
        onClick={() => {
          if (equipment) {
            onEditEquipment(equipment);
          } else {
            onAddEquipment(slot);
          }
        }}
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
                      className="p-0.5 h-auto w-auto text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearEquipment(equipment.slot);
                      }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
                
                <EquipmentDisplay 
                  equipment={equipment}
                  slot={slot}
                  label={label}
                />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col gap-2 items-center justify-center text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span className="text-xs">{label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );

    return cardContent;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Desktop Grid Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-5 grid-rows-6 gap-3 p-6 bg-card/30 rounded-lg border border-border/50">
            {EQUIPMENT_SLOTS.map(renderEquipmentSlot)}
          </div>
        </div>
        
        {/* Mobile Categorized Layout */}
        <div className="lg:hidden space-y-4">
          {Object.entries(categorizedSlots).map(([category, slots]) => (
            <div key={category} className="bg-card/30 rounded-lg border border-border/50 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                {category === 'Weapons' && <Sword className="w-4 h-4" />}
                {category === 'Armor' && <Shield className="w-4 h-4" />}
                {category === 'Accessories' && <Eye className="w-4 h-4" />}
                {category === 'Jewelry' && <Gem className="w-4 h-4" />}
                {category === 'Special' && <Star className="w-4 h-4" />}
                {category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slotData) => {
                  const { slot, label } = slotData;
                  const equipment = equipmentBySlot[slot];
                  
                  return (
                    <Card 
                      key={slot} 
                      className={`relative transition-all duration-200 group ${
                        equipment 
                          ? "bg-gradient-to-br from-card to-card/80 cursor-pointer hover:scale-105 hover:shadow-md" 
                          : "bg-muted/30 border-dashed border-muted cursor-pointer hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        if (equipment) {
                          onEditEquipment(equipment);
                        } else {
                          onAddEquipment(slot);
                        }
                      }}
                    >
                      <CardContent className="p-3 h-full flex flex-col justify-between min-h-[100px]">
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
                                    className="p-0.5 h-auto w-auto text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClearEquipment(equipment.slot);
                                    }}
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                {getSlotIcon(slot)}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {equipment.name || equipment.set || `Lv.${equipment.level} Equipment`}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {label}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* StarForce display - only show if starforceable */}
                            {equipment.starforceable && (
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
                            )}
                          </>
                        ) : (
                          <div className="h-full w-full flex flex-col gap-2 items-center justify-center text-muted-foreground">
                            <Plus className="w-4 h-4" />
                            <span className="text-xs">{label}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
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
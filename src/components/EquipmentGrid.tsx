import { Equipment, EquipmentSlot } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentImage } from "@/components/EquipmentImage";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  Star,
  Crown,
  Shirt,
  Footprints,
  Hand,
  Gem,
  Eye,
  Ear,
  Heart,
  Package,
  Sword,
  Shield,
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
  characterImage?: string;
}

const EQUIPMENT_SLOTS: {
  slot: EquipmentSlot;
  label: string;
  position: string;
  mobileOrder: number;
  category: string;
}[] = [
  // Column 1 - Rings & Pocket
  { slot: 'ring1', label: 'Ring 1', position: 'col-start-1 row-start-1', mobileOrder: 1, category: 'Jewelry' },
  { slot: 'ring2', label: 'Ring 2', position: 'col-start-1 row-start-2', mobileOrder: 2, category: 'Jewelry' },
  { slot: 'ring3', label: 'Ring 3', position: 'col-start-1 row-start-3', mobileOrder: 3, category: 'Jewelry' },
  { slot: 'ring4', label: 'Ring 4', position: 'col-start-1 row-start-4', mobileOrder: 4, category: 'Jewelry' },
  { slot: 'belt', label: 'Belt', position: 'col-start-1 row-start-5', mobileOrder: 5, category: 'Armor' },
  { slot: 'pocket', label: 'Pocket', position: 'col-start-1 row-start-6', mobileOrder: 6, category: 'Special' },

  // Column 2 - Face, Eye, Earrings, Pendants
  { slot: 'face', label: 'Face', position: 'col-start-2 row-start-1', mobileOrder: 7, category: 'Accessories' },
  { slot: 'eye', label: 'Eye', position: 'col-start-2 row-start-2', mobileOrder: 8, category: 'Accessories' },
  { slot: 'earring', label: 'Earring', position: 'col-start-2 row-start-3', mobileOrder: 9, category: 'Accessories' },
  { slot: 'pendant1', label: 'Pendant 1', position: 'col-start-2 row-start-4', mobileOrder: 10, category: 'Jewelry' },
  { slot: 'pendant2', label: 'Pendant 2', position: 'col-start-2 row-start-5', mobileOrder: 11, category: 'Jewelry' },

  // Column 3 - Weapon
  { slot: 'weapon', label: 'Weapon', position: 'col-start-3 row-start-5', mobileOrder: 12, category: 'Weapons' },

  // Column 4 - Secondary
  { slot: 'secondary', label: 'Secondary', position: 'col-start-4 row-start-5', mobileOrder: 13, category: 'Weapons' },

  // Column 5 - Emblem
  { slot: 'emblem', label: 'Emblem', position: 'col-start-5 row-start-5', mobileOrder: 14, category: 'Special' },

  // Column 6 - Hat, Top, Bottom, Shoulder, Android
  { slot: 'hat', label: 'Hat', position: 'col-start-6 row-start-1', mobileOrder: 15, category: 'Armor' },
  { slot: 'top', label: 'Top', position: 'col-start-6 row-start-2', mobileOrder: 16, category: 'Armor' },
  { slot: 'bottom', label: 'Bottom', position: 'col-start-6 row-start-3', mobileOrder: 17, category: 'Armor' },
  { slot: 'shoulder', label: 'Shoulder', position: 'col-start-6 row-start-4', mobileOrder: 18, category: 'Armor' },
  { slot: 'android', label: 'Android', position: 'col-start-6 row-start-5', mobileOrder: 19, category: 'Special' },

  // Column 7 - Cape, Gloves, Shoes, Medal, Heart, Badge
  { slot: 'cape', label: 'Cape', position: 'col-start-7 row-start-1', mobileOrder: 20, category: 'Armor' },
  { slot: 'gloves', label: 'Gloves', position: 'col-start-7 row-start-2', mobileOrder: 21, category: 'Armor' },
  { slot: 'shoes', label: 'Shoes', position: 'col-start-7 row-start-3', mobileOrder: 22, category: 'Armor' },
  { slot: 'medal', label: 'Medal', position: 'col-start-7 row-start-4', mobileOrder: 23, category: 'Special' },
  { slot: 'heart', label: 'Heart', position: 'col-start-7 row-start-5', mobileOrder: 24, category: 'Special' },
  { slot: 'badge', label: 'Badge', position: 'col-start-7 row-start-6', mobileOrder: 25, category: 'Special' },
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
    android: Package,
  };

  const IconComponent = iconMap[slot] || Package;
  return <IconComponent className="w-4 h-4" />;
};

// Component to handle equipment display with image state - Ultra compact version
const EquipmentDisplay = ({ equipment, slot, label, compact = false }: { equipment: Equipment, slot: string, label: string, compact?: boolean }) => {
  const [hasImage, setHasImage] = useState(false);
  const imgSize = compact ? 'sm' : 'md';
  const sfTextSize = compact ? 'text-[8px]' : 'text-[10px]';
  const sfIconSize = compact ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
      {equipment.image ? (
        <>
          <EquipmentImage
            src={equipment.image}
            alt={equipment.name || equipment.set || "Equipment"}
            size={imgSize}
            fallbackIcon={() => getSlotIcon(slot)}
            onImageStatusChange={setHasImage}
            className="shrink-0"
          />
          {equipment.starforceable && (
            <div className="flex items-center gap-0.5 px-0.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Star className={`${sfIconSize} text-yellow-400 fill-yellow-400`} />
              <span className={`text-white font-semibold ${sfTextSize}`}>
                {equipment.currentStarForce}
              </span>
              {equipment.targetStarForce > equipment.currentStarForce && (
                <>
                  <span className={`text-white/50 ${sfTextSize}`}>→</span>
                  <span className={`text-primary font-semibold ${sfTextSize}`}>
                    {equipment.targetStarForce}
                  </span>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className={`flex items-center justify-center ${compact ? 'w-3 h-3' : 'w-4 h-4'} bg-white/10 backdrop-blur-sm border border-white/20 rounded shrink-0`}>
            {getSlotIcon(slot)}
          </div>
          <div className="flex flex-col items-center">
            <p className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-medium text-white truncate leading-tight text-center`}>
              {equipment.name || equipment.set || `Lv.${equipment.level}`}
            </p>
            <p className={`${compact ? 'text-[7px]' : 'text-[9px]'} text-muted-foreground truncate leading-tight text-center`}>
              {label}
            </p>
          </div>
          {equipment.starforceable && (
            <div className="flex items-center gap-0.5 px-0.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Star className={`${sfIconSize} text-yellow-400 fill-yellow-400`} />
              <span className={`text-white font-semibold ${sfTextSize}`}>
                {equipment.currentStarForce}
              </span>
              {equipment.targetStarForce > equipment.currentStarForce && (
                <>
                  <span className={`text-white/50 ${sfTextSize}`}>→</span>
                  <span className={`text-primary font-semibold ${sfTextSize}`}>
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

export function EquipmentGrid({ equipment, onEditEquipment, onAddEquipment, onClearEquipment, onOpenCalculator, characterImage }: EquipmentGridProps) {
  const isMobile = useIsMobile();

  // Create equipment mapping, prioritizing target equipment over source equipment for display
  const equipmentBySlot = equipment.reduce((acc, item) => {
    const existingItem = acc[item.slot];
    
    // If no item exists for this slot, add it
    if (!existingItem) {
      acc[item.slot] = item;
    } else {
      // If an item exists, prioritize target equipment over source equipment
      // Target equipment: has transferredFrom (it's receiving stars)
      // Source equipment: has transferredTo (it will be destroyed)
      const isCurrentItemTarget = !!item.transferredFrom;
      const isExistingItemTarget = !!existingItem.transferredFrom;
      const isCurrentItemSource = !!item.transferredTo;
      const isExistingItemSource = !!existingItem.transferredTo;
      
      if (isCurrentItemTarget && isExistingItemSource) {
        // Current item is target, existing is source -> replace with target
        acc[item.slot] = item;
      } else if (isExistingItemTarget && isCurrentItemSource) {
        // Existing item is target, current is source -> keep existing target
        // Do nothing, keep existing
      } else {
        // Neither has transfer flags or both have same flags -> use the later one (current behavior)
        acc[item.slot] = item;
      }
    }
    
    return acc;
  }, {} as Record<EquipmentSlot, Equipment>);

  const renderEquipmentSlot = (slotData: typeof EQUIPMENT_SLOTS[0]) => {
    const { slot, label, position } = slotData;
    const equipment = equipmentBySlot[slot];
    const isDisabled = slot === 'android';

    const cardContent = (
      <Card
        key={slot}
        className={`relative transition-all duration-200 group ${position} ${
          isDisabled
            ? "bg-muted/20 border-muted/50 cursor-not-allowed opacity-50"
            : equipment
              ? "bg-gradient-to-br from-card to-card/80 cursor-pointer hover:scale-105 hover:shadow-md"
              : "bg-muted/30 border-dashed border-muted cursor-pointer hover:bg-muted/50"
        }`}
        onClick={() => {
          if (isDisabled) return;
          if (equipment) {
            onEditEquipment(equipment);
          } else {
            onAddEquipment(slot);
          }
        }}
      >
        <CardContent className={`p-0 ${isMobile ? 'h-[56px]' : 'h-[74px]'} w-full flex items-center justify-center relative`}>
          {equipment ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
              <EquipmentDisplay
                key={`${equipment.id}-${equipment.image}-${equipment.currentStarForce}`}
                equipment={equipment}
                slot={slot}
                label={label}
                compact={isMobile}
              />
            </div>
          ) : isDisabled ? (
            <div className="w-full h-full flex flex-col gap-0.5 items-center justify-center text-muted-foreground">
              <span className={isMobile ? 'text-[7px]' : 'text-[9px]'}>{label}</span>
              {!isMobile && <span className="text-[8px] text-muted-foreground/60">(Soon)</span>}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col gap-0.5 items-center justify-center text-muted-foreground">
              <Plus className={isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
              <span className={isMobile ? 'text-[7px]' : 'text-[9px]'}>{label}</span>
            </div>
          )}
          {/* Delete button — always visible on touch devices, hover-only on desktop */}
          {equipment && (
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="p-0.5 h-auto w-auto text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearEquipment(equipment.slot);
                }}
              >
                <X className="w-2 h-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );

    return cardContent;
  };

  return (
    <TooltipProvider>
      <div className={`grid grid-cols-7 grid-rows-6 gap-0.5 ${isMobile ? 'p-1' : 'p-2'} bg-card/30 rounded-lg border border-border/50 w-full mx-auto`}>
        {EQUIPMENT_SLOTS.map(renderEquipmentSlot)}
        {/* Character sprite — spans the empty cols 3-5, rows 1-4 */}
        <div className="col-start-3 col-end-6 row-start-1 row-end-5 flex items-center justify-center rounded-md overflow-hidden bg-white/5 border border-white/10">
          {characterImage ? (
            <img
              src={characterImage}
              alt="Character"
              className="w-2/3 h-2/3 object-contain drop-shadow-lg"
            />
          ) : (
            <div className="text-muted-foreground/30 text-[9px] text-center px-2">Character</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
import { motion } from "framer-motion";
import { Equipment } from "@/types";
import { EquipmentImage } from "./EquipmentImage";
import { Check } from "lucide-react";

interface ItemCardProps {
  item: Equipment;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function ItemCard({ item, isSelected = false, onClick, size = "md" }: ItemCardProps) {
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-24",
    lg: "w-24 h-28"
  };

  const imageSizes = {
    sm: "sm" as const,
    md: "md" as const,
    lg: "lg" as const
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        relative flex flex-col items-center justify-center gap-1.5
        rounded-lg border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'bg-primary/20 border-primary shadow-lg shadow-primary/30' 
          : 'bg-card/50 border-border/50 hover:bg-card hover:border-primary/30'
        }
        backdrop-blur-sm
      `}
    >
      {/* Selected Checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10 shadow-lg"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}

      {/* Equipment Image */}
      <div className="flex-1 flex items-center justify-center">
        <EquipmentImage
          src={item.image}
          alt={item.name}
          size={imageSizes[size]}
          showFallback={true}
        />
      </div>

      {/* Item Name */}
      <div className="w-full px-1">
        <p className="text-[8px] text-center text-muted-foreground font-maplestory">
          Lv.{item.level}
        </p>
      </div>
    </motion.div>
  );
}

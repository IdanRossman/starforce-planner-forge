import React from 'react';
import { SelectItem } from '@/components/ui/select';

interface EquipmentSelectItemProps {
  equipment: {
    name: string;
    level: number;
    imageUrl?: string;
  };
  value: string;
}

export const EquipmentSelectItem: React.FC<EquipmentSelectItemProps> = ({ equipment, value }) => {
  return (
    <SelectItem value={value}>
      <div className="flex items-center gap-3 py-1">
        {equipment.imageUrl && (
          <img 
            src={equipment.imageUrl} 
            alt={equipment.name} 
            className="w-8 h-8 object-contain flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        <div className="flex flex-col">
          <span className="font-medium">{equipment.name}</span>
          <span className="text-xs text-muted-foreground">Lv.{equipment.level}</span>
        </div>
      </div>
    </SelectItem>
  );
};
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
  const [imageError, setImageError] = React.useState(false);

  return (
    <SelectItem value={value}>
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          {equipment.imageUrl && !imageError ? (
            <img 
              src={equipment.imageUrl} 
              alt={equipment.name} 
              className="w-12 h-12 object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-2xl">⚔️</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{equipment.name}</span>
          <span className="text-xs text-muted-foreground">Lv.{equipment.level}</span>
        </div>
      </div>
    </SelectItem>
  );
};
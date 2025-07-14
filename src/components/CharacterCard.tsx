import { Character } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User } from "lucide-react";

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
  onSelect: (character: Character) => void;
  isSelected?: boolean;
}

export function CharacterCard({ character, onEdit, onDelete, onSelect, isSelected = false }: CharacterCardProps) {
  const completedEquipment = character.equipment.filter(
    (eq) => eq.currentStarForce >= eq.targetStarForce
  ).length;
  
  const totalEquipment = character.equipment.length;
  const progressPercentage = totalEquipment > 0 ? (completedEquipment / totalEquipment) * 100 : 0;

  return (
    <Card 
      className={`bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${
        isSelected ? 'ring-2 ring-primary shadow-[var(--shadow-glow)]' : ''
      }`}
      onClick={() => onSelect(character)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-maple-orange flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                {character.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {character.class} • Lv.{character.level}
              </p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(character);
              }}
              className="hover:bg-accent/20 hover:text-accent"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(character.id);
              }}
              className="hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Server</span>
            <Badge variant="secondary" className="bg-maple-blue/20 text-maple-blue border-maple-blue/30">
              {character.server}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Equipment Progress</span>
              <span className="text-foreground">
                {completedEquipment}/{totalEquipment}
              </span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-starforce-safe to-starforce-caution transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
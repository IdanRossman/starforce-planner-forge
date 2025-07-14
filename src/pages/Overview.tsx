import { useState, useEffect } from "react";
import { Character, Equipment } from "@/types";
import { StarForceTable } from "@/components/StarForceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Target, Coins } from "lucide-react";
import { loadFromLocalStorage } from "@/lib/utils";

export default function Overview() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [starForceItems, setStarForceItems] = useState<Equipment[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const stored = loadFromLocalStorage();
    if (stored) {
      setCharacters(stored.characters);
      setStarForceItems(stored.starForceItems);
    }
  }, []);

  // Calculate overview stats
  const totalCharacters = characters.length;
  const totalEquipment = characters.reduce((sum, char) => sum + char.equipment.length, 0);
  const incompleteEquipment = characters.reduce(
    (sum, char) => sum + char.equipment.filter(eq => eq.starforceable && eq.currentStarForce < eq.targetStarForce).length, 
    0
  );
  const completionRate = totalEquipment > 0 ? ((totalEquipment - incompleteEquipment) / totalEquipment * 100) : 0;

  const handleAddStarForceItem = () => {
    // This will be handled by the parent component eventually
    console.log("Add starforce item");
  };

  const handleRemoveStarForceItem = (id: string) => {
    setStarForceItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
        <p className="text-muted-foreground">
          StarForce planning across all your characters
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Characters</p>
                <p className="text-2xl font-bold">{totalCharacters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Equipment</p>
                <p className="text-2xl font-bold">{totalEquipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Upgrades</p>
                <p className="text-2xl font-bold">{incompleteEquipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Characters Summary */}
      {characters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Characters Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map((character) => {
                const completed = character.equipment.filter(eq => !eq.starforceable || eq.currentStarForce >= eq.targetStarForce).length;
                const total = character.equipment.length;
                const progress = total > 0 ? (completed / total * 100) : 0;
                
                return (
                  <div key={character.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{character.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {character.class} • Lv.{character.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {character.server}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {completed}/{total} ({progress.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall StarForce Calculator - only starforceable equipment */}
      <StarForceTable 
        equipment={characters.flatMap(char => 
          char.equipment
            .filter(eq => eq.starforceable)
            .map(eq => ({ ...eq, characterName: char.name }))
        )}
        starForceItems={starForceItems}
        onAddStarForceItem={handleAddStarForceItem}
        onRemoveStarForceItem={handleRemoveStarForceItem}
        title="Overall StarForce Calculator"
        subtitle="All characters combined"
      />
    </div>
  );
}
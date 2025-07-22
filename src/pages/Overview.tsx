import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment } from "@/types";
import { StarForceTable } from "@/components/StarForceTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Target, Coins } from "lucide-react";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils";
import { getJobIcon, getJobColors, getJobCategoryName } from "@/lib/jobIcons";
import { useToast } from "@/hooks/use-toast";

export default function Overview() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    navigate('/characters');
  };

  const handleRemoveStarForceItem = (id: string) => {
    setStarForceItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMarkAsDone = (equipmentId: string) => {
    const updatedCharacters = characters.map(char => {
      const updatedEquipment = char.equipment.map(eq => {
        if (eq.id === equipmentId && eq.starforceable && eq.currentStarForce < eq.targetStarForce) {
          // Update current StarForce to match target StarForce
          return { ...eq, currentStarForce: eq.targetStarForce };
        }
        return eq;
      });
      return { ...char, equipment: updatedEquipment };
    });

    setCharacters(updatedCharacters);
    
    // Save to localStorage
    saveToLocalStorage(updatedCharacters, starForceItems);
    
    toast({
      title: "Equipment Completed",
      description: "StarForce goal achieved! Equipment updated.",
    });
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
                
                const JobIcon = getJobIcon(character.class);
                const jobColors = getJobColors(character.class);
                const jobCategory = getJobCategoryName(character.class);
                
                return (
                  <div key={character.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                        <JobIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{character.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {character.class} • Lv.{character.level}
                          </p>
                          <Badge variant="outline" className={`text-xs ${jobColors.bgMuted} ${jobColors.text} ${jobColors.border}`}>
                            {jobCategory}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
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
        onMarkAsDone={handleMarkAsDone}
        title="Overall StarForce Calculator"
        subtitle="All characters combined"
      />
    </div>
  );
}
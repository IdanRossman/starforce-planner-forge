import { useState, useEffect } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { mockCharacters } from "@/data/mockData";
import { CharacterWizard } from "@/components/CharacterWizard";
import { CharacterCard } from "@/components/CharacterCard";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Target,
  Calculator,
  Sparkles,
  Settings
} from "lucide-react";

export default function CharacterDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { toast } = useToast();

  // Initialize data on component mount
  useEffect(() => {
    const stored = loadFromLocalStorage();
    if (stored && stored.characters.length > 0) {
      setCharacters(stored.characters);
    } else {
      // Only show mock data if no stored data exists
      setCharacters(mockCharacters);
    }
  }, []);

  // Auto-save to localStorage when characters change
  useEffect(() => {
    saveToLocalStorage(characters, []);
  }, [characters]);

  // Auto-select first character when characters load
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0]);
    }
  }, [characters, selectedCharacter]);

  const handleCreateCharacter = (newCharacter: Omit<Character, 'id'>) => {
    const character: Character = {
      ...newCharacter,
      id: crypto.randomUUID(),
      starForceItems: [],
    };
    
    setCharacters(prev => [...prev, character]);
    setSelectedCharacter(character);
    
    toast({
      title: "Character Created",
      description: `${character.name} has been added to your roster!`,
    });
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleEditCharacter = (character: Character) => {
    // TODO: Implement character editing
    console.log('Edit character:', character);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
    
    toast({
      title: "Character Deleted",
      description: "Character has been removed from your roster.",
    });
  };

  const handleEditEquipment = (equipment: Equipment) => {
    // TODO: Implement equipment editing
    console.log('Edit equipment:', equipment);
  };

  const handleAddEquipment = (slot: EquipmentSlot) => {
    // TODO: Implement equipment adding
    console.log('Add equipment to slot:', slot);
  };

  const handleClearEquipment = (slot: EquipmentSlot) => {
    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        const filteredEquipment = char.equipment.filter(eq => eq.slot !== slot);
        return { ...char, equipment: filteredEquipment };
      }
      return char;
    });

    setCharacters(updatedCharacters);
    const updatedCharacter = updatedCharacters.find(char => char.id === selectedCharacter.id);
    if (updatedCharacter) {
      setSelectedCharacter(updatedCharacter);
    }
  };

  // Calculate character stats
  const getCharacterStats = (character: Character) => {
    const totalEquipment = character.equipment.length;
    const starforceableEquipment = character.equipment.filter(eq => eq.starforceable);
    const pendingStarforce = starforceableEquipment.filter(eq => eq.currentStarForce < eq.targetStarForce);
    const additionalItems = character.starForceItems?.length || 0;
    
    return {
      totalEquipment,
      starforceableEquipment: starforceableEquipment.length,
      pendingStarforce: pendingStarforce.length,
      additionalItems,
      completionRate: starforceableEquipment.length > 0 
        ? Math.round(((starforceableEquipment.length - pendingStarforce.length) / starforceableEquipment.length) * 100)
        : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Characters</h1>
          <p className="text-sm text-muted-foreground">
            Manage your MapleStory characters and plan their StarForce upgrades
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Character
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        // Empty State
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Welcome to StarForce Planner!
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first character to start planning equipment upgrades and calculating StarForce costs.
            </p>
            <Button 
              onClick={() => setWizardOpen(true)}
              size="lg"
              className="flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Main Dashboard
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Characters Sidebar */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Characters ({characters.length})
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {characters.map((character) => {
                  const stats = getCharacterStats(character);
                  return (
                    <div
                      key={character.id}
                      className={`relative transition-all duration-200 ${
                        selectedCharacter?.id === character.id 
                          ? 'ring-2 ring-primary' 
                          : ''
                      }`}
                    >
                      <CharacterCard
                        character={character}
                        onEdit={handleEditCharacter}
                        onDelete={handleDeleteCharacter}
                        onSelect={handleSelectCharacter}
                        isSelected={selectedCharacter?.id === character.id}
                      />
                      
                      {/* Quick Stats */}
                      {selectedCharacter?.id === character.id && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Equipment:</span>
                              <span className="font-medium">{stats.totalEquipment}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pending:</span>
                              <span className="font-medium text-orange-500">{stats.pendingStarforce}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Additional:</span>
                              <span className="font-medium">{stats.additionalItems}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Progress:</span>
                              <span className="font-medium text-green-500">{stats.completionRate}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {selectedCharacter ? (
              <div className="space-y-6">
                {/* Character Header */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{selectedCharacter.name}</CardTitle>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="px-3 py-1">
                            {selectedCharacter.class}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Level {selectedCharacter.level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Calculator className="w-4 h-4 mr-2" />
                          Calculator
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Equipment Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Equipment Overview
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Click equipment slots to edit or add new items
                    </p>
                  </CardHeader>
                  <CardContent>
                    <EquipmentGrid
                      equipment={selectedCharacter.equipment}
                      onEditEquipment={handleEditEquipment}
                      onAddEquipment={handleAddEquipment}
                      onClearEquipment={handleClearEquipment}
                    />
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">Ready to Plan?</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Open the enhanced calculator to set StarForce goals, view costs, and track progress with detailed statistics.
                      </p>
                      <Button size="lg" className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Open Enhanced Calculator
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Select a Character
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a character from the sidebar to view their equipment and start planning upgrades.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Character Creation Wizard */}
      <CharacterWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleCreateCharacter}
      />
    </div>
  );
}

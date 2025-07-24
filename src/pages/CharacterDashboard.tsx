import { useState, useEffect, useCallback } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { mockCharacters } from "@/data/mockData";
import { CharacterWizard } from "@/components/CharacterWizard";
import { CharacterCard } from "@/components/CharacterCard";
import { CharacterForm } from "@/components/CharacterForm";
import { EnhancedEquipmentManager } from "@/components/EnhancedEquipmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Target,
  Calculator,
  Sparkles,
  Settings,
  ChevronDown,
  Crown,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";

export default function CharacterDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [characterFormOpen, setCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to check if characters should be updated (once per day)
  const shouldUpdateCharacters = (): boolean => {
    try {
      const lastUpdate = localStorage.getItem("lastCharacterUpdate");
      if (!lastUpdate) return true;
      
      const now = new Date().getTime();
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      return (now - lastUpdateTime) >= twentyFourHours;
    } catch (error) {
      console.error("Error checking update timestamp:", error);
      return true; // Default to updating if we can't read the timestamp
    }
  };

  // Function to update all characters from MapleRanks
  const updateCharactersFromMapleRanks = useCallback(async () => {
    if (characters.length === 0) return;
    
    setIsUpdating(true);
    let updatedCount = 0;
    
    try {
      const updatedCharacters = await Promise.all(
        characters.map(async (character) => {
          try {
            const mapleRanksData = await fetchCharacterFromMapleRanks(character.name);
            if (mapleRanksData) {
              updatedCount++;
              return {
                ...character,
                level: mapleRanksData.level,
                class: mapleRanksData.class,
                image: mapleRanksData.image
              };
            }
            return character;
          } catch (error) {
            console.warn(`Failed to update character ${character.name}:`, error);
            return character;
          }
        })
      );

      if (updatedCount > 0) {
        setCharacters(updatedCharacters);
        saveToLocalStorage(updatedCharacters);
        const now = new Date().toISOString();
        localStorage.setItem("lastCharacterUpdate", now);
        setLastUpdateTime(now);
        toast({
          title: "Characters Updated",
          description: `Updated ${updatedCount} character${updatedCount !== 1 ? 's' : ''} from MapleRanks`,
        });
      }
    } catch (error) {
      console.error("Error updating characters:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update character data from MapleRanks",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [characters, toast]);

  // Initialize data on component mount
  useEffect(() => {
    const stored = loadFromLocalStorage();
    if (stored && stored.characters.length > 0) {
      setCharacters(stored.characters);
    } else {
      // Only show mock data if no stored data exists
      setCharacters(mockCharacters);
    }

    // Load last update timestamp
    const lastUpdate = localStorage.getItem("lastCharacterUpdate");
    if (lastUpdate) {
      setLastUpdateTime(lastUpdate);
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

  // Check for daily updates when characters are loaded
  useEffect(() => {
    if (characters.length > 0 && shouldUpdateCharacters()) {
      updateCharactersFromMapleRanks();
    }
  }, [characters.length, updateCharactersFromMapleRanks]);

  const handleCreateCharacter = (newCharacter: Omit<Character, 'id'>) => {
    if (editingCharacter) {
      // Update existing character
      const updatedCharacters = characters.map(char => 
        char.id === editingCharacter.id 
          ? { ...char, ...newCharacter }
          : char
      );
      setCharacters(updatedCharacters);
      
      // Update selected character if it was the one being edited
      if (selectedCharacter?.id === editingCharacter.id) {
        const updatedSelectedCharacter = updatedCharacters.find(char => char.id === editingCharacter.id);
        if (updatedSelectedCharacter) {
          setSelectedCharacter(updatedSelectedCharacter);
        }
      }
      
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated successfully!`,
      });
    } else {
      // Create new character
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
    }
    
    setCharacterFormOpen(false);
    setEditingCharacter(null);
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterFormOpen(true);
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

  const handleSaveEquipment = (equipment: Equipment) => {
    if (!selectedCharacter) return;

    const existingIndex = selectedCharacter.equipment.findIndex(eq => eq.id === equipment.id);
    
    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        let updatedEquipment;
        
        if (existingIndex >= 0) {
          // Update existing equipment
          updatedEquipment = char.equipment.map(eq => 
            eq.id === equipment.id ? equipment : eq
          );
        } else {
          // Add new equipment
          updatedEquipment = [...char.equipment, equipment];
        }
        
        return { ...char, equipment: updatedEquipment };
      }
      return char;
    });

    setCharacters(updatedCharacters);
    const updatedCharacter = updatedCharacters.find(char => char.id === selectedCharacter.id);
    if (updatedCharacter) {
      setSelectedCharacter(updatedCharacter);
    }

    toast({
      title: "Equipment Saved",
      description: `${equipment.name} has been ${existingIndex >= 0 ? 'updated' : 'added'}.`,
    });
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

  const handleUpdateStarforce = (equipmentId: string, current: number, target: number) => {
    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        const updatedEquipment = char.equipment.map(eq => 
          eq.id === equipmentId 
            ? { ...eq, currentStarForce: current, targetStarForce: target }
            : eq
        );
        return { ...char, equipment: updatedEquipment };
      }
      return char;
    });

    setCharacters(updatedCharacters);
    const updatedCharacter = updatedCharacters.find(char => char.id === selectedCharacter.id);
    if (updatedCharacter) {
      setSelectedCharacter(updatedCharacter);
    }
  };

  const handleUpdateActualCost = (equipmentId: string, actualCost: number) => {
    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        const updatedEquipment = char.equipment.map(eq => 
          eq.id === equipmentId 
            ? { ...eq, actualCost }
            : eq
        );
        const updatedStarForceItems = (char.starForceItems || []).map(eq => 
          eq.id === equipmentId 
            ? { ...eq, actualCost }
            : eq
        );
        return { ...char, equipment: updatedEquipment, starForceItems: updatedStarForceItems };
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
            {lastUpdateTime && (
              <>
                <br />
                <span className="text-xs">
                  Last updated from MapleRanks: {new Date(lastUpdateTime).toLocaleDateString()} at {new Date(lastUpdateTime).toLocaleTimeString()}
                </span>
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={updateCharactersFromMapleRanks}
            disabled={isUpdating || characters.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Refresh from MapleRanks'}
          </Button>
          
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
        // Main Dashboard with Top Bar
        <div className="space-y-6">
          {/* Character Selection Top Bar */}
          <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Active Character</h2>
                  </div>
                  
                  {/* Action Buttons */}
                  {selectedCharacter && (
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCharacter(selectedCharacter)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteCharacter(selectedCharacter.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Character Selection & Display */}
                <div className="flex items-center gap-8">
                  {/* Character Selector */}
                  <div className="flex-1">
                    <Select
                      value={selectedCharacter?.id || ""}
                      onValueChange={(value) => {
                        const character = characters.find(char => char.id === value);
                        if (character) handleSelectCharacter(character);
                      }}
                    >
                      <SelectTrigger className="w-full h-16 bg-background/80 text-left">
                        <SelectValue placeholder="Select a character to get started">
                          {selectedCharacter ? (
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Crown className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-lg">{selectedCharacter.name}</div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {selectedCharacter.class}
                                  </Badge>
                                  <span>Level {selectedCharacter.level}</span>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {characters.map((character) => {
                          const stats = getCharacterStats(character);
                          return (
                            <SelectItem key={character.id} value={character.id}>
                              <div className="flex items-center gap-4 py-2">
                                {character.image ? (
                                  <img 
                                    src={character.image} 
                                    alt={character.name}
                                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-primary/20">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{character.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {character.class}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Lv.{character.level} • {stats.totalEquipment} items • {stats.pendingStarforce} pending
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Large Character Display */}
                  {selectedCharacter && (
                    <div className="flex items-center gap-6">
                      {/* Character Portrait */}
                      <div className="relative">
                        {selectedCharacter.image ? (
                          <img 
                            src={selectedCharacter.image} 
                            alt={selectedCharacter.name}
                            className="w-32 h-32 rounded-full object-cover border-4 border-primary/30 shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-4 border-primary/30 shadow-lg">
                            <Users className="w-12 h-12 text-primary" />
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>

                      {/* Character Stats */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{selectedCharacter.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" className="px-3 py-1">
                              {selectedCharacter.class}
                            </Badge>
                            <span className="text-muted-foreground">Level {selectedCharacter.level}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          {(() => {
                            const stats = getCharacterStats(selectedCharacter);
                            return (
                              <>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">{stats.totalEquipment}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Equipment</div>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Calculator className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-orange-500">{stats.pendingStarforce}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Pending</div>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Sparkles className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-500">{stats.completionRate}%</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Progress</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          {selectedCharacter ? (
            <div className="space-y-6">
              {/* Enhanced Equipment Manager - Full Width */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Equipment Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage your equipment and StarForce goals with real-time editing
                  </p>
                </CardHeader>
                <CardContent>
                  <EnhancedEquipmentManager
                    equipment={selectedCharacter.equipment}
                    onEditEquipment={handleEditEquipment}
                    onAddEquipment={handleAddEquipment}
                    onClearEquipment={handleClearEquipment}
                    onUpdateStarforce={handleUpdateStarforce}
                    onUpdateActualCost={handleUpdateActualCost}
                    onSaveEquipment={handleSaveEquipment}
                    selectedJob={selectedCharacter.class}
                  />
                </CardContent>
              </Card>

              {/* Enhanced Calculator Placeholder */}
              <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">Enhanced StarForce Calculator</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Interactive calculator with inline editing, real-time statistics, and advanced planning features coming soon.
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
                  Choose a character from the dropdown above to view their equipment and start planning upgrades.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Character Creation Wizard */}
      <CharacterWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleCreateCharacter}
      />

      {/* Character Edit Form */}
      <CharacterForm 
        open={characterFormOpen}
        onOpenChange={setCharacterFormOpen}
        onAddCharacter={handleCreateCharacter}
        editingCharacter={editingCharacter}
        onEditingChange={setEditingCharacter}
      />
    </div>
  );
}

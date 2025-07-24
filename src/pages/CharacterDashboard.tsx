import { useState, useEffect, useCallback } from "react";
import { Character, Equipment, EquipmentSlot, EquipmentType } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { findEquipmentByName } from "@/data/equipmentDatabase";
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
  RefreshCw,
  Download,
  Upload,
  Copy,
  Share
} from "lucide-react";

export default function CharacterDashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [characterFormOpen, setCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  
  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();

  // Import/Export utility functions
  const exportCharacters = (charactersToExport: Character[]) => {
    try {
      // Create a compressed version of the character data
      const exportData = charactersToExport.map(char => ({
        n: char.name, // name
        c: char.class, // class
        l: char.level, // level
        i: char.image, // image (already base64 or URL)
        e: char.equipment.map(eq => ({
          n: eq.name, // name
          s: eq.slot, // slot
          t: eq.type, // type
          lv: eq.level, // level
          st: eq.set, // set
          sf: eq.starforceable, // starforceable
          c: eq.currentStarForce, // currentStarForce
          tg: eq.targetStarForce, // targetStarForce
          tr: eq.tier, // tier
          ac: eq.actualCost, // actualCost
          img: eq.image // image
        })),
        sf: (char.starForceItems || []).map(eq => ({
          n: eq.name,
          s: eq.slot,
          t: eq.type,
          lv: eq.level,
          st: eq.set,
          sf: eq.starforceable,
          c: eq.currentStarForce,
          tg: eq.targetStarForce,
          tr: eq.tier,
          ac: eq.actualCost,
          img: eq.image
        }))
      }));

      const jsonString = JSON.stringify(exportData);
      const base64String = btoa(jsonString);
      return base64String;
    } catch (error) {
      console.error("Export error:", error);
      throw new Error("Failed to export character data");
    }
  };

  const importCharacters = (base64Data: string): Character[] => {
    try {
      const jsonString = atob(base64Data);
      const importData = JSON.parse(jsonString);

      const characters: Character[] = importData.map((char: {
        n: string;
        c: string;
        l: number;
        i?: string;
        e?: Array<{
          n?: string;
          s: string;
          t?: string;
          lv?: number;
          st?: string;
          sf?: boolean;
          c?: number;
          tg?: number;
          tr?: string;
          ac?: number;
          img?: string;
        }>;
        sf?: Array<{
          n?: string;
          s: string;
          t?: string;
          lv?: number;
          st?: string;
          sf?: boolean;
          c?: number;
          tg?: number;
          tr?: string;
          ac?: number;
          img?: string;
        }>;
      }) => {
        const reconstructEquipment = (eq: {
          n?: string;
          s: string;
          t?: string;
          lv?: number;
          st?: string;
          sf?: boolean;
          c?: number;
          tg?: number;
          tr?: string;
          ac?: number;
          img?: string;
        }) => {
          // Try to find equipment data from database if name is available
          let equipmentData = null;
          if (eq.n) {
            equipmentData = findEquipmentByName(eq.s as EquipmentSlot, eq.n);
          }

          // Determine equipment type based on slot if not provided
          const getEquipmentTypeFromSlot = (slot: EquipmentSlot): EquipmentType => {
            const weaponSlots = ['weapon', 'secondary', 'emblem'];
            const accessorySlots = ['face', 'eye', 'earring', 'ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'badge', 'medal', 'heart', 'pocket'];
            
            if (weaponSlots.includes(slot)) return 'weapon';
            if (accessorySlots.includes(slot)) return 'accessory';
            return 'armor';
          };

          const equipmentType = eq.t as EquipmentType || getEquipmentTypeFromSlot(eq.s as EquipmentSlot);

          const finalEquipment = {
            id: crypto.randomUUID(),
            name: eq.n || 'Custom Equipment',
            slot: eq.s as EquipmentSlot,
            type: equipmentType,
            level: eq.lv || equipmentData?.level || 150,
            set: eq.st || equipmentData?.set,
            starforceable: eq.sf !== undefined ? eq.sf : true,
            currentStarForce: eq.c || 0,
            targetStarForce: eq.tg || 0,
            tier: eq.tr || equipmentData?.tier || null,
            actualCost: eq.ac,
            // Use provided image, or fall back to database image, or undefined
            image: eq.img || equipmentData?.image
          };

          // Debug logging for image issues
          if (eq.n && !finalEquipment.image) {
            console.log(`No image found for ${eq.n} in slot ${eq.s}:`, {
              providedImage: eq.img,
              databaseImage: equipmentData?.image,
              equipmentData
            });
          }

          return finalEquipment;
        };

        return {
          id: crypto.randomUUID(),
          name: char.n,
          class: char.c,
          level: char.l,
          image: char.i,
          equipment: (char.e || []).map(reconstructEquipment),
          starForceItems: (char.sf || []).map(reconstructEquipment)
        };
      });

      return characters;
    } catch (error) {
      console.error("Import error:", error);
      throw new Error("Invalid character data format");
    }
  };

  const handleExport = () => {
    try {
      const exportData = exportCharacters(characters);
      setExportText(exportData);
      setExportDialogOpen(true);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export character data.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast({
        title: "No Data",
        description: "Please paste your character data to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const importedCharacters = importCharacters(importText.trim());
      setCharacters(prev => [...prev, ...importedCharacters]);
      setImportDialogOpen(false);
      setImportText("");
      toast({
        title: "Import Successful",
        description: `Imported ${importedCharacters.length} character(s) successfully!`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid import data.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Character data copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

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
            onClick={handleExport}
            disabled={characters.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          <Button 
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          
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
            <div className="flex items-center gap-4 justify-center">
              <Button 
                onClick={() => setWizardOpen(true)}
                size="lg"
                className="flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Create Your First Character
              </Button>
              <div className="text-muted-foreground">or</div>
              <Button 
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Import Characters
              </Button>
            </div>
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Characters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Character Data
              </label>
              <Textarea
                placeholder="Paste your exported character data here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[120px] font-mono text-xs"
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setImportDialogOpen(false);
                  setImportText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import Characters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Characters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Character Data ({characters.length} character{characters.length !== 1 ? 's' : ''})
              </label>
              <Textarea
                value={exportText}
                readOnly
                className="min-h-[120px] font-mono text-xs bg-muted"
                placeholder="Character data will appear here..."
              />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Share className="w-4 h-4" />
                How to Share
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Copy the data above and share it with others. They can import it using the Import Characters feature.
              </p>
              <div className="text-xs text-muted-foreground">
                Data size: ~{Math.ceil(exportText.length / 1024)}KB • 
                Includes: character info, equipment, and StarForce data
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => copyToClipboard(exportText)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

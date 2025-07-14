import { useState, useEffect } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { mockCharacters } from "@/data/mockData";
import { CharacterCard } from "@/components/CharacterCard";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { StarForceTable } from "@/components/StarForceTable";
import { EquipmentForm } from "@/components/EquipmentForm";
import { CharacterForm } from "@/components/CharacterForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Swords, Calculator, Download, Upload, Share2, Copy, Check, Target } from "lucide-react";
import { exportCharacterData, importCharacterData, saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [addingToSlot, setAddingToSlot] = useState<EquipmentSlot | null>(null);
  const [starForceItems, setStarForceItems] = useState<Equipment[]>([]);
  const [addingStarForceItem, setAddingStarForceItem] = useState(false);
  
  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();

  // Initialize data on component mount
  useEffect(() => {
    // Check URL for import data first
    const urlParams = new URLSearchParams(window.location.search);
    const urlData = urlParams.get('data');
    
    if (urlData) {
      try {
        const imported = importCharacterData(urlData);
        setCharacters(imported.characters);
        setStarForceItems(imported.starForceItems || []);
        toast({
          title: "Data Imported",
          description: "Character data loaded from URL successfully!",
        });
        // Clean URL after import
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } catch (error) {
        toast({
          title: "Import Failed", 
          description: "Failed to load data from URL. Loading default data.",
          variant: "destructive",
        });
      }
    }
    
    // Try to load from localStorage, fallback to mock data
    const stored = loadFromLocalStorage();
    if (stored && mockCharacters.length > 0) {
      setCharacters(stored.characters);
      setStarForceItems(stored.starForceItems);
    } else {
      // Clear localStorage if mock data is empty (starting fresh)
      if (mockCharacters.length === 0) {
        localStorage.removeItem('starforce-planner-characters');
        localStorage.removeItem('starforce-planner-starforce-items');
      }
      setCharacters(mockCharacters);
    }
  }, [toast]);

  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (characters.length > 0) {
      saveToLocalStorage(characters, starForceItems);
    }
  }, [characters, starForceItems]);

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setSelectedEquipment(null);
  };

  const handleEditCharacter = (character: Character) => {
    // TODO: Open character edit dialog
    console.log("Edit character:", character);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
  };

  const addCharacter = (newCharacter: Omit<Character, 'id'>) => {
    const character: Character = {
      ...newCharacter,
      id: `char-${Date.now()}`, // Simple ID generation for demo
    };
    setCharacters([...characters, character]);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEditingEquipment(equipment);
    setAddingToSlot(null);
    setEquipmentFormOpen(true);
  };

  const handleAddEquipment = (slot: EquipmentSlot) => {
    setEditingEquipment(null);
    setAddingToSlot(slot);
    setAddingStarForceItem(false);
    setEquipmentFormOpen(true);
  };

  const handleAddStarForceItem = () => {
    setAddingStarForceItem(true);
    setAddingToSlot(null);
    setEditingEquipment(null);
    setEquipmentFormOpen(true);
  };

  const handleRemoveStarForceItem = (id: string) => {
    setStarForceItems(prev => prev.filter(item => item.id !== id));
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

  const handleResetAllEquipment = () => {
    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        return { ...char, equipment: [] };
      }
      return char;
    });

    setCharacters(updatedCharacters);
    const updatedCharacter = updatedCharacters.find(char => char.id === selectedCharacter.id);
    if (updatedCharacter) {
      setSelectedCharacter(updatedCharacter);
    }

    toast({
      title: "Equipment Reset",
      description: `All equipment cleared for ${selectedCharacter.name}`,
    });
  };

  const handleSaveEquipment = (equipmentData: Omit<Equipment, 'id'> | Equipment) => {
    if (addingStarForceItem) {
      // Adding equipment for star force calculation only
      const newEquipment: Equipment = {
        ...equipmentData,
        id: `sf-${Date.now()}`,
      } as Equipment;
      
      setStarForceItems(prev => [...prev, newEquipment]);
      setEquipmentFormOpen(false);
      setAddingStarForceItem(false);
      return;
    }

    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter.id) {
        if ('id' in equipmentData) {
          // Editing existing equipment
          const updatedEquipment = char.equipment.map(eq => 
            eq.id === equipmentData.id ? equipmentData as Equipment : eq
          );
          return { ...char, equipment: updatedEquipment };
        } else {
          // Adding new equipment
          const newEquipment: Equipment = {
            ...equipmentData,
            id: `eq-${Date.now()}`,
          };
          const filteredEquipment = char.equipment.filter(eq => eq.slot !== newEquipment.slot);
          return { ...char, equipment: [...filteredEquipment, newEquipment] };
        }
      }
      return char;
    });

    setCharacters(updatedCharacters);
    const updatedCharacter = updatedCharacters.find(char => char.id === selectedCharacter.id);
    if (updatedCharacter) {
      setSelectedCharacter(updatedCharacter);
    }

    setEquipmentFormOpen(false);
    setEditingEquipment(null);
    setAddingToSlot(null);
  };

  // Import/Export functions
  const handleExport = () => {
    try {
      const exportData = exportCharacterData(characters, starForceItems);
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
      const imported = importCharacterData(importText.trim());
      setCharacters(imported.characters);
      setStarForceItems(imported.starForceItems || []);
      setSelectedCharacter(null);
      setImportDialogOpen(false);
      setImportText("");
      toast({
        title: "Import Successful",
        description: `Imported ${imported.characters.length} character(s) successfully!`,
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
        description: "Data copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?data=${exportText}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-maple-orange bg-clip-text text-transparent">
                MapleStory StarForce Planner
              </h1>
              <p className="text-muted-foreground">Plan your equipment upgrades efficiently</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Export Character Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-data">Character Data (Base64)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="export-data"
                          value={exportText}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          onClick={() => copyToClipboard(exportText)}
                          variant="outline"
                          size="icon"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="share-url">Shareable URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="share-url"
                          value={generateShareUrl()}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          onClick={() => copyToClipboard(generateShareUrl())}
                          variant="outline"
                          size="icon"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Character Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-data">Paste Character Data</Label>
                      <textarea
                        id="import-data"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Paste your exported character data here..."
                        className="w-full h-32 p-3 border rounded-md font-mono text-xs resize-none"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleImport}>
                        Import
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <CharacterForm onAddCharacter={addCharacter} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Characters List */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Characters ({characters.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {characters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onEdit={handleEditCharacter}
                    onDelete={handleDeleteCharacter}
                    onSelect={handleSelectCharacter}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Character Details */}
          <div className="col-span-12 lg:col-span-8">
            {selectedCharacter ? (
              <Tabs defaultValue="equipment" className="space-y-6">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="equipment" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Equipment
                  </TabsTrigger>
                  <TabsTrigger value="calculator" className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Calculator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="space-y-6">
                  <Card className="bg-gradient-to-br from-card to-card/80">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedCharacter.name}'s Equipment</span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetAllEquipment}
                            className="text-destructive hover:text-destructive"
                          >
                            Reset All
                          </Button>
                          <div className="text-sm text-muted-foreground">
                            {selectedCharacter.class} • Lv.{selectedCharacter.level}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EquipmentGrid
                        equipment={selectedCharacter.equipment}
                        onEditEquipment={handleEditEquipment}
                        onAddEquipment={handleAddEquipment}
                        onClearEquipment={handleClearEquipment}
                        onOpenCalculator={() => {
                          // Switch to calculator tab
                          const calculatorTab = document.querySelector('[value="calculator"]') as HTMLElement;
                          calculatorTab?.click();
                        }}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="calculator" className="space-y-6">
                  <StarForceTable 
                    equipment={selectedCharacter.equipment} 
                    starForceItems={starForceItems}
                    onAddStarForceItem={handleAddStarForceItem}
                    onRemoveStarForceItem={handleRemoveStarForceItem}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-gradient-to-br from-card to-card/80">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Select a Character
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a character from the list to view and manage their equipment
                  </p>
                  <CharacterForm onAddCharacter={addCharacter} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Equipment Form Dialog */}
        <EquipmentForm
          open={equipmentFormOpen}
          onOpenChange={(open) => {
            setEquipmentFormOpen(open);
            if (!open) {
              setAddingStarForceItem(false);
              setAddingToSlot(null);
              setEditingEquipment(null);
            }
          }}
          equipment={editingEquipment}
          defaultSlot={addingToSlot}
          allowSlotEdit={addingStarForceItem}
          onSave={handleSaveEquipment}
        />
      </div>
    </div>
  );
}
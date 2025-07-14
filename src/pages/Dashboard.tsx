import { useState } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { CharacterCard } from "@/components/CharacterCard";
import { CharacterForm } from "@/components/CharacterForm";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { StarForceTable } from "@/components/StarForceTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Target, Calculator } from "lucide-react";
import { mockCharacters } from "@/data/mockData";

export default function Dashboard() {
  const [characters, setCharacters] = useState<Character[]>(mockCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [addingToSlot, setAddingToSlot] = useState<EquipmentSlot | null>(null);

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
    setEquipmentFormOpen(true);
  };

  const handleSaveEquipment = (equipmentData: Omit<Equipment, 'id'> | Equipment) => {
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
            <CharacterForm onAddCharacter={addCharacter} />
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
                        <div className="text-sm text-muted-foreground">
                          {selectedCharacter.class} • Lv.{selectedCharacter.level}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EquipmentGrid
                        equipment={selectedCharacter.equipment}
                        onEditEquipment={handleEditEquipment}
                        onAddEquipment={handleAddEquipment}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="calculator" className="space-y-6">
                  {selectedCharacter.equipment.length > 0 ? (
                    <StarForceTable equipment={selectedCharacter.equipment} />
                  ) : (
                    <Card className="bg-gradient-to-br from-card to-card/80">
                      <CardContent className="py-12 text-center">
                        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Equipment Found
                        </h3>
                        <p className="text-muted-foreground">
                          Add equipment to this character to start calculating StarForce costs
                        </p>
                      </CardContent>
                    </Card>
                  )}
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
          onOpenChange={setEquipmentFormOpen}
          equipment={editingEquipment}
          defaultSlot={addingToSlot}
          onSave={handleSaveEquipment}
        />
      </div>
    </div>
  );
}
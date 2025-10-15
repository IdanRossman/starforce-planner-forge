import { useState, useEffect } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { CharacterWizard } from "@/components/CharacterWizard";
import { CharacterForm } from "@/components/CharacterForm";
import { EnhancedEquipmentManager } from "@/components/EnhancedEquipmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackCharacterCreation, trackCharacterDeletion } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { useEquipment, useCharacter } from "@/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Target,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Star,
  TrendingUp,
  Package,
  Sparkles
} from "lucide-react";

export default function CharacterDashboard() {
  // Use Character Context and Operations
  const { selectedCharacter, characters } = useCharacterContext();
  const { 
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    getCharacterSummary
  } = useCharacter();
  const { 
    updateStarForce: updateEquipmentStarForce, 
    updateActualCost: updateEquipmentActualCost, 
    transferStarForce: transferEquipment,
    updateEquipment: saveEquipment,
    addEquipment,
    removeEquipment,
    clearEquipmentSlot
  } = useEquipment();
  
  // Local state for UI components only
  const [wizardOpen, setWizardOpen] = useState(false);
  const [characterFormOpen, setCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar state
  
  // Import/Export state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();

  // Character card selection handler
  const handleSelectCharacter = (character: Character) => {
    selectCharacter(character.id);
  };

  // Character CRUD handlers
  const handleCreateCharacter = (newCharacter: Character) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, newCharacter);
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated!`,
      });
    } else {
      createCharacter(newCharacter);
      trackCharacterCreation(newCharacter.class, newCharacter.name);
      toast({
        title: "Character Created",
        description: `${newCharacter.name} has been added to your roster!`,
      });
    }
    
    setCharacterFormOpen(false);
    setEditingCharacter(null);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterFormOpen(true);
  };

  const handleDeleteCharacter = (id: string) => {
    const characterToDelete = characters.find(char => char.id === id);
    if (characterToDelete) {
      deleteCharacter(id);
      trackCharacterDeletion(characterToDelete.class);
      toast({
        title: "Character Deleted",
        description: "Character has been removed from your roster.",
      });
    }
  };

  // Equipment handlers
  const handleEditEquipment = (equipment: Equipment) => {
    console.log('Edit equipment:', equipment);
  };

  const handleSaveEquipment = (equipment: Equipment) => {
    const existingEquipment = selectedCharacter?.equipment.find(eq => eq.id === equipment.id);
    
    if (existingEquipment) {
      saveEquipment(equipment.id, equipment);
      toast({
        title: "Equipment Updated",
        description: `${equipment.name} has been updated.`,
      });
    } else {
      addEquipment(equipment);
      toast({
        title: "Equipment Added",
        description: `${equipment.name} has been added.`,
      });
    }
  };

  const handleAddEquipment = (slot: EquipmentSlot) => {
    console.log('Add equipment to slot:', slot);
  };

  const handleClearEquipment = (slot: EquipmentSlot) => {
    clearEquipmentSlot(slot);
  };

  const handleUpdateStarforce = (equipmentId: string, current: number, target: number) => {
    updateEquipmentStarForce(equipmentId, current, target);
  };

  const handleUpdateActualCost = (equipmentId: string, actualCost: number) => {
    updateEquipmentActualCost(equipmentId, actualCost);
  };

  const handleTransferEquipment = (sourceEquipment: Equipment, targetEquipment: Equipment) => {
    toast({
      title: "Transfer Planned",
      description: `Transfer planned: ${sourceEquipment.name} → ${targetEquipment.name}`,
    });
  };

  // Calculate character stats
  const getCharacterStats = (character: Character) => {
    const totalEquipment = character.equipment.length;
    const starforceableItems = character.equipment.filter(eq => eq.starforceable).length;
    const totalCurrentStars = character.equipment
      .filter(eq => eq.starforceable)
      .reduce((sum, eq) => sum + eq.currentStarForce, 0);
    const totalTargetStars = character.equipment
      .filter(eq => eq.starforceable)
      .reduce((sum, eq) => sum + eq.targetStarForce, 0);
    const starsNeeded = totalTargetStars - totalCurrentStars;

    return {
      totalEquipment,
      starforceableItems,
      totalCurrentStars,
      totalTargetStars,
      starsNeeded
    };
  };

  return (
    <div className="flex h-screen overflow-hidden p-4 gap-4">
      {/* Sidebar for Character Selection */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 60 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-card/30 backdrop-blur-md border border-border/50 rounded-3xl flex flex-col relative z-10 overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold font-maplestory text-foreground">Characters</h2>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0 rounded-full"
          >
            {sidebarOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </Button>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-2">
          {characters.length === 0 ? (
            <div className="p-4 text-center">
              {sidebarOpen ? (
                <>
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-maplestory mb-3">
                    No characters yet
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setWizardOpen(true)}
                    className="w-full font-maplestory"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Character
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setWizardOpen(true)}
                  className="w-full h-10 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <TooltipProvider>
              <div className="space-y-2">
                {characters.map((character) => {
                  const stats = getCharacterStats(character);
                  const isSelected = selectedCharacter?.id === character.id;
                
                return (
                  <motion.div
                    key={character.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`rounded-lg p-2 cursor-pointer transition-all ${
                        sidebarOpen
                          ? isSelected
                            ? 'bg-primary/20 border border-primary'
                            : 'bg-card/50 border border-transparent hover:bg-card hover:border-primary/30'
                          : isSelected
                            ? 'bg-primary/20'
                            : 'bg-card/50 hover:bg-card'
                      }`}
                      onClick={() => handleSelectCharacter(character)}
                    >
                      {sidebarOpen ? (
                        <div className="space-y-2">
                          {/* Character Info */}
                          <div className="flex items-center gap-3">
                            {character.image ? (
                              <img
                                src={character.image}
                                alt={character.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm font-maplestory truncate">
                                {character.name}
                              </h3>
                              <p className="text-xs text-muted-foreground font-maplestory truncate">
                                Lv. {character.level} {character.class}
                              </p>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/30">
                              <div className="flex items-center justify-center gap-1.5">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-semibold font-maplestory">{stats.totalCurrentStars}</span>
                              </div>
                            </div>
                            <div className="bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/30">
                              <div className="flex items-center justify-center gap-1.5">
                                <Target className="w-3 h-3 text-primary" />
                                <span className="text-xs font-semibold font-maplestory">{stats.totalTargetStars}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 flex-1 text-xs rounded-full hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCharacter(character);
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCharacter(character.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Collapsed view - just avatar
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              {character.image ? (
                                <img
                                  src={character.image}
                                  alt={character.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={15} className="font-maplestory z-50">
                            <p>{character.name}</p>
                            <p className="text-xs text-muted-foreground">Lv. {character.level} {character.class}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Sidebar Footer - Actions */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border/50 space-y-2">
            <Button
              onClick={() => setWizardOpen(true)}
              className="w-full font-maplestory bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Character
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="w-full font-maplestory"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-0 pointer-events-none"
          />
        )}
        <div className="relative z-10 mx-auto px-6 py-8 max-w-[1800px]">
          {/* Equipment Management Section */}
          {selectedCharacter ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-border/50">
                <CardContent className="p-6">
                  <EnhancedEquipmentManager
                    equipment={selectedCharacter.equipment}
                    onEditEquipment={handleEditEquipment}
                    onAddEquipment={handleAddEquipment}
                    onClearEquipment={handleClearEquipment}
                    onUpdateStarforce={handleUpdateStarforce}
                    onUpdateActualCost={handleUpdateActualCost}
                    onSaveEquipment={handleSaveEquipment}
                    onTransfer={handleTransferEquipment}
                    selectedJob={selectedCharacter.class}
                    characterId={selectedCharacter.id}
                    characterName={selectedCharacter.name}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Target className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-2 font-maplestory">
                  No Character Selected
                </h3>
                <p className="text-muted-foreground mb-6 font-maplestory">
                  Select a character from the sidebar to manage their equipment
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
            <DialogTitle className="font-maplestory">Import Characters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your exported character data here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {/* handleImport */}} className="font-maplestory">
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

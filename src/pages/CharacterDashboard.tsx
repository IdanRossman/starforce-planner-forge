import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { CharacterForm } from "@/components/CharacterForm";
import { EnhancedEquipmentManager } from "@/components/EnhancedEquipmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackCharacterCreation, trackCharacterDeletion } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { useEquipment, useCharacter } from "@/hooks";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import CharacterCallingCard from "@/components/CharacterCallingCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Target,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Star,
  TrendingUp,
  Package,
  Sparkles
} from "lucide-react";

export default function CharacterDashboard() {
  const navigate = useNavigate();
  
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
    transferStarForce: transferEquipment,
    updateEquipment: saveEquipment,
    addEquipment,
    removeEquipment,
    clearEquipmentSlot
  } = useEquipment();
  
  // Local state for UI components only
  const [characterFormOpen, setCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [characterSprite, setCharacterSprite] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCharacter) { setCharacterSprite(null); return; }
    const name = selectedCharacter.name;
    let cancelled = false;
    fetchCharacterFromMapleRanks(name).then(data => {
      if (!cancelled) setCharacterSprite(data?.image ?? null);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter?.id, selectedCharacter?.name]);
  
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
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    const characterToDelete = characters.find(char => char.id === deleteConfirmId);
    if (characterToDelete) {
      deleteCharacter(deleteConfirmId);
      trackCharacterDeletion(characterToDelete.class);
      toast({
        title: "Character Deleted",
        description: "Character has been removed from your roster.",
      });
    }
    setDeleteConfirmId(null);
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
          <div className="flex items-center gap-1">
            {sidebarOpen && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={() => navigate('/character/new')}
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={characters.length >= 6}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {characters.length >= 6 ? (
                    <TooltipContent className="font-maplestory max-w-[200px] text-center">
                      Character slots full (6/6). Delete a character and wait 1 hour to free a slot.
                    </TooltipContent>
                  ) : (
                    <TooltipContent className="font-maplestory">
                      New Character
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
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
                    onClick={() => navigate('/character/new')}
                    className="w-full font-maplestory"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Character
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/character/new')}
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
                  const isSelected = selectedCharacter?.id === character.id;

                  return (
                    <motion.div key={character.id} layout whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      {sidebarOpen ? (
                        <CharacterCallingCard
                          character={character}
                          isSelected={isSelected}
                          onClick={() => handleSelectCharacter(character)}
                          onEdit={(e) => { e.stopPropagation(); handleEditCharacter(character); }}
                          onDelete={(e) => { e.stopPropagation(); handleDeleteCharacter(character.id); }}
                        />
                      ) : (
                        // Collapsed view - just avatar
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div
                              className={`relative w-10 h-10 rounded-full overflow-hidden cursor-pointer ${isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-white/10'}`}
                              onClick={() => handleSelectCharacter(character)}
                            >
                              {character.callingCardHash ? (
                                <img
                                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/calling-cards/${character.callingCardHash}.png`}
                                  alt={character.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={15} className="font-maplestory z-50">
                            <p>{character.name}</p>
                            <p className="text-xs text-muted-foreground">Lv. {character.level} {character.class}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>
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
                    onSaveEquipment={handleSaveEquipment}
                    onTransfer={handleTransferEquipment}
                    selectedJob={selectedCharacter.class}
                    characterId={selectedCharacter.id}
                    characterName={selectedCharacter.name}
                    characterImage={characterSprite ?? undefined}
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

      {/* Character Edit Form */}
      <CharacterForm 
        open={characterFormOpen}
        onOpenChange={setCharacterFormOpen}
        onAddCharacter={handleCreateCharacter}
        editingCharacter={editingCharacter}
        onEditingChange={setEditingCharacter}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-maplestory">Delete Character?</DialogTitle>
            <DialogDescription className="font-maplestory space-y-2 pt-1">
              <span className="block">
                {deleteConfirmId && characters.find(c => c.id === deleteConfirmId)?.name} will be permanently deleted.
              </span>
              <span className="block text-yellow-400/90">
                Note: the character slot stays occupied for 1 hour after deletion. You won't be able to create a new character until then.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="font-maplestory">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="font-maplestory">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

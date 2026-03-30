import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment } from "@/types";
import { CharacterForm } from "@/components/CharacterForm";
import { EnhancedEquipmentManager } from "@/components/EnhancedEquipmentManager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackCharacterCreation, trackCharacterDeletion } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { useEquipment, useCharacter } from "@/hooks";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { apiService } from "@/services/api";
import { getJobColors } from "@/lib/jobIcons";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DAILY_LIMIT = 3;

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

function getRemainingGenerations(character: Character): number {
  const today = getTodayUTC();
  const genDate = character.cardGenerationDate;
  if (genDate && genDate.startsWith(today)) {
    return Math.max(0, DAILY_LIMIT - (character.cardGenerationCount ?? 0));
  }
  return DAILY_LIMIT;
}

function getCardUrl(hash: string | null | undefined): string | null {
  if (!hash) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/calling-cards/${hash}.png`;
}

export default function CharacterDashboard() {
  const navigate = useNavigate();

  const { selectedCharacter, characters, updateCharacter: ctxUpdateCharacter } = useCharacterContext();
  const {
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
  } = useCharacter();
  const {
    updateStarForce: updateEquipmentStarForce,
    updateEquipment: saveEquipment,
    addEquipment,
    clearEquipmentSlot,
  } = useEquipment();

  const [characterFormOpen, setCharacterFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [characterSprite, setCharacterSprite] = useState<string | null>(null);

  // Calling card regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { toast: toastHook } = useToast();

  // Fetch sprite on character change
  useEffect(() => {
    if (!selectedCharacter) { setCharacterSprite(null); return; }
    let cancelled = false;
    fetchCharacterFromMapleRanks(selectedCharacter.name).then(data => {
      if (!cancelled) setCharacterSprite(data?.image ?? null);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter?.id, selectedCharacter?.name]);

  // Poll for calling card if not yet generated
  useEffect(() => {
    if (!selectedCharacter || selectedCharacter.callingCardHash) return;
    const interval = setInterval(async () => {
      try {
        const card = await apiService.getCallingCard(selectedCharacter.id);
        if (card?.hash) {
          ctxUpdateCharacter(selectedCharacter.id, { callingCardHash: card.hash });
        }
      } catch { /* 404 = not ready yet, keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter?.id, selectedCharacter?.callingCardHash]);

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedCharacter) return;
    const remaining = getRemainingGenerations(selectedCharacter);
    if (remaining === 0) return;
    setIsRegenerating(true);
    try {
      const { hash } = await apiService.regenerateCallingCard(selectedCharacter.id);
      const today = getTodayUTC();
      const isSameDay = selectedCharacter.cardGenerationDate?.startsWith(today);
      const newCount = isSameDay ? (selectedCharacter.cardGenerationCount ?? 0) + 1 : 1;
      ctxUpdateCharacter(selectedCharacter.id, {
        callingCardHash: hash,
        cardGenerationCount: newCount,
        cardGenerationDate: today,
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        const today = getTodayUTC();
        ctxUpdateCharacter(selectedCharacter.id, { cardGenerationCount: DAILY_LIMIT, cardGenerationDate: today });
        toast.warning("You've used all 3 generations for today. Try again tomorrow.");
      } else {
        toast.error('Card generation failed, please try again.');
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreateCharacter = (newCharacter: Character) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, newCharacter);
      toastHook({ title: "Character Updated", description: `${newCharacter.name} has been updated!` });
    } else {
      createCharacter(newCharacter);
      trackCharacterCreation(newCharacter.class, newCharacter.name);
      toastHook({ title: "Character Created", description: `${newCharacter.name} has been added!` });
    }
    setCharacterFormOpen(false);
    setEditingCharacter(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    const char = characters.find(c => c.id === deleteConfirmId);
    if (char) {
      deleteCharacter(deleteConfirmId);
      trackCharacterDeletion(char.class);
      toastHook({ title: "Character Deleted", description: "Character has been removed from your roster." });
    }
    setDeleteConfirmId(null);
  };

  const handleSaveEquipment = (equipment: Equipment) => {
    const existing = selectedCharacter?.equipment.find(eq => eq.id === equipment.id);
    if (existing) {
      saveEquipment(equipment.id, equipment);
    } else {
      addEquipment(equipment);
    }
  };

  const handleUpdateStarforce = (equipmentId: string, current: number, target: number) => {
    updateEquipmentStarForce(equipmentId, current, target);
  };

  const handleTransferEquipment = (sourceEquipment: Equipment, targetEquipment: Equipment) => {
    toastHook({ title: "Transfer Planned", description: `${sourceEquipment.name} → ${targetEquipment.name}` });
  };

  const sortedChars = [...characters].sort((a, b) => b.level - a.level);
  const remaining = selectedCharacter ? getRemainingGenerations(selectedCharacter) : 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-6 pt-4 pb-10 relative">

      {/* ── Narrow character sidebar ── */}
      <TooltipProvider>
        <div className="fixed top-24 -ml-[4.5rem] w-14 flex flex-col items-center gap-2 py-3 px-2 z-30 bg-card/15 backdrop-blur-[20px] border border-border/20 rounded-2xl shadow-md">
          {sortedChars.map(char => {
            const isSelected = selectedCharacter?.id === char.id;
            const thumbUrl = getCardUrl(char.callingCardHash);
            const colors = getJobColors(char.class ?? '');
            return (
              <Tooltip key={char.id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => selectCharacter(char.id)}
                    className={`relative w-10 h-10 rounded-full overflow-hidden shrink-0 transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-primary shadow-md shadow-primary/30'
                        : 'ring-1 ring-white/10 hover:ring-white/30 opacity-50 hover:opacity-100'
                    }`}
                  >
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={char.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                        <span className="text-[10px] text-white font-bold">{char.name[0]}</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-maplestory">
                  {char.name} · Lv.{char.level} {char.class}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Add character */}
          {characters.length < 6 && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/character/new')}
                  className="w-10 h-10 rounded-full border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-maplestory">New Character</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* ── Main content ── */}
      <div className="flex flex-col gap-4">

        {/* ── No characters at all ── */}
        {characters.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-32">
            <div className="text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Plus className="w-10 h-10 text-white/20" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white/80 font-maplestory">No Characters Yet</h2>
                <p className="text-white/40 font-maplestory">Create your first character to get started</p>
              </div>
              <Button
                onClick={() => navigate('/character/new')}
                className="font-maplestory rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </div>
          </div>
        )}

        {/* ── No character selected ── */}
        {characters.length > 0 && !selectedCharacter && (
          <div className="flex-1 flex items-center justify-center py-32">
            <div className="text-center flex flex-col items-center gap-4">
              <Target className="w-16 h-16 text-white/10" />
              <p className="text-white/40 font-maplestory">Select a character on the left to get started</p>
            </div>
          </div>
        )}

        {selectedCharacter && (
          <EnhancedEquipmentManager
            equipment={selectedCharacter.equipment}
            onEditEquipment={() => {}}
            onAddEquipment={() => {}}
            onClearEquipment={clearEquipmentSlot}
            onUpdateStarforce={handleUpdateStarforce}
            onSaveEquipment={handleSaveEquipment}
            onTransfer={handleTransferEquipment}
            selectedJob={selectedCharacter.class}
            characterId={selectedCharacter.id}
            characterName={selectedCharacter.name}
            characterImage={characterSprite ?? undefined}
            callingCardHash={selectedCharacter.callingCardHash}
            characterLevel={selectedCharacter.level}
            isRegeneratingCard={isRegenerating}
            remainingGenerations={remaining}
            onRegenerateCard={handleRegenerate}
            onEditCharacter={() => { setEditingCharacter(selectedCharacter); setCharacterFormOpen(true); }}
            onDeleteCharacter={() => setDeleteConfirmId(selectedCharacter.id)}
          />
        )}
      </div>

      {/* Character Edit Form */}
      <CharacterForm
        open={characterFormOpen}
        onOpenChange={setCharacterFormOpen}
        onAddCharacter={handleCreateCharacter}
        editingCharacter={editingCharacter}
        onEditingChange={setEditingCharacter}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-maplestory">Delete Character?</DialogTitle>
            <DialogDescription className="font-maplestory space-y-2 pt-1">
              <span className="block">
                {deleteConfirmId && characters.find(c => c.id === deleteConfirmId)?.name} will be permanently deleted.
              </span>
              <span className="block text-yellow-400/90">
                Note: the character slot stays occupied for 1 hour after deletion.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="font-maplestory">Cancel</Button>
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

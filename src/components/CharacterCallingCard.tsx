import { useState, useEffect } from 'react';
import { RefreshCw, Edit, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Character } from '@/types';
import { apiService } from '@/services/api';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DAILY_LIMIT = 3;

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]; // "2026-03-28"
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

interface Props {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function CharacterCallingCard({ character, isSelected, onClick, onEdit, onDelete }: Props) {
  const { updateCharacter } = useCharacterContext();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hovered, setHovered] = useState(false);

  const remaining = getRemainingGenerations(character);
  const cardUrl = getCardUrl(character.callingCardHash);

  // Poll until the backend finishes generating the card
  useEffect(() => {
    if (character.callingCardHash) return;

    const interval = setInterval(async () => {
      try {
        const card = await apiService.getCallingCard(character.id);
        if (card?.hash) {
          updateCharacter(character.id, { callingCardHash: card.hash });
        }
      } catch {
        // 404 = not ready yet, keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, character.callingCardHash]);

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (remaining === 0) return;
    setIsRegenerating(true);
    try {
      const { hash } = await apiService.regenerateCallingCard(character.id);
      const today = getTodayUTC();
      const isSameDay = character.cardGenerationDate?.startsWith(today);
      const newCount = isSameDay ? (character.cardGenerationCount ?? 0) + 1 : 1;
      updateCharacter(character.id, {
        callingCardHash: hash,
        cardGenerationCount: newCount,
        cardGenerationDate: today,
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        const today = getTodayUTC();
        updateCharacter(character.id, { cardGenerationCount: DAILY_LIMIT, cardGenerationDate: today });
        toast.warning("You've used all 3 generations for today. Try again tomorrow.");
      } else if (status === 502) {
        toast.error('Card generation failed, please try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
          : 'ring-1 ring-white/10 hover:ring-white/30'
      }`}
      style={{ aspectRatio: '1376 / 768' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background — calling card or shimmer */}
      {cardUrl && !isRegenerating ? (
        <img
          src={cardUrl}
          alt={character.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Sparkles className="w-5 h-5 text-primary/60 animate-pulse" />
            <p className="text-[10px] text-white/40 font-maplestory">
              {isRegenerating ? 'Regenerating...' : 'Generating card...'}
            </p>
          </div>
          {/* Regenerate button even while stuck generating */}
          {hovered && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 bg-black/50 hover:bg-black/70 rounded-full text-[10px] text-white flex items-center gap-1 disabled:opacity-40"
                onClick={handleRegenerate}
                disabled={isRegenerating || remaining === 0}
                title={remaining === 0 ? 'No generations left today' : `${remaining} left today`}
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                {remaining === 0 ? 'No attempts left' : remaining}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Character info — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-sm font-bold text-white font-maplestory leading-tight truncate">{character.name}</p>
        <p className="text-[10px] text-white/60 font-maplestory truncate">Lv. {character.level} {character.class}</p>
      </div>

      {/* Action buttons — top right, visible on hover */}
      {hovered && (
        <div className="absolute top-2 right-2 flex gap-1">
          {cardUrl && !isRegenerating && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 bg-black/50 hover:bg-black/70 rounded-full text-[10px] text-white flex items-center gap-1 disabled:opacity-40"
              onClick={handleRegenerate}
              disabled={remaining === 0}
              title={remaining === 0 ? 'No generations left today' : `${remaining} left today`}
            >
              <RefreshCw className="w-3 h-3" />
              {remaining === 0 ? 'No attempts left' : remaining}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 rounded-full"
            onClick={onEdit}
            title="Edit character"
          >
            <Edit className="w-3 h-3 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black/50 hover:bg-destructive/70 rounded-full"
            onClick={onDelete}
            title="Delete character"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
}

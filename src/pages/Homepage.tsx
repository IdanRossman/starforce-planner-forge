import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { apiService } from "@/services/api";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { Character } from "@/types";
import { Sparkles, RefreshCw, Users, Plus, ChevronRight, Star, Calculator, BarChart2 } from "lucide-react";

// Maps class name keywords → tailwind gradient classes
function getClassGradient(className: string): string {
  const c = className.toLowerCase();
  if (c.includes('bishop') || c.includes('priest') || c.includes('arch mage') || c.includes('archmage') || c.includes('mage') || c.includes('heal')) return 'from-violet-900/80 to-purple-800/60';
  if (c.includes('bowmaster') || c.includes('marksman') || c.includes('bow') || c.includes('arrow')) return 'from-emerald-900/80 to-green-800/60';
  if (c.includes('night lord') || c.includes('shadower') || c.includes('dual blade') || c.includes('thief')) return 'from-slate-900/80 to-gray-800/60';
  if (c.includes('paladin') || c.includes('dark knight') || c.includes('hero') || c.includes('warrior')) return 'from-red-900/80 to-rose-800/60';
  if (c.includes('buccaneer') || c.includes('corsair') || c.includes('cannoneer') || c.includes('pirate')) return 'from-amber-900/80 to-yellow-800/60';
  if (c.includes('wind archer') || c.includes('dawn warrior') || c.includes('blaze wizard') || c.includes('cygnus')) return 'from-sky-900/80 to-blue-800/60';
  if (c.includes('aran') || c.includes('evan') || c.includes('mercedes') || c.includes('phantom') || c.includes('luminous')) return 'from-indigo-900/80 to-blue-800/60';
  if (c.includes('zero') || c.includes('kinesis') || c.includes('cadena') || c.includes('kain')) return 'from-zinc-900/80 to-neutral-800/60';
  if (c.includes('ren')) return 'from-red-900/80 to-rose-800/60';
  return 'from-primary/30 to-primary/10';
}

// Individual character card — fetches its own sprite
function CharacterCard({ char, onClick }: { char: Character; onClick: () => void }) {
  const [sprite, setSprite] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCharacterFromMapleRanks(char.name).then(data => {
      if (!cancelled && data?.image) setSprite(data.image);
    });
    return () => { cancelled = true; };
  }, [char.name]);

  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1),box-shadow_200ms_ease-out,border-color_150ms_ease-out] hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 active:scale-[0.98] text-left bg-gradient-to-br ${getClassGradient(char.class ?? '')}`}
    >
      {/* Sprite */}
      <div className="relative h-36 flex items-end justify-center overflow-hidden">
        {sprite ? (
          <img
            src={sprite}
            alt={char.name}
            className="h-full object-contain drop-shadow-xl transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-white/20" />
          </div>
        )}
        {/* Fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-2 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-white font-bold text-base font-maplestory leading-tight">{char.name}</span>
          <span className="text-white/45 text-xs font-maplestory">Lv.{char.level} {char.class}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-[transform,color] duration-200" />
      </div>
    </button>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { characters, isLoading: charsLoading, selectCharacter } = useCharacterContext();

  const [partyImage, setPartyImage] = useState<{ hash: string; url: string } | null>(null);
  const [isLoadingPartyImage, setIsLoadingPartyImage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationError, setGenerationError] = useState<'rate_limited' | 'failed' | null>(null);

  const latestHashRef = useRef<string | null>(null);
  const prevLengthRef = useRef<number | null>(null);

  useEffect(() => {
    latestHashRef.current = partyImage?.hash ?? null;
  }, [partyImage]);

  useEffect(() => {
    if (!user) {
      setPartyImage(null);
      setIsLoadingPartyImage(false);
      setIsRegenerating(false);
      setGenerationError(null);
      prevLengthRef.current = null;
      return;
    }
    if (charsLoading) return;

    let cancelled = false;
    setIsLoadingPartyImage(true);

    apiService.getPartyImage(user.id)
      .then(image => {
        if (cancelled) return;
        setPartyImage(image);
        prevLengthRef.current = characters.length;
        if (!image && characters.length > 0) setIsRegenerating(true);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingPartyImage(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, charsLoading]);

  useEffect(() => {
    if (!user || charsLoading || prevLengthRef.current === null) return;
    const current = characters.length;
    if (prevLengthRef.current === current) return;
    prevLengthRef.current = current;
    if (current === 0) { setIsRegenerating(false); return; }
    setIsRegenerating(true);
    setGenerationError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.length, charsLoading, user?.id]);

  useEffect(() => {
    if (!isRegenerating || !user || characters.length === 0) return;
    const intervalId = setInterval(async () => {
      try {
        const image = await apiService.getPartyImage(user.id);
        if (image && image.hash !== latestHashRef.current) {
          setPartyImage(image);
          setIsRegenerating(false);
        }
      } catch {}
    }, 5000);
    const timeoutId = setTimeout(() => {
      setIsRegenerating(false);
      setGenerationError('failed');
    }, 120_000);
    return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegenerating, user?.id, characters.length]);

  const handleRetryGenerate = async () => {
    if (!user) return;
    setGenerationError(null);
    setIsRegenerating(true);
    try {
      const image = await apiService.generatePartyImage(user.id);
      setPartyImage(image);
      setIsRegenerating(false);
    } catch (err) {
      const s = (err as { status?: number }).status;
      setIsRegenerating(false);
      setGenerationError(s === 429 ? 'rate_limited' : 'failed');
    }
  };

  // ── Auth resolving ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Logged-out ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center px-6 overflow-hidden">
        <motion.div
          className="text-center max-w-lg mx-auto w-full flex flex-col items-center gap-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl tracking-tight whitespace-nowrap">
              Maple Forge
            </h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-200 font-light drop-shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.25 }}
            >
              Build your party. Calculate your path.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col items-center gap-5 w-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl transition-[background-color] duration-150 font-maplestory active:scale-[0.97]"
                onClick={() => navigate('/quick-planning')}
              >
                Quick Calculator
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/5 text-base px-6 py-6 font-maplestory"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>

          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Logged-in, no characters ────────────────────────────────────────────
  if (!charsLoading && characters.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="text-center max-w-md mx-auto flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="w-9 h-9 text-white/30" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white font-maplestory">Your party is waiting</h2>
            <p className="text-white/50 font-light">Create your first character to begin your planning journey.</p>
          </div>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-maplestory"
            onClick={() => navigate('/character/new')}
          >
            Add Character
          </Button>
        </div>
      </div>
    );
  }

  // ── Logged-in, characters exist ─────────────────────────────────────────
  const sortedChars = [...characters].sort((a, b) => b.level - a.level);

  return (
    <div className="min-h-screen px-6 pt-28 pb-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Party image banner */}
        <div className="relative">
          {partyImage && !isLoadingPartyImage && (
            <img
              src={partyImage.url}
              alt=""
              aria-hidden="true"
              className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] object-cover blur-3xl opacity-60 rounded-3xl pointer-events-none"
            />
          )}
        <div className="relative w-full rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl aspect-[4/3] sm:aspect-[16/5]">
          {partyImage && !isLoadingPartyImage ? (
            <img src={partyImage.url} alt="Your MapleStory party" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary/60 animate-pulse" />
                <p className="text-sm text-white/40 font-maplestory">Generating your party...</p>
              </div>
            </div>
          )}

          {/* Welcome text overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent flex flex-col justify-end p-4 sm:p-6">
            <p className="text-white/65 text-[10px] sm:text-xs tracking-widest uppercase font-maplestory mb-0.5">
              Welcome back{sortedChars[0]?.name ? `, ${sortedChars[0].name}` : ''}
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-maplestory drop-shadow-lg">Ready to forge?</h1>
          </div>

          {/* Regenerate / updating indicator */}
          {isRegenerating && partyImage && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
              <RefreshCw className="w-3 h-3 text-primary animate-spin" />
              <span className="text-xs text-white/60 font-maplestory">Updating party...</span>
            </div>
          )}
          {!isRegenerating && !isLoadingPartyImage && (
            <button
              className="absolute bottom-3 right-3 flex items-center gap-1.5 text-white/55 hover:text-white/85 bg-black/45 hover:bg-black/60 backdrop-blur-sm border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 text-xs font-maplestory [transition:color_150ms_ease-out,background-color_150ms_ease-out,border-color_150ms_ease-out]"
              onClick={handleRetryGenerate}
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>
        </div>

        {/* Error messages */}
        {generationError === 'rate_limited' && (
          <p className="text-xs text-yellow-400/70 font-maplestory -mt-2">Daily generation limit reached. Your party image will update tomorrow.</p>
        )}
        {generationError === 'failed' && (
          <p className="text-xs text-red-400/70 font-maplestory -mt-2">Party image generation failed. Try regenerating.</p>
        )}


        {/* Character grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs tracking-widest uppercase font-maplestory">Your Characters</p>
            {characters.length < 6 && (
              <button
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-maplestory transition-colors"
                onClick={() => navigate('/character/new')}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Character
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedChars.map((char, index) => (
              <motion.div
                key={char.id}
                className="w-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                <CharacterCard
                  char={char}
                  onClick={() => { selectCharacter(char.id); navigate('/characters'); }}
                />
              </motion.div>
            ))}
            {/* Add character ghost card */}
            {characters.length < 6 && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sortedChars.length * 0.04, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => navigate('/character/new')}
                className="rounded-2xl border border-dashed border-white/15 hover:border-white/30 hover:bg-white/5 [transition:border-color_150ms_ease-out,background-color_150ms_ease-out] flex flex-col items-center justify-center gap-2 h-[196px] text-white/30 hover:text-white/50 active:scale-[0.97]"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-maplestory">New Character</span>
              </motion.button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

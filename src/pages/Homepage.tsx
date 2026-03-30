import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { apiService } from "@/services/api";
import { Sparkles, RefreshCw, Users, Plus } from "lucide-react";

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

  // Keep latestHashRef current for stale-closure-safe polling
  useEffect(() => {
    latestHashRef.current = partyImage?.hash ?? null;
  }, [partyImage]);

  // Effect A — Initial fetch once user + characters are resolved
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
        if (!image && characters.length > 0) {
          setIsRegenerating(true);
        }
      })
      .catch(() => { /* silent fail on transient errors */ })
      .finally(() => { if (!cancelled) setIsLoadingPartyImage(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, charsLoading]);

  // Effect B — Roster change detection (character added or deleted)
  useEffect(() => {
    if (!user || charsLoading || prevLengthRef.current === null) return;
    const current = characters.length;
    if (prevLengthRef.current === current) return;

    prevLengthRef.current = current;
    if (current === 0) { setIsRegenerating(false); return; }

    // Backend auto-regenerates after roster change — start polling for new image
    setIsRegenerating(true);
    setGenerationError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters.length, charsLoading, user?.id]);

  // Effect C — Poll for new party image while regenerating
  useEffect(() => {
    if (!isRegenerating || !user || characters.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const image = await apiService.getPartyImage(user.id);
        if (image && image.hash !== latestHashRef.current) {
          setPartyImage(image);
          setIsRegenerating(false);
        }
      } catch { /* keep polling on transient errors */ }
    }, 5000);

    // Safety valve — surface failure after 2 minutes
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
        <div className="text-center max-w-2xl mx-auto w-full flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl tracking-tight whitespace-nowrap">
              Maple Forge
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light drop-shadow-lg">
              Plan your Maplestory progression.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl transition-all font-maplestory"
              onClick={() => navigate('/quick-planning')}
            >
              Quick Calculator
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5 text-base px-6 py-6 font-maplestory"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
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
            <p className="text-white/50 font-light">
              Create your first character to begin your planning journey.
            </p>
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
  return (
    <div className="h-screen flex items-center justify-center px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">

        {/* Top: Welcome + buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-white/40 text-xs tracking-widest uppercase font-maplestory">Welcome back</p>
            <h1 className="text-4xl font-bold text-white font-maplestory">Ready to forge?</h1>
            <p className="text-white/50 font-light">Pick up where you left off.</p>
          </div>
          <div className="flex flex-row gap-3">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-100 font-maplestory gap-3"
              onClick={() => navigate('/characters')}
            >
              <Users className="w-4 h-4" />
              My Characters
            </Button>
            {characters.length < 6 && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-maplestory gap-3"
                onClick={() => navigate('/character/new')}
              >
                <Plus className="w-4 h-4" />
                Add Character
              </Button>
            )}
          </div>
        </div>

        {/* Bottom: Jump to (left) + Image (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left: Jump to */}
          <div className="flex flex-col gap-2">
            <p className="text-white/30 text-xs tracking-widest uppercase font-maplestory">Jump to</p>
            <div className="flex flex-col gap-1.5">
              {[...characters].sort((a, b) => b.level - a.level).map(char => (
                <button
                  key={char.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 hover:bg-white/8 border border-white/8 hover:border-white/15 transition-colors text-left group"
                  onClick={() => { selectCharacter(char.id); navigate('/characters'); }}
                >
                  <span className="text-sm text-white/70 group-hover:text-white font-maplestory transition-colors">{char.name}</span>
                  <span className="text-xs text-white/25 font-maplestory">Lv.{char.level} {char.class}</span>
                </button>
              ))}
            </div>
            {generationError === 'rate_limited' && (
              <p className="text-xs text-yellow-400/70 font-maplestory mt-2">
                Daily generation limit reached. Your party image will update tomorrow.
              </p>
            )}
            {generationError === 'failed' && (
              <p className="text-xs text-red-400/70 font-maplestory mt-2">
                Party image generation failed. Try regenerating from the image panel.
              </p>
            )}
          </div>

          {/* Right: Party image */}
          <div
            className="relative w-full rounded-2xl overflow-hidden ring-1 ring-primary/20 shadow-lg shadow-primary/10"
          style={{ aspectRatio: '1376 / 768' }}
        >
          {partyImage && !isLoadingPartyImage ? (
            <img
              src={partyImage.url}
              alt="Your MapleStory party"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary/60 animate-pulse" />
                <p className="text-sm text-white/40 font-maplestory">Generating your party...</p>
              </div>
            </div>
          )}

          {isRegenerating && partyImage && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
              <RefreshCw className="w-3 h-3 text-primary animate-spin" />
              <span className="text-xs text-white/60 font-maplestory">Updating party...</span>
            </div>
          )}

          {!isRegenerating && !isLoadingPartyImage && (
            <div className="absolute bottom-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70 hover:bg-black/40 bg-black/30 backdrop-blur-sm font-maplestory"
                onClick={handleRetryGenerate}
                title="Regenerate party image"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          )}
        </div>

        </div>

      </div>
    </div>
  );
}

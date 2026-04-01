import { useState, useEffect } from 'react';
import { SessionItemState } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EquipmentImage } from '@/components/EquipmentImage';
import { parseMesoInput, formatMeso } from '@/lib/utils';
import { Star, Package, Minus, Plus, Flame, ChevronDown } from 'lucide-react';

interface SubmitData {
  equipmentId: number;
  startStar: number;
  targetStar: number;
  endStar: number;
  totalMesoCost: number;
  mesoAfter: number;
  totalBooms: number;
  starCatching: boolean;
  safeguard: boolean;
  thirtyPctMesoReduction: boolean;
  thirtyPctBoomReduction: boolean;
  mvpDiscount: number;
  updateCharacterEquipment: boolean;
  boomStars: number[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SessionItemState;
  currentMesoBalance: number;
  onSubmit: (data: SubmitData) => Promise<void>;
}

export function LogResultDialog({ open, onOpenChange, item, currentMesoBalance, onSubmit }: Props) {
  const [mesoAfterText, setMesoAfterText] = useState('');
  const [endStar, setEndStar] = useState(Math.min(item.targetStar, 30));
  const [booms, setBooms] = useState(0);
  const [boomStars, setBoomStars] = useState<number[]>([]);
  const [showBoomDetails, setShowBoomDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boomDetected = endStar < item.currentStar;

  useEffect(() => {
    if (!open) return;
    setMesoAfterText('');
    setEndStar(Math.min(item.targetStar, 30));
    setBooms(0);
    setBoomStars([]);
    setShowBoomDetails(false);
  }, [open, item.currentStar]);

  // Auto-bump boom count when a drop is detected
  useEffect(() => {
    setBooms(boomDetected ? 1 : 0);
  }, [boomDetected]);

  // Keep boomStars array in sync with boom count, collapse details on any change
  useEffect(() => {
    setBoomStars(prev => {
      const next = Array(booms).fill(0);
      for (let i = 0; i < Math.min(prev.length, booms); i++) next[i] = prev[i];
      return next;
    });
    setShowBoomDetails(false);
  }, [booms]);

  const mesoAfter = parseMesoInput(mesoAfterText);
  const cost = mesoAfterText.trim() ? currentMesoBalance - mesoAfter : null;

  const handleSubmit = async () => {
    if (cost === null || cost < 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        equipmentId: item.equipmentId,
        startStar: item.currentStar,
        targetStar: Math.max(item.currentStar + 1, endStar), // segment target = where this chunk actually ended
        endStar,
        totalMesoCost: cost,
        mesoAfter,
        totalBooms: booms,
        starCatching: item.starCatching,
        safeguard: item.safeguard,
        thirtyPctMesoReduction: item.thirtyPctMesoReduction,
        thirtyPctBoomReduction: item.thirtyPctBoomReduction,
        mvpDiscount: item.mvpDiscount,
        updateCharacterEquipment: true,
        boomStars: boomStars.filter(s => s > 0),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = mesoAfterText.trim() !== '' && cost !== null && cost >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="font-maplestory text-base">Log Result</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Item strip */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-border/30">
            <EquipmentImage src={item.image} alt={item.name} size="sm" fallbackIcon={() => <Package className="w-3.5 h-3.5" />} />
            <div className="min-w-0">
              <p className="text-xs font-semibold font-maplestory text-white/90 truncate">{item.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-white/40 font-maplestory">★{item.currentStar} → ★{item.targetStar}</span>
              </div>
            </div>
          </div>

          {/* Reached star */}
          <div className="space-y-1.5">
            <Label className="font-maplestory text-xs text-white/50">Reached</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEndStar(s => Math.max(0, s - 1))}
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border ${
                boomDetected ? 'bg-red-500/10 border-red-500/40' : 'bg-white/5 border-border/30'
              }`}>
                <Star className={`w-3.5 h-3.5 fill-current shrink-0 ${boomDetected ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className={`font-maplestory text-sm shrink-0 ${boomDetected ? 'text-red-300' : 'text-white'}`}>★</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={endStar}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setEndStar(Math.min(30, Math.max(0, val)));
                  }}
                  className={`w-10 bg-transparent border-none text-center font-bold font-maplestory text-sm focus:outline-none tabular-nums ${boomDetected ? 'text-red-300' : 'text-white'}`}
                />
                {boomDetected && <span className="text-[10px] font-maplestory text-red-400/80">boom</span>}
              </div>
              <button
                onClick={() => setEndStar(s => Math.min(30, s + 1))}
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Meso after */}
          <div className="space-y-1.5">
            <Label className="font-maplestory text-xs text-white/50">Meso balance now</Label>
            <Input
              placeholder="e.g. 47.2B"
              value={mesoAfterText}
              onChange={e => setMesoAfterText(e.target.value)}
              className="font-maplestory text-sm"
              autoFocus
            />
            {cost !== null && (
              <p className={`text-[11px] font-maplestory ${cost < 0 ? 'text-red-400' : 'text-white/40'}`}>
                {cost < 0 ? 'Balance higher than before — check value' : `spent ${formatMeso(cost)}`}
              </p>
            )}
          </div>

          {/* Booms */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <Label className="font-maplestory text-xs text-white/50">Booms</Label>
                {boomDetected && booms === 1 && (
                  <span className="text-[10px] text-orange-400/60 font-maplestory">auto-detected</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBooms(n => Math.max(0, n - 1))}
                  className="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className={`text-sm font-bold font-maplestory w-5 text-center ${booms > 0 ? 'text-orange-400' : 'text-white/30'}`}>
                  {booms}
                </span>
                <button
                  onClick={() => setBooms(n => n + 1)}
                  className="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Optional boom star details */}
            {booms > 0 && (
              <div>
                <button
                  onClick={() => setShowBoomDetails(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 font-maplestory transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showBoomDetails ? 'rotate-180' : ''}`} />
                  {showBoomDetails ? 'hide' : 'add'} boom stars (optional)
                </button>

                {showBoomDetails && (
                  <div className="space-y-1.5 mt-2">
                    {boomStars.map((star, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-border/20">
                        <span className="text-[10px] text-white/30 font-maplestory w-14 shrink-0">Boom {i + 1} at</span>
                        <div className="flex items-center gap-1 flex-1">
                          <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 shrink-0" />
                          <input
                            type="number"
                            min={0}
                            max={30}
                            placeholder="★"
                            value={star || ''}
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              setBoomStars(prev => { const n = [...prev]; n[i] = isNaN(val) ? 0 : Math.min(30, Math.max(0, val)); return n; });
                            }}
                            onBlur={() => setShowBoomDetails(false)}
                            className="w-14 bg-transparent border-none text-center font-bold font-maplestory text-xs text-white focus:outline-none tabular-nums placeholder:text-white/20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-maplestory w-full sm:flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit} className="font-maplestory w-full sm:flex-1">
            {isSubmitting ? 'Saving…' : 'Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

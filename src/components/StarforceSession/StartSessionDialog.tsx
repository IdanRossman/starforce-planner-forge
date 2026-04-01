import { useState } from 'react';
import { Equipment, StorageItem, SessionQueueItem } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { parseMesoInput, formatMeso } from '@/lib/utils';
import { Star, X, Plus, Package, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const MVP_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '3%', value: 3 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
];

export type SessionEvents = {
  starCatching: boolean;
  thirtyPctMesoReduction: boolean;
  thirtyPctBoomReduction: boolean;
  mvpDiscount: number;
};

export function itemToQueue(
  item: { catalogId?: string; name?: string; image?: string; level: number; currentStarForce: number; targetStarForce: number; safeguard?: boolean },
  events: SessionEvents
): SessionQueueItem | null {
  const equipmentId = parseInt(item.catalogId ?? '');
  if (!equipmentId || isNaN(equipmentId)) return null;
  return {
    equipmentId,
    name: item.name ?? 'Unknown Item',
    image: item.image,
    level: item.level,
    startStar: item.currentStarForce,
    targetStar: item.targetStarForce,
    starCatching: events.starCatching,
    safeguard: item.safeguard ?? false,
    thirtyPctMesoReduction: events.thirtyPctMesoReduction,
    thirtyPctBoomReduction: events.thirtyPctBoomReduction,
    mvpDiscount: events.mvpDiscount,
  };
}

function storageToEquipmentLike(item: StorageItem) {
  return {
    catalogId: item.catalogId,
    name: item.name,
    image: item.image,
    level: item.level,
    currentStarForce: item.currentStarForce,
    targetStarForce: item.targetStarForce,
    safeguard: false,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Controlled queue (owned by parent)
  queue: SessionQueueItem[];
  onAddToQueue: (item: SessionQueueItem) => void;
  onRemoveFromQueue: (equipmentId: number) => void;
  onUpdateQueueItem: (equipmentId: number, update: Partial<Pick<SessionQueueItem, 'safeguard'>>) => void;
  // Controlled events (owned by parent)
  events: SessionEvents;
  onEventsChange: (events: SessionEvents) => void;
  // Callbacks
  onStart: (name: string | undefined, startingMeso: number) => Promise<unknown>;
  onRequestAddItem: () => void;
  // Mode
  mode?: 'start' | 'add';
}

export function StartSessionDialog({
  open, onOpenChange,
  queue, onAddToQueue, onRemoveFromQueue, onUpdateQueueItem,
  events, onEventsChange,
  onStart, onRequestAddItem,
  mode = 'start',
}: Props) {
  const { selectedCharacter } = useCharacterContext();
  const defaultName = () => {
    const d = new Date();
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} SF Session`;
  };
  const [sessionName, setSessionName] = useState(defaultName);
  const [startingMesoText, setStartingMesoText] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const equippedItems = (selectedCharacter?.equipment ?? []).filter(e => e.starforceable && e.catalogId);
  const storageItems = (selectedCharacter?.storageItems ?? []).filter(e => e.starforceable && e.catalogId);

  const isQueued = (catalogId: string) => queue.some(q => q.equipmentId === parseInt(catalogId));

  const toggleEquipped = (item: Equipment) => {
    const id = parseInt(item.catalogId ?? '');
    if (isNaN(id)) return;
    if (isQueued(item.catalogId!)) {
      onRemoveFromQueue(id);
    } else {
      const qi = itemToQueue(item, events);
      if (qi) onAddToQueue(qi);
    }
  };

  const toggleStorage = (item: StorageItem) => {
    const id = parseInt(item.catalogId ?? '');
    if (isNaN(id)) return;
    if (isQueued(item.catalogId!)) {
      onRemoveFromQueue(id);
    } else {
      const qi = itemToQueue(storageToEquipmentLike(item), events);
      if (qi) onAddToQueue(qi);
    }
  };

  const handleStart = async () => {
    if (queue.length === 0) {
      toast.error('Add at least one item to the session.');
      return;
    }
    setIsStarting(true);
    try {
      const startingMeso = mode === 'add' ? 0 : parseMesoInput(startingMesoText);
      await onStart(sessionName.trim() || undefined, startingMeso);
      if (mode === 'start') {
        toast.success('Session started!');
        setSessionName('');
        setStartingMesoText('');
      }
      onOpenChange(false);
    } catch {
      toast.error(mode === 'add' ? 'Failed to add items.' : 'Failed to start session.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val && mode === 'start') {
      const d = new Date();
      setSessionName(`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} SF Session`);
      setStartingMesoText('');
    }
    onOpenChange(val);
  };

  const ctaLabel = mode === 'add'
    ? (isStarting ? 'Adding…' : `Add to Session (${queue.length} items)`)
    : (isStarting ? 'Starting...' : `Start Session (${queue.length} items)`);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="font-maplestory">
            {mode === 'add' ? 'Add Items to Session' : 'Start Starforce Session'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Name + Meso row — only in start mode */}
          {mode === 'start' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-maplestory text-xs text-white/60">Session Name (optional)</Label>
                <Input
                  placeholder="My 22★ grind"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="font-maplestory text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-maplestory text-xs text-white/60">Starting Meso Balance</Label>
                <Input
                  placeholder="e.g. 50B"
                  value={startingMesoText}
                  onChange={e => setStartingMesoText(e.target.value)}
                  className="font-maplestory text-sm"
                />
                {startingMesoText && (
                  <p className="text-[10px] text-white/40 font-maplestory">
                    = {formatMeso(parseMesoInput(startingMesoText))} mesos
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Event settings — only in start mode */}
          {mode === 'start' && (
            <div className="rounded-lg border border-border/50 bg-white/3 p-3 space-y-2">
              <p className="text-xs font-semibold text-white/50 font-maplestory uppercase tracking-wider">Active Events</p>
              <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:space-y-0">
                <div className="flex items-center justify-between">
                  <Label className="font-maplestory text-xs">Star Catching</Label>
                  <Switch checked={events.starCatching} onCheckedChange={v => onEventsChange({ ...events, starCatching: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-maplestory text-xs">30% Meso Off</Label>
                  <Switch checked={events.thirtyPctMesoReduction} onCheckedChange={v => onEventsChange({ ...events, thirtyPctMesoReduction: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-maplestory text-xs">30% Boom Reduction</Label>
                  <Switch checked={events.thirtyPctBoomReduction} onCheckedChange={v => onEventsChange({ ...events, thirtyPctBoomReduction: v })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-maplestory text-xs shrink-0">MVP Discount</Label>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {MVP_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onEventsChange({ ...events, mvpDiscount: opt.value })}
                        className={`text-[10px] px-2 py-1 rounded font-maplestory transition-colors ${
                          events.mvpDiscount === opt.value
                            ? 'bg-primary text-white'
                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/50 font-maplestory uppercase tracking-wider">Select Items to Tap</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestAddItem}
                className="h-7 text-xs font-maplestory rounded-full gap-1"
              >
                <Plus className="w-3 h-3" /> Add New Item
              </Button>
            </div>

            <Tabs defaultValue="equipped">
              <TabsList className="h-8 bg-white/5 border border-border/40 p-0.5 gap-0.5 rounded-lg">
                <TabsTrigger value="equipped" className="h-7 text-xs font-maplestory rounded-md px-3">
                  Equipped <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 font-maplestory">{equippedItems.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="storage" className="h-7 text-xs font-maplestory rounded-md px-3">
                  Storage <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 font-maplestory">{storageItems.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="equipped" className="mt-2">
                {equippedItems.length === 0 ? (
                  <p className="text-xs text-white/30 font-maplestory py-4 text-center">No starforceable equipped items</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {equippedItems.map(item => {
                      const selected = isQueued(item.catalogId!);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleEquipped(item)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                            selected ? 'border-primary/60 bg-primary/10' : 'border-border/30 bg-white/3 hover:bg-white/8'
                          }`}
                        >
                          <EquipmentImage src={item.image} alt={item.name ?? ''} size="sm" fallbackIcon={() => <Package className="w-3 h-3" />} />
                          <div className="min-w-0">
                            <p className="text-xs font-maplestory truncate text-white/80">{item.name ?? 'Unknown'}</p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-[10px] text-white/50 font-maplestory">{item.currentStarForce}→{item.targetStarForce}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="storage" className="mt-2">
                {storageItems.length === 0 ? (
                  <p className="text-xs text-white/30 font-maplestory py-4 text-center">No starforceable storage items</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {storageItems.map(item => {
                      const selected = isQueued(item.catalogId!);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleStorage(item)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                            selected ? 'border-primary/60 bg-primary/10' : 'border-border/30 bg-white/3 hover:bg-white/8'
                          }`}
                        >
                          <EquipmentImage src={item.image} alt={item.name ?? ''} size="sm" fallbackIcon={() => <Package className="w-3 h-3" />} />
                          <div className="min-w-0">
                            <p className="text-xs font-maplestory truncate text-white/80">{item.name ?? 'Unknown'}</p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-[10px] text-white/50 font-maplestory">{item.currentStarForce}→{item.targetStarForce}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-white/50 font-maplestory uppercase tracking-wider">
                Queue ({queue.length})
              </p>
              <div className="space-y-1">
                {queue.map(item => (
                  <div key={item.equipmentId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-border/30">
                    <EquipmentImage src={item.image} alt={item.name} size="sm" fallbackIcon={() => <Package className="w-3 h-3" />} />
                    <span className="text-xs font-maplestory flex-1 truncate text-white/80">{item.name}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-white/50 font-maplestory">{item.startStar}→{item.targetStar}</span>
                    </div>
                    <button
                      onClick={() => onUpdateQueueItem(item.equipmentId, { safeguard: !item.safeguard })}
                      title={item.safeguard ? 'Safeguard on' : 'Safeguard off'}
                      className={`w-5 h-5 flex items-center justify-center transition-colors ${
                        item.safeguard ? 'text-blue-400' : 'text-white/20 hover:text-white/50'
                      }`}
                    >
                      {item.safeguard
                        ? <ShieldCheck className="w-3.5 h-3.5" />
                        : <Shield className="w-3.5 h-3.5" />
                      }
                    </button>
                    <button
                      onClick={() => onRemoveFromQueue(item.equipmentId)}
                      className="w-4 h-4 flex items-center justify-center text-white/30 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} className="font-maplestory w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleStart} disabled={isStarting || queue.length === 0} className="font-maplestory w-full sm:w-auto">
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

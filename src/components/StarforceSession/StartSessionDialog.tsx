import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Equipment, StorageItem, SessionQueueItem } from '@/types';
import { EquipmentImage } from '@/components/EquipmentImage';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { parseMesoInput, formatMeso } from '@/lib/utils';
import { X, Plus, Package, Shield, ShieldCheck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'equipped' | 'storage'>('equipped');

  const equippedItems = (selectedCharacter?.equipment ?? []).filter(e => e.starforceable && e.catalogId);
  const storageItems = (selectedCharacter?.storageItems ?? []).filter(e => e.starforceable && e.catalogId);

  const isQueued = (catalogId: string) => queue.some(q => q.equipmentId === parseInt(catalogId));

  const allEquippedSelected = equippedItems.length > 0 && equippedItems.every(i => isQueued(i.catalogId!));
  const allStorageSelected = storageItems.length > 0 && storageItems.every(i => isQueued(i.catalogId!));

  const handleSelectAll = () => {
    if (activeTab === 'equipped') {
      if (allEquippedSelected) {
        equippedItems.forEach(i => onRemoveFromQueue(parseInt(i.catalogId!)));
      } else {
        equippedItems.forEach(i => {
          if (!isQueued(i.catalogId!)) {
            const qi = itemToQueue(i, events);
            if (qi) onAddToQueue(qi);
          }
        });
      }
    } else {
      if (allStorageSelected) {
        storageItems.forEach(i => onRemoveFromQueue(parseInt(i.catalogId!)));
      } else {
        storageItems.forEach(i => {
          if (!isQueued(i.catalogId!)) {
            const qi = itemToQueue(storageToEquipmentLike(i), events);
            if (qi) onAddToQueue(qi);
          }
        });
      }
    }
  };

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

  if (!open) return null;

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm font-maplestory text-white placeholder:text-white/25 outline-none border border-white/10 focus:border-primary/40 transition-colors";

  const EventPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-maplestory border transition-all ${
        active
          ? 'bg-primary/20 border-primary/40 text-primary'
          : 'bg-white/[0.05] border-white/15 text-white/55 hover:text-white/80 hover:border-white/30'
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => handleClose(false)}>
      <div
        className="bg-[hsl(217_33%_9%)] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
          <p className="text-sm font-bold text-white font-maplestory">
            {mode === 'add' ? 'Add Items to Session' : 'Start Starforce Session'}
          </p>
          <button onClick={() => handleClose(false)} className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/80 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* ── 1. Item picker (primary action — first) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-maplestory">Select Items</p>
              <button onClick={onRequestAddItem} className="flex items-center gap-1 text-[10px] font-maplestory text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded-lg px-2 py-1 bg-white/5 hover:bg-white/10">
                <Plus className="w-3 h-3" /> Add New Item
              </button>
            </div>

            {/* Tabs + Select All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
                {(['equipped', 'storage'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-maplestory transition-all capitalize flex items-center gap-1.5 ${
                      activeTab === tab ? 'bg-white/10 text-white/90' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {tab}
                    <span className={`text-[9px] rounded px-1 ${activeTab === tab ? 'bg-white/15 text-white/70' : 'bg-white/5 text-white/25'}`}>
                      {tab === 'equipped' ? equippedItems.length : storageItems.length}
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={handleSelectAll} className="text-xs font-maplestory text-white/40 hover:text-white/70 transition-colors">
                {(activeTab === 'equipped' ? allEquippedSelected : allStorageSelected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Item grid with scroll fade */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {(activeTab === 'equipped' ? equippedItems : storageItems).length === 0 ? (
                  <p className="col-span-2 text-xs text-white/25 font-maplestory py-8 text-center">
                    No starforceable {activeTab} items
                  </p>
                ) : (activeTab === 'equipped' ? equippedItems : storageItems).map(item => {
                  const selected = isQueued(item.catalogId!);
                  const toggle = activeTab === 'equipped' ? () => toggleEquipped(item as Equipment) : () => toggleStorage(item as StorageItem);
                  return (
                    <button
                      key={item.catalogId}
                      onClick={toggle}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        selected ? 'border-primary/50 bg-primary/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/8'
                      }`}
                    >
                      <EquipmentImage src={item.image} alt={item.name ?? ''} size="sm" fallbackIcon={() => <Package className="w-3 h-3" />} />
                      <div className="min-w-0">
                        <p className="text-xs font-maplestory truncate text-white/80">{item.name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-white/35 font-maplestory mt-0.5">☆{item.currentStarForce} → ★{item.targetStarForce}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Scroll fade indicator */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[hsl(217_33%_9%)] to-transparent rounded-b-lg" />
            </div>
          </div>

          {/* ── 2. Queue (appears right below grid as items are selected) ── */}
          {queue.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-maplestory">Queue · {queue.length} {queue.length === 1 ? 'item' : 'items'}</p>
              <div className="space-y-1">
                {queue.map(item => (
                  <div key={item.equipmentId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8">
                    <EquipmentImage src={item.image} alt={item.name} size="sm" fallbackIcon={() => <Package className="w-3 h-3" />} />
                    <span className="text-xs font-maplestory flex-1 truncate text-white/80">{item.name}</span>
                    <span className="text-[10px] text-white/35 font-maplestory shrink-0">☆{item.startStar}→★{item.targetStar}</span>
                    <button
                      onClick={() => onUpdateQueueItem(item.equipmentId, { safeguard: !item.safeguard })}
                      title={item.safeguard ? 'Safeguard: ON — boom protection active' : 'Safeguard: OFF — click to enable'}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-maplestory border transition-all shrink-0 ${
                        item.safeguard
                          ? 'bg-blue-500/15 border-blue-400/30 text-blue-400'
                          : 'bg-white/5 border-white/10 text-white/25 hover:text-white/50 hover:border-white/25'
                      }`}
                    >
                      {item.safeguard ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      <span>{item.safeguard ? 'Guard' : 'Guard'}</span>
                    </button>
                    <button onClick={() => onRemoveFromQueue(item.equipmentId)} className="w-4 h-4 flex items-center justify-center text-white/25 hover:text-red-400 transition-colors shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. Events (secondary config) ── */}
          {mode === 'start' && (
            <div className="space-y-2.5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-maplestory">Active Events</p>
              {/* Event toggles */}
              <div className="flex flex-wrap gap-2">
                <EventPill label="Star Catching" active={events.starCatching} onClick={() => onEventsChange({ ...events, starCatching: !events.starCatching })} />
                <EventPill label="30% Meso Off" active={events.thirtyPctMesoReduction} onClick={() => onEventsChange({ ...events, thirtyPctMesoReduction: !events.thirtyPctMesoReduction })} />
                <EventPill label="30% Boom Reduction" active={events.thirtyPctBoomReduction} onClick={() => onEventsChange({ ...events, thirtyPctBoomReduction: !events.thirtyPctBoomReduction })} />
              </div>
              {/* MVP Discount — own row */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-white/30 font-maplestory uppercase tracking-widest shrink-0">MVP Discount</span>
                <div className="flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/10">
                  {MVP_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onEventsChange({ ...events, mvpDiscount: opt.value })}
                      className={`text-[10px] px-3 py-1 rounded-full font-maplestory transition-colors ${
                        events.mvpDiscount === opt.value
                          ? 'bg-primary/25 text-primary border border-primary/40'
                          : 'text-white/40 hover:text-white/70 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. Session details (metadata — last) ── */}
          {mode === 'start' && (
            <div className="space-y-2">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-maplestory">Session Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/25 font-maplestory">Name <span className="text-white/15">(optional)</span></p>
                  <input
                    placeholder="My 22★ grind"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    className={inputClass}
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/25 font-maplestory">Starting Balance</p>
                  <input
                    placeholder="e.g. 50B"
                    value={startingMesoText}
                    onChange={e => setStartingMesoText(e.target.value)}
                    className={inputClass}
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                  {startingMesoText
                    ? <p className="text-[10px] text-primary/70 font-maplestory">= {formatMeso(parseMesoInput(startingMesoText))} mesos</p>
                    : <p className="text-[10px] text-white/20 font-maplestory">Tracks spend per milestone</p>
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/8 shrink-0">
          <button onClick={() => handleClose(false)} className="flex-1 py-2 rounded-lg border border-white/15 bg-white/5 text-sm font-maplestory text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isStarting || queue.length === 0}
            className="flex-[2] py-2.5 rounded-lg bg-primary/90 hover:bg-primary text-sm font-maplestory text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStarting
              ? (mode === 'add' ? 'Adding…' : 'Starting…')
              : queue.length === 0
                ? 'Select items to start'
                : mode === 'add'
                  ? `Add to Session · ${queue.length} ${queue.length === 1 ? 'item' : 'items'}`
                  : `Start Session · ${queue.length} ${queue.length === 1 ? 'item' : 'items'}`
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

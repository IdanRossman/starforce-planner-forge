import { useState, useEffect, useMemo } from 'react';
import { StarforceSession, StarforceSessionLog, SessionItemState, SessionQueueItem, LuckAnalysis } from '@/types';
import { useStarforceSession } from '@/hooks/starforce/useStarforceSession';
import { sessionApiService as apiService } from '@/services/api';
import { StartSessionDialog, SessionEvents, itemToQueue } from './StartSessionDialog';
import { LogResultDialog } from './LogResultDialog';
import { EquipmentForm, StorageSaveData } from '@/components/EquipmentForm';
import { EquipmentImage } from '@/components/EquipmentImage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reorder, motion } from 'framer-motion';
import { formatMeso } from '@/lib/utils';
import {
  Star, Plus, CheckCircle2, Clock, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Minus, Package, Loader2,
  ChevronLeft, GripHorizontal, Flame, Trash2,
} from 'lucide-react';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { toast } from 'sonner';

interface Props {
  characterId?: string;
  selectedJob?: string;
}

// ── Past sessions ─────────────────────────────────────────────────────────────

function luckLabel(actual: number, sim: { median: number; percentile75: number }) {
  if (actual <= sim.median) return 'lucky' as const;
  if (actual > sim.percentile75) return 'unlucky' as const;
  return 'average' as const;
}

function LuckPill({ rating }: { rating: 'lucky' | 'average' | 'unlucky' }) {
  const base = 'inline-flex items-center gap-0.5 text-[10px] font-maplestory px-1.5 py-0.5 rounded-full';
  if (rating === 'lucky')
    return <span className={`${base} bg-green-500/15 text-green-400`}><TrendingDown className="w-2.5 h-2.5" />Lucky</span>;
  if (rating === 'unlucky')
    return <span className={`${base} bg-red-500/15 text-red-400`}><TrendingUp className="w-2.5 h-2.5" />Unlucky</span>;
  return <span className={`${base} bg-white/8 text-white/35`}><Minus className="w-2.5 h-2.5" />Avg</span>;
}

// Desktop grid: [img 20px] [name 1fr] [stars auto] [spent 56px] [avg 52px] [median 52px] [boom 28px] [luck 60px]
const LOG_GRID = 'grid-cols-[20px_1fr_auto_56px_52px_52px_28px_60px]';

function SessionLogRow({ log, luck, image }: { log: StarforceSessionLog; luck?: LuckAnalysis; image?: string }) {
  const isBoom = log.endStar < log.startStar;
  const mesoRating = luck ? luckLabel(luck.actual.mesoCost, { median: luck.simulated.median.mesoCost, percentile75: luck.simulated.percentile75.mesoCost }) : null;

  const starPill = (
    <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-maplestory whitespace-nowrap ${isBoom ? 'bg-red-500/15 text-red-400' : 'bg-yellow-400/8 text-yellow-300'}`}>
      <Star className="w-2 h-2 fill-current shrink-0" />
      <span>★{log.startStar}→★{log.endStar}</span>
    </div>
  );

  const boomBadge = log.totalBooms > 0 && (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-maplestory text-orange-400">
      <Flame className="w-3 h-3" />{log.totalBooms}
    </span>
  );

  return (
    <>
      {/* ── Mobile layout (hidden on md+) ── */}
      <div className="md:hidden flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors">
        <EquipmentImage src={image} alt={log.equipmentName ?? ''} size="sm" fallbackIcon={() => <Package className="w-3.5 h-3.5" />} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-maplestory text-white/75 truncate">{log.equipmentName ?? `#${log.equipmentId}`}</p>
            {starPill}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold font-maplestory text-white/85 tabular-nums">{formatMeso(log.totalMesoCost)}</span>
            {luck ? (
              <>
                <span className="text-[10px] text-white/30 font-maplestory tabular-nums">avg {formatMeso(luck.simulated.average.mesoCost)}</span>
                <span className="text-[10px] text-white/30 font-maplestory tabular-nums">med {formatMeso(luck.simulated.median.mesoCost)}</span>
              </>
            ) : (
              <div className="h-2.5 w-28 rounded bg-white/5 animate-pulse" />
            )}
            {boomBadge}
            {mesoRating ? <LuckPill rating={mesoRating} /> : luck === undefined && <div className="h-4 w-12 rounded-full bg-white/5 animate-pulse" />}
          </div>
        </div>
      </div>

      {/* ── Desktop layout (hidden below md) ── */}
      <div className={`hidden md:grid ${LOG_GRID} items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors`}>
        <EquipmentImage src={image} alt={log.equipmentName ?? ''} size="sm" fallbackIcon={() => <Package className="w-3.5 h-3.5" />} />
        <p className="text-xs font-maplestory text-white/70 truncate">{log.equipmentName ?? `#${log.equipmentId}`}</p>
        {starPill}
        <span className="text-xs font-bold font-maplestory text-white/85 text-right tabular-nums">{formatMeso(log.totalMesoCost)}</span>
        {luck
          ? <span className="text-[10px] font-maplestory text-white/40 text-right tabular-nums">{formatMeso(luck.simulated.average.mesoCost)}</span>
          : <div className="h-2.5 rounded bg-white/5 animate-pulse" />}
        {luck
          ? <span className="text-[10px] font-maplestory text-white/40 text-right tabular-nums">{formatMeso(luck.simulated.median.mesoCost)}</span>
          : <div className="h-2.5 rounded bg-white/5 animate-pulse" />}
        <div className="flex justify-center">{boomBadge}</div>
        <div className="flex justify-end">
          {mesoRating ? <LuckPill rating={mesoRating} /> : <div className="h-4 w-14 rounded-full bg-white/5 animate-pulse" />}
        </div>
      </div>
    </>
  );
}

function PastSessionCard({ session, imageMap, onDelete }: { session: StarforceSession; imageMap: Record<number, string | undefined>; onDelete: (id: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [luckMap, setLuckMap] = useState<Record<string, LuckAnalysis>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const totalMeso = session.logs.reduce((sum, l) => sum + l.totalMesoCost, 0);
  const totalBooms = session.logs.reduce((sum, l) => sum + l.totalBooms, 0);
  const uniqueItems = [...new Set(session.logs.map(l => l.equipmentName ?? `#${l.equipmentId}`))];
  const MAX_VISIBLE = 3;
  const visibleItems = uniqueItems.slice(0, MAX_VISIBLE);
  const extraCount = uniqueItems.length - MAX_VISIBLE;
  const itemsLabel = visibleItems.join(' · ') + (extraCount > 0 ? ` · +${extraCount} more` : '');
  const date = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (!expanded) return;
    session.logs.forEach(async (log) => {
      if (luckMap[log.id]) return;
      try {
        const data = await apiService.getLuckAnalysis(log.id);
        setLuckMap(prev => ({ ...prev, [log.id]: data }));
      } catch { /* non-critical */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const allLuckLoaded = session.logs.length > 0 && session.logs.every(l => luckMap[l.id]);

  const sessionSummary = (() => {
    if (!allLuckLoaded || session.logs.length === 0) return null;
    const totalActual = session.logs.reduce((sum, l) => sum + l.totalMesoCost, 0);
    const totalMedian = session.logs.reduce((sum, l) => sum + (luckMap[l.id]?.simulated.median.mesoCost ?? 0), 0);
    const totalP75 = session.logs.reduce((sum, l) => sum + (luckMap[l.id]?.simulated.percentile75.mesoCost ?? 0), 0);
    const totalAvg = session.logs.reduce((sum, l) => sum + (luckMap[l.id]?.simulated.average.mesoCost ?? 0), 0);
    const rating: 'lucky' | 'average' | 'unlucky' = totalActual <= totalMedian ? 'lucky' : totalActual > totalP75 ? 'unlucky' : 'average';
    return { totalActual, totalAvg, totalMedian, rating };
  })();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Session header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left hover:bg-white/5 transition-colors px-4 py-3.5"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-semibold font-maplestory text-white/80 truncate">{session.name || 'Untitled Session'}</p>
              <span className="text-[10px] text-white/25 font-maplestory shrink-0 hidden sm:inline">{date}</span>
            </div>
            {uniqueItems.length > 0 && (
              <p className="text-[10px] text-white/30 font-maplestory truncate mt-0.5">{itemsLabel}</p>
            )}
            {session.startingMeso != null && session.endingMeso != null && (
              <p className="text-[10px] text-white/20 font-maplestory mt-0.5">
                {formatMeso(session.startingMeso)} → {formatMeso(session.endingMeso)}
              </p>
            )}
            <span className="text-[10px] text-white/20 font-maplestory sm:hidden">{date}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalMeso > 0 && <span className="text-xs font-bold font-maplestory text-white/55 tabular-nums">{formatMeso(totalMeso)}</span>}
            {totalBooms > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-maplestory text-orange-400">
                <Flame className="w-3 h-3" />{totalBooms}
              </span>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-6 h-6 flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors disabled:opacity-40"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
            <ChevronDown className={`w-3.5 h-3.5 text-white/25 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 bg-black/20">
          {session.logs.length === 0 ? (
            <p className="text-xs text-white/25 font-maplestory px-4 py-3">No logs in this session.</p>
          ) : (
            <>
              {/* Desktop column headers only */}
              <div className={`hidden md:grid ${LOG_GRID} items-center gap-2 px-3 py-1.5 border-b border-border/20`}>
                <div />
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider">Item</span>
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider">Stars</span>
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider text-right">Spent</span>
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider text-right">Avg</span>
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider text-right">Median</span>
                <div className="flex justify-center"><Flame className="w-3 h-3 text-white/20" /></div>
                <span className="text-[9px] font-maplestory text-white/20 uppercase tracking-wider text-right">Luck</span>
              </div>
              {session.logs.map(log => (
                <SessionLogRow key={log.id} log={log} luck={luckMap[log.id]} image={imageMap[log.equipmentId]} />
              ))}
              {/* Session summary footer */}
              {allLuckLoaded && sessionSummary && (
                <div className="border-t border-border/20 px-3 py-2.5 flex items-center justify-between gap-3 bg-white/2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-maplestory text-white/40">Session total</span>
                    <span className="text-xs font-bold font-maplestory text-white/70 tabular-nums">{formatMeso(sessionSummary.totalActual)}</span>
                    <span className="text-[10px] font-maplestory text-white/25 tabular-nums">avg expected {formatMeso(sessionSummary.totalAvg)}</span>
                  </div>
                  <LuckPill rating={sessionSummary.rating} />
                </div>
              )}
              {expanded && !allLuckLoaded && session.logs.length > 0 && (
                <div className="border-t border-border/20 px-3 py-2 flex items-center gap-2">
                  <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                  <div className="h-4 w-16 rounded-full bg-white/5 animate-pulse" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Active session item card ───────────────────────────────────────────────────

function ItemCard({
  item,
  isActive,
  onSelect,
  onMoveLeft,
  onMoveRight,
  showLeft,
  showRight,
}: {
  item: SessionItemState;
  isActive: boolean;
  onSelect: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  showLeft: boolean;
  showRight: boolean;
}) {
  const starsRemaining = item.targetStar - item.currentStar;
  const totalRange = item.targetStar - item.startStar;
  const progress = totalRange > 0 ? Math.max(0, Math.min(1, (item.currentStar - item.startStar) / totalRange)) : 1;

  return (
    <motion.div
      layout
      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200 w-[96px] shrink-0 ${
        item.completed
          ? 'border-green-500/30 bg-green-500/5 opacity-60'
          : isActive
            ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/20'
            : 'border-border/30 bg-white/3 hover:bg-white/8 hover:border-white/20'
      }`}
      onClick={onSelect}
      whileHover={!item.completed ? { scale: 1.03 } : {}}
      whileTap={!item.completed ? { scale: 0.97 } : {}}
    >
      {/* Drag hint */}
      <GripHorizontal className="w-3 h-3 text-white/15 absolute top-1.5 left-1/2 -translate-x-1/2" />

      {/* Completed overlay */}
      {item.completed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-500/10 z-10">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
      )}

      {/* Active indicator */}
      {isActive && !item.completed && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary" />
      )}

      <EquipmentImage
        src={item.image}
        alt={item.name}
        size="md"
        fallbackIcon={() => <Package className="w-5 h-5" />}
        className="mt-2"
      />

      <p className="text-[10px] font-maplestory text-white/70 text-center leading-tight line-clamp-2 w-full">{item.name}</p>

      {/* Star progress */}
      <div className="flex items-center gap-0.5">
        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 shrink-0" />
        <span className={`text-[11px] font-bold font-maplestory ${isActive ? 'text-primary' : 'text-white/80'}`}>
          {item.currentStar}
        </span>
        <span className="text-[10px] text-white/30 font-maplestory">/ {item.targetStar}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${item.completed ? 'bg-green-400' : 'bg-primary'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {!item.completed && (
        <span className="text-[9px] text-white/30 font-maplestory">{starsRemaining} star{starsRemaining !== 1 ? 's' : ''} left</span>
      )}

      {/* Arrow buttons (hover only) */}
      {!item.completed && (
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {showLeft && (
            <button
              onClick={e => { e.stopPropagation(); onMoveLeft(); }}
              className="w-5 h-5 rounded-full bg-card/80 border border-border/50 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-white/60" />
            </button>
          )}
          {showRight && (
            <button
              onClick={e => { e.stopPropagation(); onMoveRight(); }}
              className="w-5 h-5 rounded-full bg-card/80 border border-border/50 flex items-center justify-center hover:bg-white/20 transition-colors ml-auto"
            >
              <ChevronRight className="w-3 h-3 text-white/60" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Active session log list ───────────────────────────────────────────────────

function ActiveSessionLogs({ logs, imageMap, onDeleteLog }: {
  logs: StarforceSessionLog[];
  imageMap: Record<number, string | undefined>;
  onDeleteLog: (logId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (logId: string) => {
    setDeletingId(logId);
    try {
      await onDeleteLog(logId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-maplestory text-white/60">This session</span>
          <span className="text-[10px] font-maplestory text-white/30 bg-white/8 px-1.5 py-0.5 rounded-full">
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/25 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border/20 divide-y divide-border/10">
          {[...logs].reverse().map(log => {
            const isBoom = log.endStar < log.startStar;
            return (
              <div key={log.id} className="flex items-center gap-2.5 px-3 py-2.5">
                <EquipmentImage
                  src={imageMap[log.equipmentId]}
                  alt={log.equipmentName ?? ''}
                  size="sm"
                  fallbackIcon={() => <Package className="w-3.5 h-3.5" />}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-maplestory text-white/75 truncate">{log.equipmentName ?? `#${log.equipmentId}`}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-maplestory px-1.5 py-0.5 rounded-full ${isBoom ? 'bg-red-500/15 text-red-400' : 'bg-yellow-400/8 text-yellow-300'}`}>
                      <Star className="w-2 h-2 fill-current" />★{log.startStar}→★{log.endStar}
                    </span>
                    <span className="text-[10px] font-bold font-maplestory text-white/70 tabular-nums">{formatMeso(log.totalMesoCost)}</span>
                    {log.totalBooms > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-maplestory text-orange-400">
                        <Flame className="w-2.5 h-2.5" />{log.totalBooms}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 disabled:opacity-40"
                >
                  {deletingId === log.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function StarforceSessionTab({ characterId, selectedJob }: Props) {
  const {
    sessions, isLoading, activeSession,
    loadSessions, startSession, ensureSession,
    updateItemStar, updateMesoBalance,
    setActiveItem, reorderItems, advanceActiveItem,
    addItemsToSession, addLog, deleteLog,
    endSession, deleteSession,
  } = useStarforceSession(characterId);

  const { addStorageItem, selectedCharacter } = useCharacterContext();

  // Build catalogId → image lookup from current character data so log rows can show item images
  const imageMap = useMemo<Record<number, string | undefined>>(() => {
    const map: Record<number, string | undefined> = {};
    for (const e of selectedCharacter?.equipment ?? []) {
      if (e.catalogId) map[parseInt(e.catalogId)] = e.image;
    }
    for (const s of selectedCharacter?.storageItems ?? []) {
      if (s.catalogId) map[parseInt(s.catalogId)] = s.image;
    }
    return map;
  }, [selectedCharacter]);

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [isAddingToSession, setIsAddingToSession] = useState(false);

  // Controlled queue and events — lifted out of StartSessionDialog
  const [sessionQueue, setSessionQueue] = useState<SessionQueueItem[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvents>({
    starCatching: true,
    thirtyPctMesoReduction: false,
    thirtyPctBoomReduction: false,
    mvpDiscount: 0,
  });

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const activeItem = activeSession?.items?.find(i => i.equipmentId === activeSession.activeItemEquipmentId) ?? null;

  // Called when EquipmentForm saves a new storage item from the session dialog
  const handleNewItemSaved = async (data: StorageSaveData) => {
    try {
      if (characterId) await addStorageItem(characterId, data);
    } catch {
      // non-critical — item may still be added to queue
    }
    const qi = itemToQueue({
      catalogId: data.catalogId,
      name: data.name,
      image: data.image,
      level: data.level ?? 0,
      currentStarForce: data.currentStarForce,
      targetStarForce: data.targetStarForce,
      safeguard: false,
    }, sessionEvents);
    if (qi) {
      setSessionQueue(prev => {
        if (prev.some(q => q.equipmentId === qi.equipmentId)) return prev;
        return [...prev, qi];
      });
      toast.success(`${data.name ?? 'Item'} added to queue.`);
    }
    setAddItemOpen(false);
    setStartDialogOpen(true);
  };

  const handleSubmitLog = async (data: {
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
  }) => {
    if (!activeSession) return;
    const { boomStars, mesoAfter, ...logData } = data;

    // Create backend session lazily on first log
    const sessionId = activeSession.sessionId ?? await ensureSession(
      activeSession.sessionName,
      activeSession.startingMeso > 0 ? activeSession.startingMeso : undefined
    );
    if (!sessionId) return;

    const log = await apiService.addSessionLog(sessionId, logData);

    for (const star of boomStars.filter(s => s > 0)) {
      await apiService.addBoomDetail(log.id, star);
    }

    addLog(log);
    updateItemStar(data.equipmentId, data.endStar);
    updateMesoBalance(mesoAfter);

    // Only advance to next item if no boom and item isn't done
    const item = activeSession.items.find(i => i.equipmentId === data.equipmentId);
    const willComplete = data.endStar >= (item?.targetStar ?? 0);
    const hasBoom = data.totalBooms > 0;
    if (!willComplete && !hasBoom) advanceActiveItem();

    toast.success('Segment logged!');
    setLogDialogOpen(false);
    loadSessions();
  };

  const handleMoveItem = (equipmentId: number, direction: 'left' | 'right') => {
    if (!activeSession) return;
    const items = [...activeSession.items];
    const idx = items.findIndex(i => i.equipmentId === equipmentId);
    if (idx === -1) return;
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    reorderItems(items);
  };

  const totalSpent = activeSession
    ? activeSession.startingMeso > 0
      ? activeSession.startingMeso - activeSession.currentMesoBalance
      : 0
    : 0;

  const incompleteCount = activeSession?.items.filter(i => !i.completed).length ?? 0;
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="space-y-4">

      {activeSession ? (
        /* ══════════════════════════════════════════════
           ACTIVE SESSION — full-focus workspace
           ══════════════════════════════════════════════ */
        <div className="space-y-3">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <p className="text-sm font-semibold font-maplestory text-white/80 truncate">
                {activeSession.sessionName || 'Session'}
              </p>
              {activeSession.startingMeso > 0 && totalSpent > 0 && (
                <span className="text-[10px] text-red-400/60 font-maplestory shrink-0">
                  · -{formatMeso(totalSpent)} spent
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                endSession(activeSession.currentMesoBalance > 0 ? activeSession.currentMesoBalance : undefined);
                loadSessions();
                toast.success('Session ended.');
              }}
              className="h-6 text-[11px] font-maplestory text-white/25 hover:text-destructive/70 px-2 shrink-0"
            >
              End session
            </Button>
          </div>

          {/* Item queue — drag to reorder, tap to select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-white/30 font-maplestory">
                Tap an item to switch · drag to reorder
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIsAddingToSession(true); setStartDialogOpen(true); }}
                className="h-6 text-[10px] font-maplestory text-white/30 hover:text-white/60 px-2 gap-1"
              >
                <Plus className="w-3 h-3" /> Add item
              </Button>
            </div>
            <Reorder.Group
              axis="x"
              values={activeSession.items}
              onReorder={reorderItems}
              className="flex gap-3 overflow-x-auto pb-4 pt-1 px-0.5 scrollbar-none"
            >
              {activeSession.items.map((item, idx) => (
                <Reorder.Item key={item.equipmentId} value={item} className="shrink-0 group">
                  <ItemCard
                    item={item}
                    isActive={item.equipmentId === activeSession.activeItemEquipmentId}
                    onSelect={() => !item.completed && setActiveItem(item.equipmentId)}
                    onMoveLeft={() => handleMoveItem(item.equipmentId, 'left')}
                    onMoveRight={() => handleMoveItem(item.equipmentId, 'right')}
                    showLeft={idx > 0}
                    showRight={idx < activeSession.items.length - 1}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Log action */}
          {activeItem && !activeItem.completed ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <EquipmentImage
                    src={activeItem.image}
                    alt={activeItem.name}
                    size="md"
                    fallbackIcon={() => <Package className="w-4 h-4" />}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-maplestory text-white/80 font-semibold truncate">{activeItem.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold font-maplestory text-white">{activeItem.currentStar}</span>
                      <span className="text-[10px] text-white/30 font-maplestory">→ ★{activeItem.targetStar}</span>
                    </div>
                  </div>
                  {activeSession.currentMesoBalance > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-white/25 font-maplestory">balance</p>
                      <p className="text-xs font-bold font-maplestory text-primary/80">{formatMeso(activeSession.currentMesoBalance)}</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setLogDialogOpen(true)}
                  className="font-maplestory w-full h-10 text-sm rounded-lg"
                >
                  Done tapping this item? Record result
                </Button>
                <p className="text-[10px] text-white/20 font-maplestory text-center leading-relaxed">
                  Switch to a different item above at any time · results saved per chunk, not per star
                </p>
              </CardContent>
            </Card>
          ) : incompleteCount === 0 ? (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="flex flex-col items-center gap-3 py-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-maplestory text-green-400">All items complete!</span>
                </div>
                <Button
                  onClick={() => {
                    endSession(activeSession.currentMesoBalance > 0 ? activeSession.currentMesoBalance : undefined);
                    loadSessions();
                    toast.success('Session saved.');
                  }}
                  className="font-maplestory h-9 px-6 rounded-full"
                >
                  Save & End Session
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Current session logs */}
          {activeSession.logs.length > 0 && (
            <ActiveSessionLogs
              logs={activeSession.logs}
              imageMap={imageMap}
              onDeleteLog={async (logId) => {
                try {
                  await deleteLog(logId);
                  toast.success('Log removed.');
                } catch {
                  toast.error('Could not remove log.');
                }
              }}
            />
          )}

          {/* Collapsed history link */}
          {(isLoading || sessions.length > 0) && (
            <button
              onClick={() => setHistoryOpen(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/40 font-maplestory transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              {historyOpen ? 'Hide' : 'View'} past sessions
            </button>
          )}
          {historyOpen && (
            isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-white/30" />
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-card divide-y divide-border/30 overflow-hidden">
                {sessions.map(s => <PastSessionCard key={s.id} session={s} imageMap={imageMap} onDelete={async (id) => {
                  try {
                    await deleteSession(id);
                    toast.success('Session deleted.');
                  } catch {
                    toast.error('Could not delete session.');
                  }
                }} />)}
              </div>
            )
          )}
        </div>

      ) : (
        /* ══════════════════════════════════════════════
           NO ACTIVE SESSION — history + start CTA
           ══════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold font-maplestory text-white/70">Starforce Sessions</p>
              <p className="text-[11px] text-white/30 font-maplestory mt-0.5">
                Track meso spent and compare your luck to the average
              </p>
            </div>
            <Button onClick={() => setStartDialogOpen(true)} className="font-maplestory rounded-full gap-1.5 shrink-0" size="sm">
              <Plus className="w-3.5 h-3.5" /> Start Session
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white/15" />
              </div>
              <p className="text-xs text-white/25 font-maplestory">No sessions yet — start one while you tap!</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card divide-y divide-border/30 overflow-hidden">
              {sessions.map(s => <PastSessionCard key={s.id} session={s} imageMap={imageMap} onDelete={async (id) => {
                try {
                  await deleteSession(id);
                  toast.success('Session deleted.');
                } catch {
                  toast.error('Could not delete session.');
                }
              }} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs — StartSessionDialog is fully controlled, EquipmentForm is a sibling ── */}
      <StartSessionDialog
        open={startDialogOpen}
        onOpenChange={open => {
          setStartDialogOpen(open);
          if (!open) { setSessionQueue([]); setIsAddingToSession(false); }
        }}
        queue={sessionQueue}
        onAddToQueue={item => setSessionQueue(prev => [...prev, item])}
        onRemoveFromQueue={id => setSessionQueue(prev => prev.filter(q => q.equipmentId !== id))}
        onUpdateQueueItem={(id, update) => setSessionQueue(prev => prev.map(q => q.equipmentId === id ? { ...q, ...update } : q))}
        events={sessionEvents}
        onEventsChange={setSessionEvents}
        onStart={async (name, meso) => {
          if (isAddingToSession) {
            const updatedQueue = sessionQueue.map(item => ({
              ...item,
              starCatching: sessionEvents.starCatching,
              thirtyPctMesoReduction: sessionEvents.thirtyPctMesoReduction,
              thirtyPctBoomReduction: sessionEvents.thirtyPctBoomReduction,
              mvpDiscount: sessionEvents.mvpDiscount,
            }));
            addItemsToSession(updatedQueue);
            setSessionQueue([]);
            setIsAddingToSession(false);
            toast.success(`${updatedQueue.length} item${updatedQueue.length !== 1 ? 's' : ''} added to session.`);
          } else {
            const updatedQueue = sessionQueue.map(item => ({
              ...item,
              starCatching: sessionEvents.starCatching,
              thirtyPctMesoReduction: sessionEvents.thirtyPctMesoReduction,
              thirtyPctBoomReduction: sessionEvents.thirtyPctBoomReduction,
              mvpDiscount: sessionEvents.mvpDiscount,
            }));
            await startSession(name, meso, updatedQueue);
            setSessionQueue([]);
          }
        }}
        onRequestAddItem={() => {
          setStartDialogOpen(false);
          setAddItemOpen(true);
        }}
        mode={isAddingToSession ? 'add' : 'start'}
      />

      {addItemOpen && (
        <EquipmentForm
          open={addItemOpen}
          onOpenChange={open => {
            setAddItemOpen(open);
            if (!open) setStartDialogOpen(true);
          }}
          onSave={() => {}}
          storageMode
          onSaveStorage={handleNewItemSaved}
          selectedJob={selectedJob}
        />
      )}

      {activeItem && (
        <LogResultDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
          item={activeItem}
          currentMesoBalance={activeSession?.currentMesoBalance ?? 0}
          onSubmit={handleSubmitLog}
        />
      )}
    </div>
  );
}

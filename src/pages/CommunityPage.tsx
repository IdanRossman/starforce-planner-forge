import { useState, useEffect, useCallback } from 'react';
import { sessionApiService } from '@/services/api';
import { formatMeso } from '@/lib/utils';
import { EquipmentImage } from '@/components/EquipmentImage';
import { Card, CardContent } from '@/components/ui/card';
import { Equipment } from '@/types';
import type {
  CommunityGlobalStats, CommunityFeedEntry, CommunityTrendingItem, EquipmentSearchResult, EquipmentSummary
} from '@/types';
import {
  Star, Flame, TrendingUp, TrendingDown,
  Users, Package, X, Search,
  CheckCircle2, BarChart2, Loader2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WatchedItem {
  key: string; // equipmentId (string)
  equipment: Equipment;
  summary: EquipmentSummary | null;
  loading: boolean;
  notFound: boolean;
  trending?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number) { return `${Math.round(n * 100)}%`; }

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Small shared components ───────────────────────────────────────────────────

function SampleBadge({ n }: { n: number }) {
  const [cls, label] =
    n < 20  ? ['bg-white/8 text-white/30', `n=${n} · low data`] :
    n < 100 ? ['bg-yellow-500/15 text-yellow-400', `n=${n}`] :
              ['bg-green-500/15 text-green-400', `n=${n}`];
  return <span className={`text-[10px] font-maplestory px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

const DarkTooltip = ({ active, payload, label, fmt }: {
  active?: boolean; payload?: { value: number; name?: string }[];
  label?: string; fmt?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/85 backdrop-blur border border-border/40 rounded-lg px-3 py-2 text-xs font-maplestory">
      {label && <p className="text-white/40 mb-1">{label}</p>}
      {payload.map((p, i) => <p key={i} className="text-white">{fmt ? fmt(p.value) : p.value}</p>)}
    </div>
  );
};

// ── Equipment search picker ───────────────────────────────────────────────────

function EquipmentSearchPicker({
  watchedIds, onToggle,
}: {
  watchedIds: Set<string>;
  onToggle: (r: EquipmentSearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EquipmentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      sessionApiService.searchCommunityEquipment(query)
        .then(r => { setResults(r); setOpen(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border/40 focus-within:border-primary/40 transition-colors">
        {loading
          ? <Loader2 className="w-4 h-4 text-white/30 shrink-0 animate-spin" />
          : <Search className="w-4 h-4 text-white/30 shrink-0" />
        }
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search equipment (e.g. Arcane Umbra, Absolab…)"
          className="bg-transparent flex-1 text-sm font-maplestory text-white placeholder:text-white/25 focus:outline-none"
        />
        {query && (
          <button onClick={clear} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1.5 w-full rounded-xl border border-border/40 bg-[#0e141b]/95 backdrop-blur shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto divide-y divide-border/15">
            {results.map(r => {
              const id = String(r.equipmentId);
              const watched = watchedIds.has(id);
              return (
                <button
                  key={id}
                  onClick={() => { onToggle(r); if (!watched) clear(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    watched ? 'bg-primary/10' : 'hover:bg-white/5'
                  }`}
                >
                  <EquipmentImage
                    src={r.image}
                    alt={r.equipmentName}
                    size="sm"
                    fallbackIcon={() => <Package className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  />
                  <span className="flex-1 text-sm font-maplestory text-white/80 truncate">{r.equipmentName}</span>
                  {watched && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open && !loading && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-20 top-full mt-1.5 w-full rounded-xl border border-border/40 bg-[#0e141b]/95 backdrop-blur shadow-xl px-4 py-4 text-center">
          <p className="text-xs text-white/30 font-maplestory">No equipment found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ── Item summary card ─────────────────────────────────────────────────────────

function ItemSummaryCard({ item, onRemove, hideRemove }: { item: WatchedItem; onRemove: () => void; hideRemove?: boolean }) {
  const s = item.summary;
  const maxCount = s ? Math.max(...s.topTargets.map(t => t.count), 1) : 1;

  return (
    <Card className="border-border/30 bg-card">
      <CardContent className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <EquipmentImage src={item.equipment.image} alt={item.equipment.name ?? ''} size="md" fallbackIcon={() => <Package className="w-4 h-4" />} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold font-maplestory text-white/85 truncate">{item.equipment.name ?? 'Unknown'}</p>
              {item.trending && (
                <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-maplestory px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary/80">
                  <TrendingUp className="w-2.5 h-2.5" />Trending
                </span>
              )}
            </div>
            {s && <p className="text-[10px] text-white/35 font-maplestory mt-0.5">{s.totalLogs.toLocaleString()} runs logged</p>}
          </div>
          {!hideRemove && (
            <button onClick={onRemove} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {item.loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-9 rounded-xl bg-white/4 animate-pulse" />)}
          </div>
        )}

        {/* No data */}
        {!item.loading && item.notFound && (
          <p className="text-xs text-white/25 font-maplestory py-2 text-center">No community data yet for this item.</p>
        )}

        {/* Summary data */}
        {!item.loading && s && (
          <>
            {/* Top targets */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/35 font-maplestory uppercase tracking-wider">Most targeted</p>
              {s.topTargets.map((t, i) => {
                const barW = Math.round((t.count / maxCount) * 100);
                const successColor = t.successRate >= 0.85 ? 'text-green-400' : t.successRate >= 0.65 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <div key={t.targetStar} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3 border border-border/20">
                    {/* Rank badge */}
                    <span className="text-[10px] font-bold font-maplestory text-white/20 w-3 shrink-0">{i + 1}</span>
                    {/* Star label */}
                    <div className="flex items-center gap-1 shrink-0 w-8">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold font-maplestory text-white/80">{t.targetStar}</span>
                    </div>
                    {/* Bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-white/8">
                      <div className="h-1.5 rounded-full bg-primary/60" style={{ width: `${barW}%` }} />
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`text-xs font-bold font-maplestory ${successColor}`}>{pct(t.successRate)}</span>
                      {t.averageBooms > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-maplestory text-orange-400/70">
                          <Flame className="w-2.5 h-2.5" />{t.averageBooms.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[10px] text-white/20 font-maplestory tabular-nums">{t.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top boom stars */}
            {s.topBoomStars.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/35 font-maplestory uppercase tracking-wider">Where booms hit</p>
                <div className="flex gap-2">
                  {s.topBoomStars.map((b, i) => (
                    <div key={b.star} className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border ${i === 0 ? 'border-orange-500/30 bg-orange-500/8' : 'border-border/30 bg-card'}`}>
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold font-maplestory text-white/80">{b.star}</span>
                      </div>
                      <span className={`text-sm font-bold font-maplestory ${i === 0 ? 'text-orange-400' : 'text-white/50'}`}>{pct(b.rate)}</span>
                      <span className="text-[10px] text-white/20 font-maplestory">of booms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Live feed ─────────────────────────────────────────────────────────────────

function LiveFeed({ feed, loading }: { feed: CommunityFeedEntry[]; loading: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold font-maplestory text-white/50 uppercase tracking-wider">Recent Activity</p>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="rounded-xl border border-border/30 bg-card divide-y divide-border/15 overflow-hidden">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="w-7 h-7 rounded-md bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-white/5 animate-pulse" />
                <div className="h-2 w-48 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          ))
        ) : feed.length === 0 ? (
          <p className="text-xs text-white/25 font-maplestory px-4 py-6 text-center">No recent activity yet.</p>
        ) : (
          feed.map((entry, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/3 transition-colors">
              <EquipmentImage src={entry.image} alt={entry.equipmentName} size="sm" fallbackIcon={() => <Package className="w-3.5 h-3.5" />} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-maplestory text-white/70 truncate">{entry.equipmentName}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-maplestory px-1.5 py-0.5 rounded-full ${entry.success ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-white/35'}`}>
                    <Star className="w-2 h-2 fill-current" />★{entry.startStar}→★{entry.endStar}
                  </span>
                  <span className="text-[10px] font-bold font-maplestory text-white/60 tabular-nums">{formatMeso(entry.totalMesoCost)}</span>
                  {entry.totalBooms > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-maplestory text-orange-400">
                      <Flame className="w-2.5 h-2.5" />{entry.totalBooms}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-white/20 font-maplestory shrink-0">{timeAgo(entry.loggedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Global stats banner ───────────────────────────────────────────────────────

function GlobalStatsBanner({ stats }: { stats: CommunityGlobalStats | null }) {
  const drift = stats?.simulatorDriftPercent ?? null;
  const driftOver = drift !== null && drift > 0;

  const cells = [
    { label: 'Runs logged', value: stats ? stats.totalLogs.toLocaleString() : '—', icon: <Users className="w-3.5 h-3.5 text-primary/70" /> },
    { label: 'Meso tracked', value: stats ? formatMeso(stats.totalMesoTracked) : '—', icon: <Star className="w-3.5 h-3.5 text-yellow-400" /> },
    { label: 'Booms recorded', value: stats ? stats.totalBooms.toLocaleString() : '—', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    {
      label: 'vs simulator',
      value: drift === null ? '—' : `${driftOver ? '+' : ''}${drift.toFixed(1)}%`,
      icon: driftOver
        ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        : <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
      valueColor: drift === null ? '' : driftOver ? 'text-red-400' : 'text-green-400',
      tooltip: driftOver
        ? 'Players spend more than the simulator predicts on average'
        : 'Players spend less than the simulator predicts on average',
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cells.map(c => (
        <div key={c.label} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border/30" title={'tooltip' in c ? c.tooltip : undefined}>
          {c.icon}
          <div>
            <p className={`text-xs font-bold font-maplestory tabular-nums ${'valueColor' in c && c.valueColor ? c.valueColor : 'text-white/85'}`}>{c.value}</p>
            <p className="text-[10px] text-white/35 font-maplestory">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [globalStats, setGlobalStats] = useState<CommunityGlobalStats | null>(null);
  const [feed, setFeed] = useState<CommunityFeedEntry[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  // Trending: auto-loaded full cards shown in the top row
  const [trendingCards, setTrendingCards] = useState<WatchedItem[]>([]);
  // User-selected: items added via search, shown below
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>([]);

  // Generic summary fetcher — works against any state setter
  const fetchSummary = useCallback(async (
    key: string,
    equipmentId: number,
    setState: React.Dispatch<React.SetStateAction<WatchedItem[]>>,
  ) => {
    setState(prev => prev.map(w => w.key === key ? { ...w, loading: true, notFound: false } : w));
    try {
      const summary = await sessionApiService.getEquipmentSummary(equipmentId);
      setState(prev => prev.map(w => w.key === key ? { ...w, summary, loading: false } : w));
    } catch {
      setState(prev => prev.map(w => w.key === key ? { ...w, summary: null, loading: false, notFound: true } : w));
    }
  }, []);

  // Global stats + feed + trending on mount
  useEffect(() => {
    sessionApiService.getCommunityGlobalStats().then(setGlobalStats).catch(() => {});
    sessionApiService.getCommunityFeed(20)
      .then(r => setFeed(r.entries)).catch(() => {}).finally(() => setLoadingFeed(false));

    // Auto-load top 3 trending as full cards
    sessionApiService.getCommunityTrending(30).then(({ items }) => {
      const top3 = items.slice(0, 3);
      const cards: WatchedItem[] = top3.map(t => ({
        key: String(t.equipmentId),
        equipment: {
          id: String(t.equipmentId), catalogId: String(t.equipmentId),
          name: t.equipmentName, image: t.image,
          slot: 'hat' as const, type: 'armor' as const,
          level: 0, currentStarForce: 0, targetStarForce: 0, starforceable: true,
        },
        summary: null, loading: true, notFound: false, trending: true,
      }));
      setTrendingCards(cards);
      top3.forEach(t => fetchSummary(String(t.equipmentId), t.equipmentId, setTrendingCards));
    }).catch(() => {});
  }, [fetchSummary]);

  // Feed auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => {
      sessionApiService.getCommunityFeed(20).then(r => setFeed(r.entries)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const watchedIds = new Set(watchedItems.map(w => w.key));

  const handleToggleSearchResult = (r: EquipmentSearchResult) => {
    const key = String(r.equipmentId);
    if (watchedIds.has(key)) {
      setWatchedItems(prev => prev.filter(w => w.key !== key));
      return;
    }
    const eq: Equipment = {
      id: key, catalogId: key, name: r.equipmentName, image: r.image,
      slot: 'hat', type: 'armor', level: 0,
      currentStarForce: 0, targetStarForce: 0, starforceable: true,
    };
    setWatchedItems(prev => [...prev, { key, equipment: eq, summary: null, loading: true, notFound: false }]);
    fetchSummary(key, r.equipmentId, setWatchedItems);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-5">

          <div>
            <h1 className="text-2xl font-bold font-maplestory text-white/90">Community Starforce Data</h1>
            <p className="text-sm text-white/35 font-maplestory mt-1">Real outcomes from real players — not simulations.</p>
          </div>

          <GlobalStatsBanner stats={globalStats} />

          {/* Trending — 3 full cards in a row */}
          {trendingCards.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wider">Trending this month</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {trendingCards.map(item => (
                  <ItemSummaryCard key={item.key} item={item} onRemove={() => {}} hideRemove />
                ))}
              </div>
            </div>
          )}

          {/* Divider + search */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wider">Compare equipment</p>
            <EquipmentSearchPicker watchedIds={watchedIds} onToggle={handleToggleSearchResult} />
          </div>

          {/* User-selected cards */}
          {watchedItems.length > 0 && (
            <div className="space-y-4">
              {watchedItems.map(item => (
                <ItemSummaryCard
                  key={item.key}
                  item={item}
                  onRemove={() => setWatchedItems(prev => prev.filter(w => w.key !== item.key))}
                />
              ))}
            </div>
          )}

          {watchedItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center rounded-xl border border-dashed border-border/30 bg-card">
              <BarChart2 className="w-8 h-8 text-white/10" />
              <p className="text-sm font-maplestory text-white/30">Search for an item above to compare</p>
            </div>
          )}
        </div>

        {/* ── Right column — live feed ── */}
        <div className="lg:w-80 xl:w-96 shrink-0">
          <div className="lg:sticky lg:top-28">
            <LiveFeed feed={feed} loading={loadingFeed} />
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot, StorageItem } from "@/types";
import { StoragePanel } from "@/components/StoragePanel";
import { StarforceSessionTab } from "@/components/StarforceSession/StarforceSessionTab";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { useCharacterWorth, formatMesos } from "@/hooks/useCharacterWorth";
import { Loader2 } from "lucide-react";
import { getJobPlaceholderImage, getJobColors } from "@/lib/jobIcons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { EquipmentForm } from "@/components/EquipmentForm";
import { StarForceCalculator } from "@/components/StarForceCalculator";
import { PotentialCalculator } from "@/components/PotentialCalculator";
import { usePotential } from "@/hooks/game/usePotential";
import {
  trackEquipmentAdded,
  trackStarForceCalculation,
  trackTabSwitch,
  trackEquipmentTransfer
} from "@/lib/analytics";
import {
  Target,
  Calculator,
  Plus,
  Star,
  TrendingUp,
  AlertCircle,
  Filter,
  Package,
  Minus,
  DollarSign,
  Zap,
  Crown,
  RefreshCw,
  Edit,
  Trash2,
  Sparkles,
  Film,
  ImageIcon,
} from "lucide-react";

interface EnhancedEquipmentManagerProps {
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onAddEquipment: (slot: EquipmentSlot) => void;
  onClearEquipment: (slot: EquipmentSlot) => void;
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onTransfer?: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
  selectedJob?: string;
  additionalEquipment?: Equipment[];
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  onDeleteAdditionalEquipment?: (equipmentId: string) => void;
  characterId?: string;
  characterName?: string;
  characterImage?: string;
  callingCardHash?: string | null;
  animatedCardVideoHash?: string | null;
  canAnimateCallingCard?: boolean;
  isAnimating?: boolean;
  characterLevel?: number;
  enableCallingCard?: boolean;
  isRegeneratingCard?: boolean;
  remainingGenerations?: number;
  onRegenerateCard?: (e: React.MouseEvent) => void;
  onAnimateCard?: (e: React.MouseEvent) => void;
  onEditCharacter?: () => void;
  onDeleteCharacter?: () => void;
}


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function CallingCardPlaceholder({ jobClass, characterImage, characterName }: {
  jobClass: string;
  characterImage?: string;
  characterName?: string;
}) {
  const placeholder = getJobPlaceholderImage(jobClass);
  const colors = getJobColors(jobClass);
  const displayImage = placeholder || characterImage;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Job-colored gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-30`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
      {/* Character art */}
      <div className="absolute inset-0 flex items-end justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={characterName || jobClass}
            className="h-full object-contain drop-shadow-2xl"
          />
        ) : (
          <Crown className="w-10 h-10 text-white/10 mb-8" />
        )}
      </div>
    </div>
  );
}

export function EnhancedEquipmentManager({
  equipment,
  onEditEquipment,
  onAddEquipment,
  onClearEquipment,
  onUpdateStarforce,
  onSaveEquipment,
  onTransfer,
  selectedJob,
  characterId,
  characterName,
  characterImage,
  callingCardHash,
  animatedCardVideoHash,
  canAnimateCallingCard = false,
  isAnimating = false,
  characterLevel,
  enableCallingCard = false,
  isRegeneratingCard,
  remainingGenerations = 0,
  onRegenerateCard,
  onAnimateCard,
  onEditCharacter,
  onDeleteCharacter,
}: EnhancedEquipmentManagerProps) {
  const { isEquipmentLoading, selectedCharacter, refreshCharacterEquipment } = useCharacterContext();
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(!!animatedCardVideoHash);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('1376 / 768');

  // sync showVideo when animated card appears or character changes
  useEffect(() => {
    setShowVideo(!!animatedCardVideoHash);
    if (!animatedCardVideoHash) setVideoAspectRatio('1376 / 768');
  }, [animatedCardVideoHash, characterId]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<EquipmentSlot | null>(null);
  const [activeTab, setActiveTab] = useState("equipment");

  // Use the potential hook
  const { getPotentialSummary } = usePotential();

  // Calculate character worth
  const storageItems = selectedCharacter?.storageItems ?? [];
  const { worth, isLoading: isWorthLoading, refetch: refetchWorth } = useCharacterWorth(
    equipment,
    storageItems,
    characterId
  );

  // Handle tab switching with analytics tracking
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      trackTabSwitch(activeTab, newTab);
      setActiveTab(newTab);
      if (newTab === 'equipment' && characterId) {
        refreshCharacterEquipment(characterId);
      }
    }
  };

  // Convert storage items to Equipment shape for calculator/potential tabs
  const storageAsEquipment: Equipment[] = storageItems.map((item: StorageItem) => ({
    id: `storage-${item.id}`,
    catalogId: item.catalogId,
    name: item.name,
    set: item.set,
    slot: (item.itemType ?? 'medal') as EquipmentSlot,
    type: item.type,
    level: item.level,
    starforceable: item.starforceable,
    currentStarForce: item.currentStarForce,
    targetStarForce: item.targetStarForce,
    currentPotentialValue: item.currentPotential,
    targetPotentialValue: item.targetPotential,
    image: item.image,
    itemType: item.itemType,
  }));

  // Calculate stats including storage items
  const allEquipment = [...equipment, ...storageAsEquipment];
  const starforceableEquipment = allEquipment.filter(eq => eq.starforceable);
  const pendingEquipment = starforceableEquipment.filter(eq => eq.currentStarForce < eq.targetStarForce);
  const potentialEquipment = allEquipment.filter(eq => 
    eq.currentPotentialValue || eq.targetPotentialValue
  );
  // Track calculator usage when switching to calculator tab with pending equipment
  useEffect(() => {
    if (activeTab === "calculator" && pendingEquipment.length > 0) {
      trackStarForceCalculation(pendingEquipment.length);
    }
  }, [activeTab, pendingEquipment.length]);


  const handleOpenEquipmentForm = (equipment?: Equipment, slot?: EquipmentSlot) => {
    setEditingEquipment(equipment || null);
    setDefaultSlot(slot || null);
    setEquipmentFormOpen(true);
  };

  const handleCloseEquipmentForm = () => {
    setEquipmentFormOpen(false);
    setEditingEquipment(null);
    setDefaultSlot(null);
  };

  const handleSaveEquipmentForm = (equipment: Equipment) => {
    if (!editingEquipment) {
      trackEquipmentAdded(equipment.slot || 'additional', equipment.name);
    }
    if (onSaveEquipment) {
      onSaveEquipment(equipment);
    }
    handleCloseEquipmentForm();
  };

  const handleUpdateSafeguard = (equipmentId: string, safeguard: boolean) => {
    const targetEquipment = equipment.find(eq => eq.id === equipmentId);
    if (targetEquipment && onSaveEquipment) {
      onSaveEquipment({ ...targetEquipment, safeguard });
    }
  };

  const handleUpdateIncludeInCalculations = (equipmentId: string, includeInCalculations: boolean) => {
    const targetEquipment = equipment.find(eq => eq.id === equipmentId);
    if (targetEquipment && onSaveEquipment) {
      onSaveEquipment({ ...targetEquipment, includeInCalculations });
    }
  };

  const getStarforceStatus = (equipment: Equipment) => {
    if (!equipment.starforceable) return "non-starforceable";
    if (equipment.currentStarForce >= equipment.targetStarForce) return "completed";
    return "pending";
  };

  const getStatusBadge = (equipment: Equipment) => {
    const status = getStarforceStatus(equipment);
    
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 font-maplestory">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-maplestory">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground font-maplestory">Non-SF</Badge>;
    }
  };

  // Helper function to format target potential summary
  const getTargetPotentialSummary = (equipment: Equipment): string => {
    // First check for string value (new format)
    if (equipment.targetPotentialValue) {
      return equipment.targetPotentialValue;
    }
    
    // Fallback to array format (old format)
    if (!equipment.targetPotential || equipment.targetPotential.length === 0) {
      return "No target set";
    }

    return getPotentialSummary(equipment.targetPotential);
  };

  // Helper function to format current potential summary
  const getCurrentPotentialSummary = (equipment: Equipment): string => {
    // First check for string value (new format)
    if (equipment.currentPotentialValue) {
      return equipment.currentPotentialValue;
    }
    
    // Fallback to array format (old format)
    if (!equipment.currentPotential || equipment.currentPotential.length === 0) {
      return "No potential";
    }

    return getPotentialSummary(equipment.currentPotential);
  };

  return (
    <div className="space-y-4">
      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11 bg-[hsl(217_33%_9%/0.97)] border border-primary/20 p-1 gap-1 rounded-xl">
          <TabsTrigger
            value="equipment"
            className="flex items-center gap-2 font-maplestory data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none text-white/50 hover:text-white/80 transition-colors rounded-lg"
          >
            <span>Setup</span>
          </TabsTrigger>
              <TabsTrigger
                value="calculator"
                className="flex items-center gap-2 font-maplestory data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none text-white/50 hover:text-white/80 transition-colors rounded-lg"
              >
                <span className="hidden sm:inline">Starforce Breakdown</span>
                <span className="inline sm:hidden">Starforce</span>
                {pendingEquipment.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0 min-w-[20px] h-5 font-maplestory">
                    {pendingEquipment.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="potential"
                className="flex items-center gap-2 font-maplestory data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none text-white/50 hover:text-white/80 transition-colors rounded-lg"
              >
                <span className="hidden sm:inline">Potential Breakdown</span>
                <span className="inline sm:hidden">Potential</span>
                {potentialEquipment.filter(eq => eq.targetPotentialValue && eq.targetPotentialValue !== eq.currentPotentialValue).length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0 min-w-[20px] h-5 font-maplestory">
                    {potentialEquipment.filter(eq => eq.targetPotentialValue && eq.targetPotentialValue !== eq.currentPotentialValue).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="flex items-center gap-2 font-maplestory data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none text-white/50 hover:text-white/80 transition-colors rounded-lg"
              >
                <span className="hidden sm:inline">Starforce Sessions</span>
                <span className="inline sm:hidden">Sessions</span>
              </TabsTrigger>
            </TabsList>

            {/* Equipment Setup Tab */}
            <TabsContent value="equipment" className="mt-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Column 1 — Character data */}
                <div className="flex flex-col gap-3 overflow-visible order-2 xl:order-1">

                  {/* Calling card — clean, no overlays */}
                  <div className="relative overflow-visible">
                    {/* Glow layer — static card only */}
                    {!(animatedCardVideoHash && showVideo) && (() => {
                      const glowSrc = callingCardHash
                        ? `${SUPABASE_URL}/storage/v1/object/public/calling-cards/${callingCardHash}.png`
                        : getJobPlaceholderImage(selectedJob || selectedCharacter?.class || '') || characterImage;
                      return glowSrc ? (
                        <img
                          src={glowSrc}
                          alt=""
                          aria-hidden="true"
                          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] object-cover blur-3xl opacity-40 rounded-3xl pointer-events-none"
                        />
                      ) : null;
                    })()}
                    <div
                      className={`relative rounded-xl ring-1 ring-white/10 ${animatedCardVideoHash && showVideo ? '' : 'overflow-hidden'}`}
                      style={{ aspectRatio: animatedCardVideoHash && showVideo ? videoAspectRatio : '1376 / 768' }}
                    >
                      {animatedCardVideoHash && showVideo ? (
                        <video
                          src={`${SUPABASE_URL}/storage/v1/object/public/animated-calling-cards/${animatedCardVideoHash}.mp4`}
                          autoPlay loop muted playsInline preload="auto"
                          className="w-full h-full rounded-xl"
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            if (v.videoWidth && v.videoHeight)
                              setVideoAspectRatio(`${v.videoWidth} / ${v.videoHeight}`);
                          }}
                        />
                      ) : callingCardHash ? (
                        <img
                          src={`${SUPABASE_URL}/storage/v1/object/public/calling-cards/${callingCardHash}.png`}
                          alt={characterName}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <CallingCardPlaceholder
                          jobClass={selectedJob || selectedCharacter?.class || ''}
                          characterImage={characterImage}
                          characterName={characterName}
                        />
                      )}
                      {/* Character identity overlay */}
                      {!(animatedCardVideoHash && showVideo) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pt-6 pb-3 pointer-events-none">
                          <p className="text-[10px] text-white/60 uppercase tracking-widest font-maplestory leading-none mb-0.5">{selectedCharacter?.class}</p>
                          <p className="text-lg font-bold text-white font-maplestory leading-tight">{characterName}</p>
                          <p className="text-xs text-white/50 font-maplestory">Level {characterLevel}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Character info card with worth */}
                  <Card className="bg-[hsl(217_33%_9%/0.97)] border-primary/15 flex-1">
                    <CardContent className="p-3 flex flex-col gap-2 h-full justify-between">
                      {/* Character identity + actions row — always visible */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="text-base font-bold text-white font-maplestory leading-tight truncate">{characterName}</p>
                          <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide">{selectedCharacter?.class} · Lv.{characterLevel}</p>
                        </div>
                        {(onEditCharacter || onDeleteCharacter) && (
                          <div className="flex items-center gap-1 shrink-0">
                            {onEditCharacter && (
                              <button
                                onClick={onEditCharacter}
                                title="Edit character"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteCharacter && (
                              <button
                                onClick={onDeleteCharacter}
                                title="Delete character"
                                className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400/40 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* ── Calling card actions ── */}
                      {(callingCardHash || enableCallingCard) && (onRegenerateCard || (canAnimateCallingCard && onAnimateCard && callingCardHash) || (animatedCardVideoHash && callingCardHash)) && (
                        <>
                          <div className="border-t border-white/10" />
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[9px] text-white/25 uppercase tracking-widest font-maplestory px-0.5">Calling Card</p>

                            {/* Static / Animated view toggle */}
                            {animatedCardVideoHash && callingCardHash && (
                              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                <button
                                  onClick={() => setShowVideo(false)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-maplestory py-1 rounded-md transition-all ${!showVideo ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  Static
                                </button>
                                <button
                                  onClick={() => setShowVideo(true)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-maplestory py-1 rounded-md transition-all ${showVideo ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}
                                >
                                  <Film className="w-3 h-3" />
                                  Animated
                                </button>
                              </div>
                            )}

                            {/* Regen + Animate row */}
                            <div className="flex gap-1.5">
                              {onRegenerateCard && (
                                <button
                                  onClick={onRegenerateCard}
                                  disabled={isRegeneratingCard}
                                  title={isRegeneratingCard ? 'Generating…' : remainingGenerations > 0 ? `Regenerate (${remainingGenerations} left)` : 'Regenerate'}
                                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-maplestory py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <RefreshCw className={`w-3 h-3 flex-shrink-0 ${isRegeneratingCard ? 'animate-spin' : ''}`} />
                                  <span className="truncate">
                                    {isRegeneratingCard ? 'Generating…' : remainingGenerations > 0 ? `Regen (${remainingGenerations})` : 'Regen'}
                                  </span>
                                </button>
                              )}
                              {canAnimateCallingCard && onAnimateCard && callingCardHash && (
                                <button
                                  onClick={onAnimateCard}
                                  disabled={isAnimating}
                                  title={isAnimating ? 'Animating…' : animatedCardVideoHash ? 'Re-animate' : 'Animate'}
                                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-maplestory py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400/80 hover:text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Sparkles className={`w-3 h-3 flex-shrink-0 ${isAnimating ? 'animate-pulse' : ''}`} />
                                  <span className="truncate">
                                    {isAnimating ? 'Animating…' : animatedCardVideoHash ? 'Re-animate' : 'Animate'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}


                      {/* Worth section */}
                      {(worth || isWorthLoading) && (
                        <>
                          <div className="border-t border-white/10" />
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <p className="text-[11px] text-white/35 uppercase tracking-widest font-maplestory">Meso Investment</p>
                                <p className="text-[10px] text-white/25 font-maplestory">Avg. cost to reach current state</p>
                              </div>
                              <button
                                onClick={refetchWorth}
                                disabled={isWorthLoading}
                                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                              >
                                <RefreshCw className={`w-3 h-3 text-white/40 ${isWorthLoading ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                            {worth && (
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-3 h-3 text-yellow-400" />
                                  <span className="text-[12px] text-white/50 font-maplestory">StarForce</span>
                                </div>
                                <span className="text-[12px] font-semibold text-yellow-400 font-maplestory text-right">
                                  {formatMesos(worth.starforce.averageCost)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-purple-400" />
                                  <span className="text-[12px] text-white/50 font-maplestory">Potential</span>
                                </div>
                                <span className="text-[12px] font-semibold text-purple-400 font-maplestory text-right">
                                  {formatMesos(worth.potential.averageCost)}
                                </span>

                                <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-white/5">
                                  <TrendingUp className="w-3 h-3 text-primary" />
                                  <span className="text-[12px] text-white/70 font-maplestory font-semibold">Total</span>
                                  <span className="text-base font-bold text-primary font-maplestory ml-auto">
                                    {formatMesos(worth.total.averageCost)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* Column 2 — Equipment Grid */}
                <Card className="bg-[hsl(217_33%_9%/0.97)] border-primary/15 self-start order-1 xl:order-2">
                  <CardContent className="relative overflow-hidden p-2">
                    {isEquipmentLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                    <EquipmentGrid
                      equipment={equipment}
                      onEditEquipment={(equipment) => handleOpenEquipmentForm(equipment)}
                      onAddEquipment={(slot) => handleOpenEquipmentForm(undefined, slot)}
                      onClearEquipment={onClearEquipment}
                      onOpenCalculator={() => handleTabChange("calculator")}
                      characterImage={characterImage}
                    />
                  </CardContent>
                </Card>

                {/* Column 3 — Storage */}
                <Card className="bg-[hsl(217_33%_9%/0.97)] border-primary/15 order-3">
                  <CardContent className="p-4">
                    <StoragePanel
                      characterId={characterId}
                      selectedJob={selectedJob}
                      equippedCount={equipment.length}
                    />
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* StarForce Calculator Tab */}
            <TabsContent value="calculator" className="mt-4">
              {pendingEquipment.length > 0 ? (
                <StarForceCalculator
                  characterId={characterId}
                  characterName={characterName}
                  equipment={equipment}
                  additionalEquipment={storageAsEquipment}
                  onUpdateStarforce={onUpdateStarforce}
                  onUpdateSafeguard={handleUpdateSafeguard}
                  onSaveEquipment={onSaveEquipment}
                />
              ) : (
                <Card className="bg-[hsl(217_33%_9%/0.97)] border-primary/15">
                  <CardContent className="p-12 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2 font-maplestory">No Pending StarForce Goals</h3>
                    <p className="text-sm text-muted-foreground mb-6 font-maplestory">
                      All your equipment is already at target StarForce levels!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTabChange("equipment")}
                        className="flex items-center gap-2 font-maplestory rounded-full"
                      >
                        <Target className="w-4 h-4" />
                        Manage Equipment
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTabChange("equipment")}
                        className="flex items-center gap-2 font-maplestory rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                        Add Storage Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Potential Calculator Tab */}
            <TabsContent value="potential" className="mt-4">
              <PotentialCalculator />
            </TabsContent>

            {/* Starforce Sessions Tab */}
            <TabsContent value="sessions" className="mt-4">
              <StarforceSessionTab
                characterId={characterId}
                selectedJob={selectedJob}
              />
            </TabsContent>

          </Tabs>

      {/* Equipment Form Dialog */}
      <EquipmentForm
        open={equipmentFormOpen}
        onOpenChange={setEquipmentFormOpen}
        equipment={editingEquipment}
        defaultSlot={defaultSlot}
        onSave={handleSaveEquipmentForm}
        onTransfer={(sourceEquipment, targetEquipment) => {
          // Track equipment transfer
          trackEquipmentTransfer(
            sourceEquipment.name, 
            targetEquipment.name, 
            sourceEquipment.targetStarForce || 0
          );
          
          // Handle transfer: source will be removed, target gets the stars with transfer info
          if (onTransfer) {
            onTransfer(sourceEquipment, targetEquipment);
          }
        }}
        allowSlotEdit={true}
        selectedJob={selectedJob}
        existingEquipment={allEquipment} // Pass all equipment (regular + additional) for transfer
      />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Equipment, EquipmentSlot } from "@/types";
import { StepWizard, WizardStep, StepContent } from "@/components/shared";
import { EquipmentStepLayout } from "@/components/EquipmentStepLayout";
import { ItemCarousel } from "@/components/ItemCarousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getJobIcon, getJobColors, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { useCharacter } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCharacterFromMapleRanks, Region } from "@/services/mapleRanksService";
import { apiService } from "@/services/api";
import { SLOT_TO_BACKEND_NAME } from "@/services/equipmentService";
import { User, Grid3x3, Sparkles, Search, Loader2, X } from "lucide-react";

// Equipment groupings for each step
const EQUIPMENT_STEPS = [
  {
    id: 'armor',
    title: 'Armor Set',
    slots: ['hat', 'top', 'bottom'] as EquipmentSlot[],
  },
  {
    id: 'weapon',
    title: 'Weapons',
    slots: ['weapon', 'secondary', 'emblem'] as EquipmentSlot[],
  },
  {
    id: 'face-eye',
    title: 'Face & Eye Accessories',
    slots: ['face', 'eye'] as EquipmentSlot[],
  },
  {
    id: 'jewelry',
    title: 'Jewelry',
    slots: ['earring', 'pendant1', 'pendant2', 'belt'] as EquipmentSlot[],
  },
  {
    id: 'gear',
    title: 'Gear',
    slots: ['gloves', 'shoes', 'cape', 'shoulder'] as EquipmentSlot[],
  },
  {
    id: 'rings',
    title: 'Rings',
    slots: ['ring1', 'ring2', 'ring3', 'ring4'] as EquipmentSlot[],
  },
  {
    id: 'optional',
    title: 'Optional Items',
    slots: ['heart', 'pocket', 'badge'] as EquipmentSlot[],
  }
];

const TOTAL_STEPS = 2 + EQUIPMENT_STEPS.length; // 9

export default function NewCharacter() {
  const navigate = useNavigate();
  const { createCharacter } = useCharacter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Character data
  const [characterName, setCharacterName] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Nexon API lookup state
  const [selectedRegion, setSelectedRegion] = useState<Region>('north-america');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not-found' | 'error'>('idle');
  const [fetchedCharacterImage, setFetchedCharacterImage] = useState<string | null>(null);
  const [characterLevel, setCharacterLevel] = useState(200);

  // Selected items per slot
  const [selectedItems, setSelectedItems] = useState<Record<EquipmentSlot, Equipment | null>>({} as Record<EquipmentSlot, Equipment | null>);

  // Current StarForce per slot
  const [currentStarForces, setCurrentStarForces] = useState<Record<EquipmentSlot, number>>({} as Record<EquipmentSlot, number>);

  const [enableCallingCard, setEnableCallingCard] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  const categories = Object.entries(ORGANIZED_CLASSES);

  // Wizard steps
  const wizardSteps: WizardStep[] = [
    { id: 'name', title: 'Character', icon: User },
    { id: 'job', title: 'Job Class', icon: Grid3x3 },
    ...EQUIPMENT_STEPS.map(step => ({ id: step.id, title: step.title, icon: Grid3x3 }))
  ];

  const canGoNext =
    currentStep === 1 ? characterName.trim() !== "" :
    currentStep === 2 ? selectedJob !== "" :
    true;

  // Search character on MapleRanks
  const searchCharacter = async () => {
    if (!characterName.trim()) return;
    setIsSearching(true);
    setSearchStatus('idle');
    setFetchedCharacterImage(null);
    try {
      const characterData = await fetchCharacterFromMapleRanks(characterName.trim(), selectedRegion);
      if (characterData) {
        setFetchedCharacterImage(characterData.image);
        setCharacterLevel(characterData.level);
        setSearchStatus('found');
      } else {
        setSearchStatus('not-found');
      }
    } catch {
      setSearchStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJobSelect = (job: string) => {
    setSelectedJob(job);
    setJobSearch('');
    setCurrentStep(3); // auto-advance to first equipment step
  };

  const handleSelectItem = (slot: EquipmentSlot, item: Equipment | null) => {
    setSelectedItems(prev => ({ ...prev, [slot]: item }));
    if (item) {
      const newEquipment: Equipment = {
        ...item,
        id: `${slot}-${Date.now()}`,
        slot,
        currentStarForce: currentStarForces[slot] ?? item.currentStarForce ?? 0,
        targetStarForce: item.targetStarForce ?? 0
      };
      setEquipment(prev => [...prev.filter(eq => eq.slot !== slot), newEquipment]);
    } else {
      setEquipment(prev => prev.filter(eq => eq.slot !== slot));
    }
  };

  const handleCurrentStarForceChange = (slot: EquipmentSlot, stars: number) => {
    setCurrentStarForces(prev => ({ ...prev, [slot]: stars }));
    const selectedItem = selectedItems[slot];
    if (selectedItem) {
      setEquipment(prev =>
        prev.map(eq => eq.slot === slot ? { ...eq, currentStarForce: stars } : eq)
      );
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      const created = await apiService.createCharacter({
        userId: user.id,
        name: characterName,
        job: selectedJob,
        level: characterLevel,
        enableCallingCard,
      });

      const equipmentPayload = (Object.entries(selectedItems) as [EquipmentSlot, Equipment | null][])
        .filter(([, item]) => item !== null)
        .map(([slot, item]) => ({
          equipmentSlot: SLOT_TO_BACKEND_NAME[slot] ?? slot,
          equipmentId: item!.id,
          currentStarforce: currentStarForces[slot] ?? 0,
          targetStarforce: item!.targetStarForce ?? 0,
          currentPotential: '',
          targetPotential: '',
        }));

      if (equipmentPayload.length > 0) {
        await apiService.upsertCharacterEquipment(created.id, equipmentPayload);
      }

      createCharacter({
        name: characterName,
        class: selectedJob,
        level: characterLevel,
        image: fetchedCharacterImage || './characters/maple-admin.png',
        equipment,
        starForceItems: [],
        enableCallingCard,
      }, created.id);

      toast({ title: "Character Created!", description: `${characterName} has been added to your roster.` });
      navigate('/characters');
    } catch (error: any) {
      if (error.status === 429) {
        toast({
          title: "Character Slot Full",
          description: "You can have at most 6 active characters. Deleted characters free up their slot after 1 hour.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: "Failed to create character. Please try again.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <StepWizard
          steps={wizardSteps}
          currentStep={currentStep - 1}
          onStepChange={(step) => setCurrentStep(step + 1)}
          canGoNext={canGoNext}
          nextLabel={currentStep === TOTAL_STEPS ? "Complete" : "Next"}
          onNext={async () => {
            if (currentStep === TOTAL_STEPS) {
              await handleComplete();
            }
          }}
        >
          {/* ── Step 1: Character name + lookup ── */}
          {currentStep === 1 && (
            <StepContent>
              <div className="max-w-md mx-auto">
                <Card className="bg-card/20 backdrop-blur-md border-white/20">
                  <CardContent className="p-5 sm:p-8 space-y-5">

                    {/* Sprite preview */}
                    {fetchedCharacterImage && (
                      <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <img
                          src={fetchedCharacterImage}
                          alt={characterName}
                          className="max-h-48 sm:max-h-64 object-contain drop-shadow-2xl"
                          style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(100,200,255,0.3))' }}
                          onError={(e) => { e.currentTarget.src = './characters/maple-admin.png'; }}
                        />
                      </div>
                    )}

                    {/* Name input */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-maplestory text-white">Character Name</Label>
                      <div className="flex gap-2">
                        <Input
                          id="name"
                          value={characterName}
                          onChange={(e) => { setCharacterName(e.target.value); setSearchStatus('idle'); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !isSearching) searchCharacter(); }}
                          placeholder="Enter your IGN..."
                          className="font-maplestory bg-slate-800/60 text-white border-white/20 placeholder:text-white/40 flex-1 h-10"
                        />
                        {/* Region toggle */}
                        <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-lg border border-white/20 h-10 shrink-0">
                          {(['north-america', 'europe'] as Region[]).map(r => (
                            <button
                              key={r}
                              onClick={() => setSelectedRegion(r)}
                              className={`px-2.5 h-9 rounded-md font-maplestory text-xs font-semibold transition-all ${
                                selectedRegion === r ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {r === 'north-america' ? 'US' : 'EU'}
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={searchCharacter}
                          disabled={!characterName.trim() || isSearching}
                          className="font-maplestory h-10 shrink-0"
                          variant="secondary"
                        >
                          {isSearching
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Search className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                      <p className="text-xs text-white/50 font-maplestory">
                        {searchStatus === 'found' && '✓ Found on MapleRanks — level & sprite loaded'}
                        {searchStatus === 'not-found' && 'Not found on MapleRanks — you can still continue manually'}
                        {searchStatus === 'idle' && 'Auto-lookup from MapleRanks'}
                      </p>
                    </div>

                    {/* AI Calling Card toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-sm font-medium text-white font-maplestory">AI Calling Card</p>
                          <p className="text-xs text-white/50 font-maplestory">Generate an AI image for this character</p>
                        </div>
                      </div>
                      <Switch checked={enableCallingCard} onCheckedChange={setEnableCallingCard} />
                    </div>

                  </CardContent>
                </Card>
              </div>
            </StepContent>
          )}

          {/* ── Step 2: Job selection ── */}
          {currentStep === 2 && (
            <Card className="max-w-lg mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-4 space-y-3">
                {/* Search box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search class..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {jobSearch && (
                    <button
                      onClick={() => setJobSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categorized job list */}
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  {categories.map(([categoryName, categoryData]) => {
                    const allJobs = Object.values(categoryData as Record<string, string | string[]>)
                      .flat()
                      .filter((job): job is string => typeof job === 'string' && job !== categoryName);

                    const visibleJobs = jobSearch.trim()
                      ? allJobs.filter(j => j.toLowerCase().includes(jobSearch.toLowerCase()))
                      : allJobs;

                    if (visibleJobs.length === 0) return null;

                    return (
                      <div key={categoryName}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                          {categoryName}
                        </p>
                        <div className="space-y-1">
                          {visibleJobs.map((job) => {
                            const JobIcon = getJobIcon(job);
                            const jobColors = getJobColors(job);
                            return (
                              <Button
                                key={job}
                                variant="outline"
                                className={`w-full justify-start border h-10 transition-all ${
                                  selectedJob === job
                                    ? 'border-primary/60 bg-primary/15 text-white'
                                    : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                                }`}
                                onClick={() => handleJobSelect(job)}
                              >
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center mr-3 shrink-0`}>
                                  <JobIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm">{job}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Steps 3+: Equipment ── */}
          {currentStep > 2 && currentStep <= EQUIPMENT_STEPS.length + 2 && (
            <EquipmentStepLayout equipment={equipment}>
              {(() => {
                const equipmentStep = EQUIPMENT_STEPS[currentStep - 3];
                return (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {equipmentStep.slots.map(slot => (
                        <ItemCarousel
                          key={slot}
                          slot={slot}
                          slotLabel={slot.charAt(0).toUpperCase() + slot.slice(1)}
                          selectedItem={selectedItems[slot]}
                          onSelectItem={(item) => handleSelectItem(slot, item)}
                          job={selectedJob}
                          currentStarForce={currentStarForces[slot] ?? 0}
                          onCurrentStarForceChange={(stars) => handleCurrentStarForceChange(slot, stars)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </EquipmentStepLayout>
          )}
        </StepWizard>
      </div>
    </div>
  );
}

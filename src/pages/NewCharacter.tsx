import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { WizardIntro, WizardIntroStep, StepWizard, WizardStep, StepContent } from "@/components/shared";
import { EquipmentStepLayout } from "@/components/EquipmentStepLayout";
import { ItemCarousel } from "@/components/ItemCarousel";
import { SetQuickSelect } from "@/components/SetQuickSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategorizedSelect, SelectCategory } from "@/components/shared/forms";
import { getJobIcon, getJobColors, getJobCategoryName, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { useCharacter } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { fetchCharacterFromMapleRanks, Region } from "@/services/mapleRanksService";
import { User, Target, FileText, Grid3x3, Sparkles, CheckCircle, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Equipment groupings for each step
const EQUIPMENT_STEPS = [
  {
    id: 'armor',
    title: 'Armor Set',
    slots: ['hat', 'top', 'bottom'] as EquipmentSlot[],
    sets: ['Fafnir', 'Absolab', 'Arcane Umbra', 'Eternal']
  },
  {
    id: 'weapon',
    title: 'Weapons',
    slots: ['weapon', 'secondary', 'emblem'] as EquipmentSlot[],
    sets: ['Fafnir', 'Absolab', 'Arcane Umbra', 'Genesis']
  },
  {
    id: 'face-eye',
    title: 'Face & Eye Accessories',
    slots: ['face', 'eye'] as EquipmentSlot[],
    sets: ['Sweetwater', 'Superior Gollux', 'Reinforced Gollux']
  },
  {
    id: 'jewelry',
    title: 'Jewelry',
    slots: ['earring', 'pendant1', 'pendant2', 'belt'] as EquipmentSlot[],
    sets: ['Sweetwater', 'Superior Gollux', 'Reinforced Gollux']
  },
  {
    id: 'gear',
    title: 'Gear',
    slots: ['gloves', 'shoes', 'cape', 'shoulder'] as EquipmentSlot[],
    sets: ['Fafnir', 'Absolab', 'Arcane Umbra', 'Eternal']
  },
  {
    id: 'rings',
    title: 'Rings',
    slots: ['ring1', 'ring2', 'ring3', 'ring4'] as EquipmentSlot[],
    sets: []
  },
  {
    id: 'optional',
    title: 'Optional Items',
    slots: ['heart', 'pocket', 'badge'] as EquipmentSlot[],
    sets: []
  }
];

export default function NewCharacter() {
  const navigate = useNavigate();
  const { createCharacter } = useCharacter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Character data
  const [characterName, setCharacterName] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  // Nexon API lookup state
  const [selectedRegion, setSelectedRegion] = useState<Region>('north-america');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not-found' | 'error'>('idle');
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [fetchedCharacterImage, setFetchedCharacterImage] = useState<string | null>(null);
  const [characterLevel, setCharacterLevel] = useState(200);
  
  // Selected items per slot
  const [selectedItems, setSelectedItems] = useState<Record<EquipmentSlot, Equipment | null>>({} as Record<EquipmentSlot, Equipment | null>);
  
  // Current StarForce per slot
  const [currentStarForces, setCurrentStarForces] = useState<Record<EquipmentSlot, number>>({} as Record<EquipmentSlot, number>);

  // Transform ORGANIZED_CLASSES into CategorizedSelect format
  const classCategories = useMemo((): SelectCategory[] => {
    return Object.entries(ORGANIZED_CLASSES).map(([key, category]) => ({
      name: category.name,
      options: category.classes.map(cls => ({
        value: cls,
        label: cls,
        icon: getJobIcon(cls),
        colors: getJobColors(cls),
        badges: [
          {
            text: getJobCategoryName(cls),
            className: `text-xs px-1.5 py-0.5 rounded ${getJobColors(cls).bgMuted} ${getJobColors(cls).text}`
          }
        ]
      }))
    }));
  }, []);

  // Search character on Nexon Rankings
  const searchCharacter = async () => {
    if (!characterName.trim()) {
      setSearchStatus('error');
      setSearchMessage('Please enter a character name first.');
      return;
    }

    setIsSearching(true);
    setSearchStatus('idle');
    setSearchMessage('');
    setFetchedCharacterImage(null);

    try {
      const characterData = await fetchCharacterFromMapleRanks(characterName.trim(), selectedRegion);
      
      if (characterData) {
        setFetchedCharacterImage(characterData.image);
        setCharacterLevel(characterData.level);
        
        setSearchStatus('found');
        const regionName = selectedRegion === 'north-america' ? 'NA' : 'EU';
      } else {
        setSearchStatus('not-found');
      }
    } catch (error) {
      setSearchStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Intro steps
  const introSteps: WizardIntroStep[] = [
    { icon: User, title: 'Character Info', description: 'Name and job' },
    { icon: Grid3x3, title: 'Armor Set', description: 'Hat, top, bottom' },
    { icon: Target, title: 'Weapons', description: 'Weapon, secondary' },
    { icon: Sparkles, title: 'Accessories & More', description: 'Face, jewelry, rings' }
  ];

  // Wizard steps (Step 1 = Character Info, Step 2+ = Equipment)
  const wizardSteps: WizardStep[] = [
    { id: 'info', title: 'Character Info', icon: User },
    ...EQUIPMENT_STEPS.map(step => ({
      id: step.id,
      title: step.title,
      icon: Grid3x3
    }))
  ];

  const handleSelectItem = (slot: EquipmentSlot, item: Equipment | null) => {
    setSelectedItems(prev => ({ ...prev, [slot]: item }));
    
    // Update equipment array
    if (item) {
      // Use the equipment directly from the API
      const newEquipment: Equipment = {
        ...item,
        id: `${slot}-${Date.now()}`, // Generate new ID for this instance
        slot: slot, // Ensure slot is correct
        currentStarForce: currentStarForces[slot] ?? item.currentStarForce ?? 0,
        targetStarForce: item.targetStarForce ?? 0
      };
      
      // Replace or add equipment for this slot
      setEquipment(prev => {
        const filtered = prev.filter(eq => eq.slot !== slot);
        return [...filtered, newEquipment];
      });
    } else {
      // Remove equipment for this slot
      setEquipment(prev => prev.filter(eq => eq.slot !== slot));
    }
  };

  const handleCurrentStarForceChange = (slot: EquipmentSlot, stars: number) => {
    setCurrentStarForces(prev => ({ ...prev, [slot]: stars }));
    
    // Update equipment if item is already selected
    const selectedItem = selectedItems[slot];
    if (selectedItem) {
      setEquipment(prev => 
        prev.map(eq => 
          eq.slot === slot 
            ? { ...eq, currentStarForce: stars }
            : eq
        )
      );
    }
  };

  const handleQuickSelectSet = (setName: string, slots: EquipmentSlot[]) => {
    // Quick select is more complex with API - we'd need to fetch and filter by set
    // For now, this will be a TODO
    toast({
      title: "Quick Select",
      description: "Quick select is not yet implemented with API data.",
      variant: "default"
    });
  };

  const handleClearAll = (slots: EquipmentSlot[]) => {
    slots.forEach(slot => {
      handleSelectItem(slot, null);
    });
  };

  const handleComplete = () => {
    const newCharacter: Omit<Character, 'id'> = {
      name: characterName,
      class: selectedJob,
      level: characterLevel,
      image: fetchedCharacterImage || './characters/maple-admin.png',
      equipment: equipment,
      starForceItems: []
    };
    
    // Create the character using the hook
    createCharacter(newCharacter);
    
    toast({
      title: "Character Created!",
      description: `${characterName} has been added to your roster.`,
    });
    
    navigate('/characters');
  };

  const canProceedFromInfo = characterName.trim() !== "" && selectedJob !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="max-w-7xl mx-auto">
        {/* Step 0: Introduction */}
        {currentStep === 0 && (
          <WizardIntro
            title="Create New Character"
            subtitle="Build your character step by step"
            steps={introSteps}
            onStart={() => setCurrentStep(1)}
            startButtonText="Let's Begin"
          />
        )}

        {/* Step 1+: Wizard */}
        {currentStep > 0 && (
          <StepWizard
            steps={wizardSteps}
            currentStep={currentStep - 1}
            onStepChange={(step) => setCurrentStep(step + 1)}
            canGoNext={currentStep === 1 ? canProceedFromInfo : true}
            nextLabel={currentStep === wizardSteps.length ? "Complete" : "Next"}
            onNext={() => {
              if (currentStep === wizardSteps.length) {
                handleComplete();
              }
            }}
          >
            {/* Step 1: Character Info */}
            {currentStep === 1 && (
              <StepContent>
                <div className="max-w-md mx-auto">
                  <Card className="bg-card/20 backdrop-blur-md border-white/20">
                    <CardContent className="p-8 space-y-6">
                      {/* Character Image Preview with Shadow Effect */}
                      {fetchedCharacterImage && (
                        <div className="flex flex-col items-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          {/* Character Image Container */}
                          <div className="relative">
                            {/* Character Image */}
                            <div className="relative animate-in zoom-in duration-700 delay-150 z-10">
                              <img 
                                src={fetchedCharacterImage} 
                                alt={characterName}
                                className="max-h-64 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  console.error('Failed to load character image');
                                  e.currentTarget.src = './characters/maple-admin.png';
                                }}
                                style={{
                                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(100, 200, 255, 0.3))'
                                }}
                              />
                            </div>
                            
                            {/* Animated Shadow/Glow beneath character */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-12 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                              {/* Main shadow ellipse */}
                              <div 
                                className="absolute inset-0 rounded-full blur-lg"
                                style={{
                                  background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 40%, transparent 70%)'
                                }}
                              ></div>
                              {/* Animated glow ring */}
                              <div 
                                className="absolute inset-0 rounded-full blur-2xl animate-pulse"
                                style={{
                                  background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, rgba(168, 85, 247, 0.3) 50%, transparent 70%)'
                                }}
                              ></div>
                              {/* Secondary glow with delayed animation */}
                              <div 
                                className="absolute inset-0 rounded-full blur-3xl opacity-60 animate-pulse"
                                style={{
                                  background: 'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
                                  animationDelay: '1s',
                                  animationDuration: '3s'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Character Name with Search and Region Toggle */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-maplestory text-white">Character Name</Label>
                        <div className="flex gap-2">
                          <Input
                            id="name"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isSearching) {
                                searchCharacter();
                              }
                            }}
                            placeholder="Enter your name..."
                            className="font-maplestory bg-slate-800/60 text-white border-white/20 placeholder:text-white/40 flex-1 h-10"
                          />
                          {/* Region Toggle */}
                          <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-lg border border-white/20 h-10">
                            <button
                              onClick={() => setSelectedRegion('north-america')}
                              className={`px-3 h-9 rounded-md font-maplestory text-xs font-semibold transition-all ${
                                selectedRegion === 'north-america'
                                  ? 'bg-white text-black shadow-md'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                              title="North America"
                            >
                              US
                            </button>
                            <button
                              onClick={() => setSelectedRegion('europe')}
                              className={`px-3 h-9 rounded-md font-maplestory text-xs font-semibold transition-all ${
                                selectedRegion === 'europe'
                                  ? 'bg-white text-black shadow-md'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                              title="Europe"
                            >
                              EU
                            </button>
                          </div>
                          <Button
                            onClick={searchCharacter}
                            disabled={!characterName.trim() || isSearching}
                            className="font-maplestory h-10"
                            variant="secondary"
                          >
                            {isSearching ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-white/70 font-maplestory">
                          Auto-lookup from Nexon Rankings
                        </p>
                      </div>

                      {/* Job Class Selector */}
                      <div className="space-y-2">
                        <Label htmlFor="job" className="font-maplestory text-white">Job Class</Label>
                        <CategorizedSelect
                          categories={classCategories}
                          value={selectedJob}
                          onValueChange={setSelectedJob}
                          placeholder="Select your job..."
                          className="bg-slate-800/60 border-white/20 text-white"
                          variant="dark"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </StepContent>
            )}

            {/* Step 2+: Equipment Steps */}
            {currentStep > 1 && currentStep <= EQUIPMENT_STEPS.length + 1 && (
              <EquipmentStepLayout equipment={equipment}>
                {(() => {
                  const equipmentStep = EQUIPMENT_STEPS[currentStep - 2];
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground font-maplestory mb-1">
                          {equipmentStep.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-maplestory">
                          Select equipment for: {equipmentStep.slots.join(', ')}
                        </p>
                      </div>

                      {/* Item Carousels for each slot */}
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
        )}
      </div>
    </div>
  );
}

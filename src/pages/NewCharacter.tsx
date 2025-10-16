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
import { CategorizedSelect, SelectCategory } from "@/components/shared/forms";
import { getJobIcon, getJobColors, getJobCategoryName, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { useCharacter } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { User, Target, FileText, Grid3x3, Sparkles, CheckCircle } from "lucide-react";

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
      level: 200,
      image: './characters/maple-admin.png',
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
                <div className="max-w-2xl mx-auto">
                  <Card className="bg-card/20 backdrop-blur-md border-white/20">
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-maplestory text-white">Character Name</Label>
                        <Input
                          id="name"
                          value={characterName}
                          onChange={(e) => setCharacterName(e.target.value)}
                          placeholder="Enter character name..."
                          className="font-maplestory bg-white/90 text-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="job" className="font-maplestory text-white">Job Class</Label>
                        <CategorizedSelect
                          categories={classCategories}
                          value={selectedJob}
                          onValueChange={setSelectedJob}
                          placeholder="Select your job..."
                          className="bg-white/90"
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

import { useState } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { Template } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAllTemplates, getTemplateEquipmentForJob } from "@/services/templateService";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, getJobDatabaseString, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { EquipmentForm } from "@/components/EquipmentForm";
import { 
  User, 
  Sparkles, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Wand2,
  FileText,
  AlertCircle,
  Crown,
  Target,
  Search,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";

interface CharacterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (character: Omit<Character, 'id'>) => void;
}

interface WizardData {
  // Step 1: Character Info
  name: string;
  class: string;
  level: number;
  image: string;
  
  // Step 2: Template Selection
  selectedTemplate: Template | null;
  
  // Step 3: Equipment Review
  equipment: Equipment[];
}

const WIZARD_STEPS = [
  { id: 'info', title: 'Character Info', icon: User },
  { id: 'template', title: 'Template & Equipment', icon: Sparkles },
  { id: 'complete', title: 'Complete', icon: CheckCircle },
];

export function CharacterWizard({ open, onOpenChange, onComplete }: CharacterWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // MapleRanks lookup state
  const [isSearchingMapleRanks, setIsSearchingMapleRanks] = useState(false);
  const [mapleRanksStatus, setMapleRanksStatus] = useState<'idle' | 'found' | 'not-found' | 'error'>('idle');
  const [mapleRanksMessage, setMapleRanksMessage] = useState<string>('');
  
  // Equipment Form state
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [addingToSlot, setAddingToSlot] = useState<EquipmentSlot | null>(null);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    class: '',
    level: 200,
    image: '',
    selectedTemplate: null,
    equipment: [],
  });

  // Reset wizard when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentStep(0);
      setWizardData({
        name: '',
        class: '',
        level: 200,
        image: '',
        selectedTemplate: null,
        equipment: [],
      });
      setError(null);
      setTemplates([]);
      setEquipmentFormOpen(false);
      setEditingEquipment(null);
      setAddingToSlot(null);
      setMapleRanksStatus('idle');
      setMapleRanksMessage('');
    }
    onOpenChange(newOpen);
  };

  // MapleRanks character lookup
  const searchMapleRanks = async () => {
    if (!wizardData.name.trim()) {
      setMapleRanksStatus('error');
      setMapleRanksMessage('Please enter a character name first.');
      return;
    }

    setIsSearchingMapleRanks(true);
    setMapleRanksStatus('idle');
    setMapleRanksMessage('');

    try {
      console.log(`Searching MapleRanks for character: ${wizardData.name.trim()}`);
      const characterData = await fetchCharacterFromMapleRanks(wizardData.name.trim());
      
      if (characterData) {
        // Found character data - update wizard
        setWizardData(prev => ({
          ...prev,
          class: characterData.class || prev.class,
          level: characterData.level || prev.level,
          image: characterData.image || prev.image,
        }));
        
        setMapleRanksStatus('found');
        setMapleRanksMessage(`Found ${characterData.class} (Lv.${characterData.level}) on MapleRanks!`);
      } else {
        setMapleRanksStatus('not-found');
        setMapleRanksMessage('Character not found on MapleRanks. Please enter class and level manually.');
      }
    } catch (error) {
      console.error('MapleRanks search failed:', error);
      setMapleRanksStatus('error');
      setMapleRanksMessage('MapleRanks lookup failed. Feature is in beta - please enter details manually.');
    } finally {
      setIsSearchingMapleRanks(false);
    }
  };

  // Load templates when user selects a class
  const loadTemplates = async (jobClass: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const templateData = await getAllTemplates();
      const sortedTemplates = templateData.sort((a, b) => a.id - b.id);
      setTemplates(sortedTemplates);
    } catch (err) {
      setError('Failed to load templates. You can still create a character without a template.');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load equipment from selected template
  const loadTemplateEquipment = async (template: Template) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const jobDbString = getJobDatabaseString(wizardData.class);
      const equipment = await getTemplateEquipmentForJob(template.id, jobDbString);
      
      setWizardData(prev => ({
        ...prev,
        selectedTemplate: template,
        equipment: equipment,
      }));
    } catch (err) {
      setError('Failed to load template equipment. You can add equipment manually later.');
      setWizardData(prev => ({
        ...prev,
        selectedTemplate: template,
        equipment: [],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate between steps
  const goToStep = (step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
      setError(null);
    }
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      // Load templates when moving from step 1 to step 2
      if (currentStep === 0 && wizardData.class) {
        loadTemplates(wizardData.class);
      }
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError(null);
    }
  };

  // Validation for each step
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Character Info
        return wizardData.name.trim() && wizardData.class && wizardData.level >= 1;
      case 1: // Template & Equipment
        return true; // Optional step
      case 2: // Complete
        return true;
      default:
        return false;
    }
  };

  // Complete wizard
  const handleComplete = () => {
    const character: Omit<Character, 'id'> = {
      name: wizardData.name.trim(),
      class: wizardData.class,
      level: wizardData.level,
      equipment: wizardData.equipment,
      starForceItems: [],
      image: wizardData.image, // Use MapleRanks image if found
    };
    
    onComplete(character);
    handleOpenChange(false);
  };

  // Equipment handlers
  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setAddingToSlot(null);
    setEquipmentFormOpen(true);
  };

  const handleAddEquipment = (slot: EquipmentSlot) => {
    setEditingEquipment(null);
    setAddingToSlot(slot);
    setEquipmentFormOpen(true);
  };

  const handleClearEquipment = (slot: EquipmentSlot) => {
    setWizardData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(eq => eq.slot !== slot),
    }));
  };

  const handleSaveEquipment = (equipmentData: Omit<Equipment, 'id'> | Equipment) => {
    if ('id' in equipmentData) {
      // Editing existing equipment
      setWizardData(prev => ({
        ...prev,
        equipment: prev.equipment.map(eq => 
          eq.id === equipmentData.id ? equipmentData as Equipment : eq
        ),
      }));
    } else {
      // Adding new equipment
      const newEquipment: Equipment = {
        ...equipmentData,
        id: `eq-${Date.now()}`,
      };
      setWizardData(prev => ({
        ...prev,
        equipment: [...prev.equipment.filter(eq => eq.slot !== newEquipment.slot), newEquipment],
      }));
    }
    
    setEquipmentFormOpen(false);
    setEditingEquipment(null);
    setAddingToSlot(null);
  };

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-maplestory">
            <Wand2 className="w-5 h-5 text-primary" />
            Create New Character
          </DialogTitle>
          <DialogDescription className="font-maplestory">
            Follow the steps below to set up your character with the perfect equipment template
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-1 pb-4">
          <div className="flex items-center justify-between mb-2">
            {WIZARD_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                      isCompleted 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : isActive 
                        ? 'border-primary text-primary' 
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium font-maplestory ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  {index < WIZARD_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-4" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Character Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center pb-4">
                <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold font-maplestory">Character Information</h3>
                <p className="text-sm text-muted-foreground font-maplestory">
                  Tell us about your MapleStory character
                </p>
              </div>

              {/* Character Image Display (when found on MapleRanks) */}
              {mapleRanksStatus === 'found' && wizardData.image ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  {/* Character Portrait Section */}
                  <div className="lg:col-span-1 flex flex-col items-center space-y-4">
                    <div className="relative">
                      <img 
                        src={wizardData.image} 
                        alt={`${wizardData.name} character portrait`}
                        className="w-40 h-40 rounded-xl border-4 border-green-300 dark:border-green-700 object-cover shadow-xl"
                        onError={(e) => {
                          // Hide the entire container if image fails to load
                          const container = e.currentTarget.parentElement?.parentElement?.parentElement?.parentElement;
                          if (container) container.style.display = 'none';
                        }}
                      />
                      <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-3 border-white dark:border-gray-800 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Character Info Display */}
                    <div className="text-center space-y-2">
                      <h4 className="text-lg font-bold text-foreground font-maplestory">{wizardData.name}</h4>
                      {wizardData.class && (
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const JobIcon = getJobIcon(wizardData.class);
                            const jobColors = getJobColors(wizardData.class);
                            return (
                              <>
                                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                  <JobIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-medium font-maplestory">{wizardData.class}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground font-maplestory">Level {wizardData.level}</p>
                      <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400 font-maplestory">
                        ✓ Found on MapleRanks
                      </div>
                    </div>
                  </div>

                  {/* Form Fields Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="character-name" className="font-maplestory">Character Name</Label>
                        <div className="flex gap-2">
                          <Input
                            id="character-name"
                            placeholder="Enter your character name"
                            value={wizardData.name}
                            onChange={(e) => {
                              setWizardData(prev => ({ ...prev, name: e.target.value }));
                              // Reset MapleRanks status when name changes
                              setMapleRanksStatus('idle');
                              setMapleRanksMessage('');
                            }}
                            className="h-12 font-maplestory"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                searchMapleRanks();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={searchMapleRanks}
                            disabled={!wizardData.name.trim() || isSearchingMapleRanks}
                            className="h-12 px-4"
                          >
                            {isSearchingMapleRanks ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="character-level" className="font-maplestory">Level</Label>
                          <Input
                            id="character-level"
                            type="number"
                            min="1"
                            max="300"
                            value={wizardData.level}
                            onChange={(e) => setWizardData(prev => ({ ...prev, level: parseInt(e.target.value) || 200 }))}
                            className="h-12 font-maplestory"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="character-class" className="font-maplestory">Job Class</Label>
                          <Select 
                            value={wizardData.class} 
                            onValueChange={(value) => setWizardData(prev => ({ ...prev, class: value }))}
                          >
                            <SelectTrigger className="h-12 font-maplestory">
                              <SelectValue placeholder="Select your job class">
                                {wizardData.class && (
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const JobIcon = getJobIcon(wizardData.class);
                                      const jobColors = getJobColors(wizardData.class);
                                      const jobCategory = getJobCategoryName(wizardData.class);
                                      const classSubcategory = getClassSubcategory(wizardData.class);
                                      
                                      return (
                                        <>
                                          <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                            <JobIcon className="w-3 h-3 text-white" />
                                          </div>
                                          <span className="font-maplestory">{wizardData.class}</span>
                                          {jobCategory && classSubcategory && (
                                            <div className="flex gap-1">
                                              <span className={`text-xs px-2 py-1 rounded ${jobColors.bgMuted} ${jobColors.text} font-maplestory`}>
                                                {jobCategory}
                                              </span>
                                              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-maplestory">
                                                {classSubcategory}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Object.entries(ORGANIZED_CLASSES).map(([category, categoryData]) => (
                                <div key={category}>
                                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b font-maplestory">
                                    {categoryData.name}
                                  </div>
                                  {categoryData.classes.map((jobClass) => {
                                    const JobIcon = getJobIcon(jobClass);
                                    const jobColors = getJobColors(jobClass);
                                    return (
                                      <SelectItem key={jobClass} value={jobClass}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                            <JobIcon className="w-2.5 h-2.5 text-white" />
                                          </div>
                                          <span className="font-maplestory">{jobClass}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* MapleRanks Status Messages */}
                    {(mapleRanksStatus === 'not-found' || mapleRanksStatus === 'error') && (
                      <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
                        mapleRanksStatus === 'not-found'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                        : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {mapleRanksStatus === 'not-found' && <XCircle className="w-4 h-4" />}
                        {mapleRanksStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                        <span className="font-maplestory">{mapleRanksMessage}</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground font-maplestory">
                      💡 You can update the character details or search for a different character
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="character-name" className="font-maplestory">Character Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="character-name"
                        placeholder="Enter your character name"
                        value={wizardData.name}
                        onChange={(e) => {
                          setWizardData(prev => ({ ...prev, name: e.target.value }));
                          // Reset MapleRanks status when name changes
                          setMapleRanksStatus('idle');
                          setMapleRanksMessage('');
                        }}
                        className="h-12 font-maplestory"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            searchMapleRanks();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={searchMapleRanks}
                        disabled={!wizardData.name.trim() || isSearchingMapleRanks}
                        className="h-12 px-4"
                      >
                        {isSearchingMapleRanks ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* MapleRanks Status Messages */}
                    {mapleRanksStatus !== 'idle' && (
                      <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
                        mapleRanksStatus === 'found' 
                          ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                          : mapleRanksStatus === 'not-found'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {mapleRanksStatus === 'found' && <CheckCircle2 className="w-4 h-4" />}
                        {mapleRanksStatus === 'not-found' && <XCircle className="w-4 h-4" />}
                        {mapleRanksStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                        <span className="font-maplestory">{mapleRanksMessage}</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground font-maplestory">
                      💡 Click search to auto-fill character data from MapleRanks (beta feature)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="character-level" className="font-maplestory">Level</Label>
                    <Input
                      id="character-level"
                      type="number"
                      min="1"
                      max="300"
                      value={wizardData.level}
                      onChange={(e) => setWizardData(prev => ({ ...prev, level: parseInt(e.target.value) || 200 }))}
                      className="h-12 font-maplestory"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="character-class" className="font-maplestory">Job Class</Label>
                    <Select 
                      value={wizardData.class} 
                      onValueChange={(value) => setWizardData(prev => ({ ...prev, class: value }))}
                    >
                      <SelectTrigger className="h-12 font-maplestory">
                        <SelectValue placeholder="Select your job class">
                          {wizardData.class && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const JobIcon = getJobIcon(wizardData.class);
                                const jobColors = getJobColors(wizardData.class);
                                const jobCategory = getJobCategoryName(wizardData.class);
                                const classSubcategory = getClassSubcategory(wizardData.class);
                                
                                return (
                                  <>
                                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                      <JobIcon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="font-maplestory">{wizardData.class}</span>
                                    {jobCategory && classSubcategory && (
                                      <div className="flex gap-1">
                                        <span className={`text-xs px-2 py-1 rounded ${jobColors.bgMuted} ${jobColors.text} font-maplestory`}>
                                          {jobCategory}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-maplestory">
                                          {classSubcategory}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(ORGANIZED_CLASSES).map(([category, categoryData]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b font-maplestory">
                              {categoryData.name}
                            </div>
                            {categoryData.classes.map((jobClass) => {
                              const JobIcon = getJobIcon(jobClass);
                              const jobColors = getJobColors(jobClass);
                              return (
                                <SelectItem key={jobClass} value={jobClass}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                      <JobIcon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="font-maplestory">{jobClass}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template Selection + Equipment Preview */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center pb-4">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold font-maplestory">Choose Template & Review Equipment</h3>
                <p className="text-sm text-muted-foreground font-maplestory">
                  Select a template to see equipment preview, or start fresh and add your own gear
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Template Selection */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="font-medium text-foreground font-maplestory">Equipment Template</h4>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground font-maplestory">Loading templates...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {/* Empty Template Option */}
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          wizardData.selectedTemplate === null 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setWizardData(prev => ({ ...prev, selectedTemplate: null, equipment: [] }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Target className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-sm font-maplestory">Start Fresh</h5>
                              <p className="text-xs text-muted-foreground font-maplestory">
                                Begin with no equipment
                              </p>
                            </div>
                            {wizardData.selectedTemplate === null && (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Template Options */}
                      {templates.map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            wizardData.selectedTemplate?.id === template.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => loadTemplateEquipment(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-blue-500 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-sm font-maplestory">{template.name}</h5>
                                  <Badge variant="outline" className="text-xs px-1 py-0 font-maplestory">
                                    Template
                                  </Badge>
                                </div>
                                {template.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 font-maplestory">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                              {wizardData.selectedTemplate?.id === template.id && (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Equipment Preview */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground font-maplestory">Equipment Preview</h4>
                    {wizardData.equipment.length > 0 && (
                      <Badge variant="outline" className="text-xs font-maplestory">
                        {wizardData.equipment.length} items
                      </Badge>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/20 min-h-[500px]">
                    {wizardData.equipment.length > 0 ? (
                      <EquipmentGrid
                        equipment={wizardData.equipment}
                        onEditEquipment={handleEditEquipment}
                        onAddEquipment={handleAddEquipment}
                        onClearEquipment={handleClearEquipment}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[450px] text-center text-muted-foreground">
                        <Target className="w-12 h-12 mb-3" />
                        <h5 className="font-medium mb-2 font-maplestory">No Equipment Selected</h5>
                        <p className="text-sm max-w-xs font-maplestory">
                          {wizardData.selectedTemplate 
                            ? "Loading template equipment..." 
                            : "Choose a template to see equipment, or start fresh and add your own gear"
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {wizardData.equipment.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center font-maplestory">
                      💡 Click any equipment slot to edit details or add new items
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 2 && (
            <div className="space-y-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold font-maplestory">Character Ready!</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-maplestory">
                Your character <strong>{wizardData.name}</strong> ({wizardData.class}) has been configured with{' '}
                {wizardData.equipment.length} equipment item{wizardData.equipment.length !== 1 ? 's' : ''}.
              </p>
              
              {/* Template Info */}
              {wizardData.selectedTemplate && (
                <div className="bg-muted/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground font-maplestory">
                    Template: <strong>{wizardData.selectedTemplate.name}</strong>
                  </p>
                </div>
              )}

              {/* MapleRanks Status */}
              {mapleRanksStatus === 'found' && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md mx-auto dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium font-maplestory">MapleRanks Data Found</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-500 mt-1 font-maplestory">
                    Character data was automatically loaded from MapleRanks
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1 font-maplestory">
                <p>✓ Character data {mapleRanksStatus === 'found' ? 'imported from MapleRanks' : 'entered manually'}</p>
                <p>✓ You can start planning StarForce upgrades immediately</p>
                <p>✓ All data is saved locally and can be exported/shared</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <Separator />
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 font-maplestory"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground font-maplestory">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </div>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-2 font-maplestory"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 font-maplestory"
            >
              <CheckCircle className="w-4 h-4" />
              Create Character
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Equipment Form Dialog */}
      <EquipmentForm
        equipment={editingEquipment}
        open={equipmentFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEquipmentFormOpen(false);
            setEditingEquipment(null);
            setAddingToSlot(null);
          }
        }}
        onSave={handleSaveEquipment}
        defaultSlot={addingToSlot}
        selectedJob={wizardData.class}
        allowSlotEdit={!editingEquipment}
      />
    </Dialog>
  );
}

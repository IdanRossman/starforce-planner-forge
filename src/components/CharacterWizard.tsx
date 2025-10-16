import { useState, useEffect, useMemo } from "react";
import { Character, Equipment, EquipmentSlot } from "@/types";
import { Template } from "@/services/api";
import { getAllTemplates, getTemplateEquipmentForJob } from "@/services/templateService";
import { fetchCharacterFromMapleRanks, Region } from "@/services/mapleRanksService";
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, getJobDatabaseString, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { MapleDialog, MapleButton } from "@/components/shared";
import { CategorizedSelect, SelectCategory, MapleInput, WizardStep, WizardFieldset, StatusMessage } from "@/components/shared/forms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Sparkles, 
  CheckCircle,
  Search,
  Loader2,
  Crown,
  Target
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
  const [selectedRegion, setSelectedRegion] = useState<Region>('north-america');
  const [fetchedCharacterImage, setFetchedCharacterImage] = useState<string | null>(null);
  
  // Animation states for MapleDialog
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('translateY(-20px)');
  
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    class: '',
    level: 200,
    image: './characters/maple-admin.png', // Default character image
    selectedTemplate: null,
    equipment: [],
  });

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

  // Handle animation state when open changes
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => {
        setOpacity(1);
        setTransform('translateY(0px)');
      }, 50);
    } else if (isVisible) {
      setOpacity(0);
      setTransform('translateY(-20px)');
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [open, isVisible]);

  // Reset wizard when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset wizard state
      setCurrentStep(0);
      setWizardData({
        name: '',
        class: '',
        level: 200,
        image: '/characters/maple-admin.png', // Reset to default character image
        selectedTemplate: null,
        equipment: [],
      });
      setError(null);
      setTemplates([]);
      setMapleRanksStatus('idle');
      setMapleRanksMessage('');
      setFetchedCharacterImage(null);
      setSelectedRegion('north-america');
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
    setFetchedCharacterImage(null);

    try {
      const characterData = await fetchCharacterFromMapleRanks(wizardData.name.trim(), selectedRegion);
      
      if (characterData) {
        // Store the fetched image
        setFetchedCharacterImage(characterData.image);
        
        setWizardData(prev => ({
          ...prev,
          class: characterData.class || prev.class,
          level: characterData.level || prev.level,
          image: characterData.image || prev.image,
        }));
        
        setMapleRanksStatus('found');
        const regionName = selectedRegion === 'north-america' ? 'NA' : 'EU';
        setMapleRanksMessage(`Found Lv.${characterData.level} character on ${regionName} rankings!`);
      } else {
        setMapleRanksStatus('not-found');
        setMapleRanksMessage('Character not found. Please check the name and region, or enter details manually.');
      }
    } catch (error) {
      setMapleRanksStatus('error');
      setMapleRanksMessage('Ranking lookup failed. Please enter details manually.');
    } finally {
      setIsSearchingMapleRanks(false);
    }
  };

  // Load templates when moving to step 2
  const loadTemplates = async () => {
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
      
      console.log('🎯 Template equipment loaded:', {
        templateId: template.id,
        jobDbString,
        equipmentCount: equipment.length,
        equipment: equipment.map(eq => ({ id: eq.id, name: eq.name, slot: eq.slot }))
      });
      
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

  // Navigation functions
  const handleNext = () => {
    if (currentStep === 0) {
      // Validate step 1 data
      if (!wizardData.name.trim() || !wizardData.class) {
        setError('Please fill in all required fields before continuing.');
        return;
      }
      loadTemplates();
    }
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleComplete = () => {
    const newCharacter: Omit<Character, 'id'> = {
      name: wizardData.name,
      class: wizardData.class,
      level: wizardData.level,
      image: wizardData.image,
      equipment: wizardData.equipment,
    };
    
    console.log('🚀 Character wizard completing with:', {
      name: newCharacter.name,
      equipmentCount: newCharacter.equipment.length,
      equipment: newCharacter.equipment.map(eq => ({ id: eq.id, name: eq.name, slot: eq.slot }))
    });
    
    onComplete(newCharacter);
    handleOpenChange(false);
  };

  // Determine next button text and handler
  const getNextButtonProps = () => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      return {
        text: 'Accept',
        onClick: handleComplete,
        disabled: false,
        variant: 'orange' as const
      };
    }
    return {
      text: 'Next',
      onClick: handleNext,
      disabled: currentStep === 0 && (!wizardData.name.trim() || !wizardData.class),
      variant: 'green' as const
    };
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <WizardStep 
            title="Character Information"
            subtitle="Enter your character's basic details"
          >
            <WizardFieldset legend="Character Details">
              <div className="space-y-2">
                <label className="text-black font-maplestory font-medium text-sm">Region</label>
                <Select
                  value={selectedRegion}
                  onValueChange={(value: Region) => setSelectedRegion(value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 font-maplestory">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north-america" className="font-maplestory">North America</SelectItem>
                    <SelectItem value="europe" className="font-maplestory">Europe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <MapleInput
                title="Character Name"
                placeholder="Enter character name"
                value={wizardData.name}
                onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                searchButton={{
                  icon: <Search className="h-3 w-3" />,
                  onClick: searchMapleRanks,
                  disabled: !wizardData.name.trim() || isSearchingMapleRanks,
                  title: "Search on Nexon Rankings",
                  variant: "orange"
                }}
                isLoading={isSearchingMapleRanks}
                underText={
                  <span className="flex items-center gap-1">
                    Auto-lookup from Nexon Rankings
                  </span>
                }
              />
              
              {mapleRanksStatus !== 'idle' && (
                <StatusMessage type={
                  mapleRanksStatus === 'found' ? 'success' : 
                  mapleRanksStatus === 'not-found' ? 'warning' : 'error'
                }>
                  {mapleRanksMessage}
                </StatusMessage>
              )}

              {fetchedCharacterImage && (
                <div className="space-y-2">
                  <label className="text-black font-maplestory font-medium text-sm">Character Image</label>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4 flex justify-center">
                    <img 
                      src={fetchedCharacterImage} 
                      alt={wizardData.name}
                      className="max-h-48 object-contain"
                      onError={(e) => {
                        console.error('Failed to load character image');
                        e.currentTarget.src = './characters/maple-admin.png';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-black font-maplestory font-medium text-sm">Class</label>
                <CategorizedSelect
                  value={wizardData.class}
                  onValueChange={(value) => setWizardData(prev => ({ ...prev, class: value }))}
                  placeholder="Select a class"
                  categories={classCategories}
                  className="bg-white border-gray-300 font-maplestory"
                />
              </div>

              <MapleInput
                title="Level"
                type="number"
                placeholder="200"
                value={wizardData.level.toString()}
                onChange={(e) => setWizardData(prev => ({ ...prev, level: parseInt(e.target.value) || 200 }))}
              />
            </WizardFieldset>
          </WizardStep>
        );

      case 1:
        return (
          <WizardStep 
            title="Equipment Template"
            subtitle="Choose a template to automatically populate equipment"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm font-maplestory">Loading templates...</span>
              </div>
            ) : (
              <WizardFieldset legend="Available Templates">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <div
                    className={`p-3 border rounded-md cursor-pointer transition-colors font-maplestory ${
                      !wizardData.selectedTemplate ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setWizardData(prev => ({ ...prev, selectedTemplate: null, equipment: [] }))}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-black" />
                      <span className="font-medium text-black">No Template</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Start with no equipment - add items manually later</p>
                  </div>
                  
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors font-maplestory ${
                        wizardData.selectedTemplate?.id === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => loadTemplateEquipment(template)}
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-black" />
                        <span className="font-medium text-black">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
                
                {wizardData.selectedTemplate && (
                  <StatusMessage type="success">
                    Selected template: {wizardData.selectedTemplate.name} with {wizardData.equipment.length} equipment items
                  </StatusMessage>
                )}
              </WizardFieldset>
            )}
          </WizardStep>
        );

      case 2:
        return (
          <WizardStep 
            title="Ready to Create!"
            subtitle="Review your character and create when ready"
          >
            <WizardFieldset legend="Character Summary">
              <div className="space-y-2 text-sm font-maplestory text-black">
                <div><strong>Name:</strong> {wizardData.name}</div>
                <div><strong>Class:</strong> {wizardData.class}</div>
                <div><strong>Level:</strong> {wizardData.level}</div>
                <div><strong>Template:</strong> {wizardData.selectedTemplate?.name || 'None'}</div>
                <div><strong>Equipment Items:</strong> {wizardData.equipment.length}</div>
              </div>
              
              <StatusMessage type="success">
                Your character is ready to be created! You can add more equipment and manage StarForce enhancement after creation.
              </StatusMessage>
            </WizardFieldset>
          </WizardStep>
        );

      default:
        return null;
    }
  };

  const nextButtonProps = getNextButtonProps();

  return (
    <MapleDialog
      isVisible={isVisible}
      opacity={opacity}
      transform={transform}
      position="center"
      minWidth="600px"
      className="max-w-4xl"
      wizardMode={true}
      wizardStep={{
        current: currentStep + 1,
        total: WIZARD_STEPS.length
      }}
      onNext={nextButtonProps.onClick}
      onBack={currentStep > 0 ? handleBack : undefined}
      nextButtonText={nextButtonProps.text}
      nextButtonDisabled={nextButtonProps.disabled || isLoading}
      nextButtonVariant={nextButtonProps.variant}
      backButtonDisabled={isLoading}
      character={{
        name: wizardData.name || 'Maple Admin',
        image: wizardData.image
      }}
      bottomLeftActions={
        <MapleButton 
          variant="green" 
          size="sm" 
          onClick={() => handleOpenChange(false)}
        >
          END CHAT
        </MapleButton>
      }
    >
      <div className="w-full">
        {error && (
          <StatusMessage type="error" className="mb-4">
            {error}
          </StatusMessage>
        )}
        
        {renderStepContent()}
      </div>
    </MapleDialog>
  );
}

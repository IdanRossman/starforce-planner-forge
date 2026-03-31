import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Equipment, EquipmentSlot } from "@/types";
import { Template } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { QuickStarForceTable } from "@/components/QuickStarForceTable";
import { EquipmentForm } from "@/components/EquipmentForm";
import { getAllTemplates, getTemplateEquipmentForJob } from "@/services/templateService";
import { fetchCharacterFromMapleRanks } from "@/services/mapleRanksService";
import { apiService } from "@/services/api";
import { SLOT_TO_BACKEND_NAME } from "@/services/equipmentService";
import { getJobIcon, getJobColors, getJobDatabaseString, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { useAuth } from "@/contexts/AuthContext";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Target,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Calculator,
  Search,
  X,
  UserPlus,
  Loader2,
  Save,
  Sparkles
} from "lucide-react";

interface QuickPlanningProps {
  onNavigateHome?: () => void;
}

export function QuickPlanning({ onNavigateHome }: QuickPlanningProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCharacter } = useCharacterContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("empty");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingTemplateEquipment, setIsLoadingTemplateEquipment] = useState(false);
  const [showTemplateConfirmDialog, setShowTemplateConfirmDialog] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string>("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [starForceItems, setStarForceItems] = useState<Equipment[]>([]);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<EquipmentSlot | null>(null);

  // Save as character
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [charName, setCharName] = useState('');
  const [charLevel, setCharLevel] = useState(200);
  const [charImage, setCharImage] = useState('');
  const [enableCallingCard, setEnableCallingCard] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupNotFound, setLookupNotFound] = useState(false);

  const [jobSearch, setJobSearch] = useState('');

  const categories = Object.entries(ORGANIZED_CLASSES);
  
  // Clear state on mount
  useEffect(() => {
    setEquipment([]);
    setStarForceItems([]);
    setSelectedJob("");
    setSelectedTemplate("empty");
    setCurrentStep(1);
  }, []);

  // Update starforce items when equipment changes
  useEffect(() => {
    const incompleteEquipment = equipment.filter(eq => 
      eq.starforceable && eq.currentStarForce < eq.targetStarForce
    );
    setStarForceItems(incompleteEquipment);
  }, [equipment]);

  // Load templates when job is selected
  const loadTemplates = async (job?: string) => {
    const jobToUse = job || selectedJob;
    if (!jobToUse) return;
    
    setIsLoadingTemplates(true);
    try {
      const allTemplates = await getAllTemplates();
      // Sort templates by ID in ascending order
      const sortedTemplates = allTemplates.sort((a, b) => a.id - b.id);
      setTemplates(sortedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load template equipment
  const loadTemplateEquipment = async (templateId: number) => {
    if (!selectedJob) return;
    
    setIsLoadingTemplateEquipment(true);
    try {
      const jobDbString = getJobDatabaseString(selectedJob);
      const templateEquipment = await getTemplateEquipmentForJob(templateId, jobDbString);
      setEquipment(templateEquipment);
    } catch (error) {
      console.error('Failed to load template equipment:', error);
    } finally {
      setIsLoadingTemplateEquipment(false);
    }
  };

  // Wizard navigation
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleJobSelect = (job: string) => {
    setSelectedJob(job);
    loadTemplates(job);
    goToNextStep();
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "empty") {
      setSelectedTemplate("empty");
      setEquipment([]);
      goToNextStep();
      return;
    }
    
    if (equipment.length > 0) {
      setPendingTemplateId(templateId);
      setShowTemplateConfirmDialog(true);
    } else {
      setSelectedTemplate(templateId);
      const templateIdNum = parseInt(templateId);
      loadTemplateEquipment(templateIdNum);
      goToNextStep();
    }
  };

  const confirmTemplateLoad = async () => {
    setShowTemplateConfirmDialog(false);
    setSelectedTemplate(pendingTemplateId);
    const templateId = parseInt(pendingTemplateId);
    await loadTemplateEquipment(templateId);
    setPendingTemplateId("");
    goToNextStep();
  };

  const cancelTemplateLoad = () => {
    setShowTemplateConfirmDialog(false);
    setPendingTemplateId("");
  };

  const handleEditEquipment = (equipmentToEdit: Equipment) => {
    setEditingEquipment(equipmentToEdit);
    setDefaultSlot(null);
    setIsEquipmentFormOpen(true);
  };

  const handleAddEquipment = (slot?: EquipmentSlot) => {
    setEditingEquipment(null);
    setDefaultSlot(slot || null);
    setIsEquipmentFormOpen(true);
  };

  const handleSaveEquipment = (savedEquipment: Equipment) => {
    if (editingEquipment) {
      setEquipment(prev => prev.map(eq => 
        eq.slot === savedEquipment.slot ? savedEquipment : eq
      ));
    } else {
      setEquipment(prev => [...prev.filter(eq => eq.slot !== savedEquipment.slot), savedEquipment]);
    }
    setIsEquipmentFormOpen(false);
    setEditingEquipment(null);
    setDefaultSlot(null);
  };

  const handleDeleteEquipment = (slot: EquipmentSlot) => {
    setEquipment(prev => prev.filter(eq => eq.slot !== slot));
  };

  const handleNameBlur = async () => {
    if (!charName.trim()) return;
    setIsLookingUp(true);
    setLookupNotFound(false);
    try {
      const data = await fetchCharacterFromMapleRanks(charName.trim());
      if (data) {
        setCharLevel(data.level);
        setCharImage(data.image);
        setLookupNotFound(false);
      } else {
        setLookupNotFound(true);
      }
    } catch {
      setLookupNotFound(true);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSaveCharacter = async () => {
    if (!charName.trim() || !user) return;
    setIsSaving(true);
    try {
      const created = await apiService.createCharacter({
        userId: user.id,
        name: charName.trim(),
        job: selectedJob,
        level: charLevel,
        enableCallingCard,
      });

      const equipmentPayload = equipment.map(eq => ({
        equipmentSlot: SLOT_TO_BACKEND_NAME[eq.slot] ?? eq.slot,
        equipmentId: eq.id,
        currentStarforce: eq.currentStarForce ?? 0,
        targetStarforce: eq.targetStarForce ?? 0,
        currentPotential: eq.currentPotentialValue ?? '',
        targetPotential: eq.targetPotentialValue ?? '',
      }));

      if (equipmentPayload.length > 0) {
        await apiService.upsertCharacterEquipment(created.id, equipmentPayload);
      }

      addCharacter({
        name: charName.trim(),
        class: selectedJob,
        level: charLevel,
        image: charImage || undefined,
        equipment,
        enableCallingCard,
      }, created.id);

      toast.success(`${charName} saved to your characters!`);
      setShowSaveDialog(false);
      navigate('/characters');
    } catch {
      toast.error('Failed to save character. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Animation variants for step transitions
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className={`px-3 sm:px-6 ${currentStep === 3 ? 'py-4 sm:py-6 overflow-y-auto h-[calc(100vh-6rem)]' : 'h-[calc(100vh-12rem)] flex items-center justify-center'}`}>
      <div className={`w-full max-w-7xl ${currentStep === 3 ? 'mx-auto' : ''}`}>
      {/* Wizard Progress Indicator with Navigation */}
      <div className="flex items-center justify-between mb-3">
          {/* Back Button - hidden on step 1 */}
          <div className="w-[72px]">
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousStep}
                className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                  ${currentStep === step ? 'bg-primary text-primary-foreground scale-110' : 
                    currentStep > step ? 'bg-primary/50 text-primary-foreground' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 transition-all ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Next/Finish Button - Hidden on step 3 */}
          <div className="w-[100px]">
            {currentStep < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextStep}
                disabled={currentStep === 1 && !selectedJob}
                className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

      {/* Animated Step Content */}
      <AnimatePresence mode="wait" custom={currentStep}>
        <motion.div
          key={currentStep}
          custom={currentStep}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >

          {/* Step 1: Job Selection */}
          {currentStep === 1 && (
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

                {/* Full categorized list */}
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
                                className="w-full justify-start border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm text-left h-10 transition-all"
                                onClick={() => { setJobSearch(''); handleJobSelect(job); }}
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

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <Card className="max-w-lg mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Choose a starting point</p>

                {/* Start from Scratch — distinct dashed style */}
                <button
                  onClick={() => handleTemplateSelect("empty")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Grid3x3 className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Start from Scratch</p>
                    <p className="text-xs text-muted-foreground">Empty setup — add items manually</p>
                  </div>
                </button>

                {/* Template list */}
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id.toString())}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary/40 to-blue-500/40 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Equipment Grid & Calculations */}
          {currentStep === 3 && (
            <Card className="max-w-[1400px] mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-2 sm:p-8">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{selectedJob}</span>
                    <Badge variant="outline" className="text-xs bg-primary/10">{equipment.length} items</Badge>
                  </div>
                  {user && (
                    <Button
                      size="sm"
                      onClick={() => setShowSaveDialog(true)}
                      className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs"
                      variant="outline"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Save as Character
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <Target className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg text-white">Equipment Grid</h3>
                    </div>
                    <EquipmentGrid
                      equipment={equipment}
                      onEditEquipment={handleEditEquipment}
                      onAddEquipment={handleAddEquipment}
                      onClearEquipment={handleDeleteEquipment}
                      characterImage={charImage || undefined}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg text-white">StarForce Calculations</h3>
                    </div>
                    <QuickStarForceTable equipment={starForceItems} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Equipment Form Modal */}
      <EquipmentForm
        open={isEquipmentFormOpen}
        onOpenChange={setIsEquipmentFormOpen}
        equipment={editingEquipment}
        defaultSlot={defaultSlot}
        onSave={handleSaveEquipment}
        allowSlotEdit={!editingEquipment}
        selectedJob={selectedJob}
      />

      {/* Save as Character Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Save as Character
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter your character name to look up their level and sprite from MapleRanks.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {/* Character name + lookup */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Character Name</label>
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter IGN..."
                  value={charName}
                  onChange={(e) => { setCharName(e.target.value); setLookupNotFound(false); setCharImage(''); }}
                  onBlur={handleNameBlur}
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {isLookingUp && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
              </div>
              {lookupNotFound && (
                <p className="text-xs text-amber-500">Not found on MapleRanks — you can still save manually.</p>
              )}
            </div>

            {/* Preview row */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              {charImage ? (
                <img src={charImage} alt={charName} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{charName || '—'}</p>
                <p className="text-xs text-muted-foreground">{selectedJob} · Lv.{charLevel}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{equipment.length} items</Badge>
            </div>

            {/* AI Calling Card toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium font-maplestory">AI Calling Card</p>
                  <p className="text-xs text-muted-foreground font-maplestory">Generate an AI image for this character</p>
                </div>
              </div>
              <Switch checked={enableCallingCard} onCheckedChange={setEnableCallingCard} />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowSaveDialog(false); setCharName(''); setCharImage(''); setLookupNotFound(false); setEnableCallingCard(false); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveCharacter}
              disabled={!charName.trim() || isSaving}
              className="flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Save Character'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Confirmation Dialog */}
      <AlertDialog open={showTemplateConfirmDialog} onOpenChange={setShowTemplateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Replace Current Equipment?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You currently have <strong>{equipment.length} equipment item{equipment.length !== 1 ? 's' : ''}</strong> configured. 
                Loading this template will replace all current equipment.
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTemplateLoad}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTemplateLoad}>
              Yes, Replace Equipment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

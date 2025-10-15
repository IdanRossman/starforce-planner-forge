import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot } from "@/types";
import { Template } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { QuickStarForceTable } from "@/components/QuickStarForceTable";
import { EquipmentForm } from "@/components/EquipmentForm";
import { getAllTemplates, getTemplateEquipmentForJob } from "@/services/templateService";
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, getJobDatabaseString, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { 
  Target,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  ArrowRight,
  Calculator
} from "lucide-react";

interface QuickPlanningProps {
  onNavigateHome?: () => void;
}

export function QuickPlanning({ onNavigateHome }: QuickPlanningProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [categoryDirection, setCategoryDirection] = useState(0);
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

  const categories = Object.entries(ORGANIZED_CLASSES);
  
  // Navigation handlers with direction tracking
  const goToPreviousCategory = () => {
    setCategoryDirection(-1);
    setCategoryIndex(prev => Math.max(0, prev - 1));
  };
  
  const goToNextCategory = () => {
    setCategoryDirection(1);
    setCategoryIndex(prev => Math.min(categories.length - 1, prev + 1));
  };

  // Clear state on mount
  useEffect(() => {
    setEquipment([]);
    setStarForceItems([]);
    setSelectedJob("");
    setSelectedTemplate("empty");
    setCurrentStep(0);
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
    <div className={`px-6 ${currentStep === 3 ? 'py-6 overflow-y-auto h-[calc(100vh-6rem)]' : 'h-[calc(100vh-12rem)] flex items-center justify-center'}`}>
      <div className={`w-full max-w-7xl ${currentStep === 3 ? 'mx-auto' : ''}`}>
      {/* Wizard Progress Indicator with Navigation - Only show when past intro */}
      {currentStep > 0 && (
        <div className="flex items-center justify-between mb-3">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousStep}
            className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

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
                  <div className={`w-12 h-1 mx-2 transition-all ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
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
                className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

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
          {/* Step 0: Introduction */}
          {currentStep === 0 && (
            <Card className="max-w-4xl mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-12 text-center space-y-10">
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-white">Quick Planning Wizard</h2>
                  <p className="text-muted-foreground text-lg">
                    Plan your character's progression in 3 simple steps
                  </p>
                </div>

                {/* Workflow Steps */}
                <div className="flex items-center justify-center gap-6 max-w-3xl mx-auto">
                  {/* Step 1 */}
                  <div className="flex-1 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mx-auto">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Select Job</h3>
                      <p className="text-muted-foreground text-sm">Choose your class</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-8 h-8 text-white/50 flex-shrink-0 mt-6" />

                  {/* Step 2 */}
                  <div className="flex-1 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Select Template</h3>
                      <p className="text-muted-foreground text-sm">Preset or clean slate</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-8 h-8 text-white/50 flex-shrink-0 mt-6" />

                  {/* Step 3 */}
                  <div className="flex-1 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center mx-auto">
                      <Grid3x3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">View & Adjust</h3>
                      <p className="text-muted-foreground text-sm">SF calculations</p>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all"
                  onClick={goToNextStep}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Job Selection */}
          {currentStep === 1 && (
            <Card className="max-w-7xl mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                {/* Category Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousCategory}
                    disabled={categoryIndex === 0}
                    className="h-10 w-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  
                  <div className="flex-1 text-center px-4">
                    {/* Rotating category list */}
                    <div className="flex items-center justify-center gap-2 text-base text-muted-foreground flex-wrap">
                      {categories.map((cat, idx) => (
                        <>
                          <span 
                            key={cat[0]}
                            className={`transition-all cursor-pointer hover:text-primary whitespace-nowrap ${
                              idx === categoryIndex ? 'font-bold shiny-golden-text' : ''
                            }`}
                            onClick={() => {
                              setCategoryDirection(idx > categoryIndex ? 1 : -1);
                              setCategoryIndex(idx);
                            }}
                          >
                            {cat[0]}
                          </span>
                          {idx < categories.length - 1 && (
                            <div key={`dot-${idx}`} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                          )}
                        </>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextCategory}
                    disabled={categoryIndex === categories.length - 1}
                    className="h-10 w-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>

                {/* Current Category Jobs with slide animation */}
                <AnimatePresence mode="wait" custom={categoryDirection}>
                  <motion.div
                    key={categoryIndex}
                    custom={categoryDirection}
                    initial={{ x: categoryDirection > 0 ? -300 : 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: categoryDirection > 0 ? 300 : -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin max-w-md mx-auto"
                  >
                    {Object.entries(categories[categoryIndex][1]).map(([subCategory, jobList]) => {
                      const jobs = Array.isArray(jobList) ? jobList : [jobList];
                      // Filter out jobs that match the category name (e.g., "Explorers")
                      const filteredJobs = jobs.filter(job => job !== categories[categoryIndex][0]);
                      
                      return (
                        <div key={subCategory} className="space-y-2">
                          {filteredJobs.map((job) => {
                            const JobIcon = getJobIcon(job);
                            const jobColors = getJobColors(job);
                            
                            return (
                              <Button
                                key={job}
                                variant="outline"
                                className="w-full justify-start border-2 border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm text-left h-12 transition-all"
                                onClick={() => handleJobSelect(job)}
                              >
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center mr-3 flex-shrink-0`}>
                                  <JobIcon className="w-3 h-3 text-white" />
                                </div>
                                <span>{job}</span>
                              </Button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <Card className="max-w-4xl mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Choose a Template</CardTitle>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Start with a pre-configured setup or build from scratch
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4 max-w-2xl mx-auto max-h-[400px] overflow-y-auto scrollbar-thin">
                  {/* Empty Template Option */}
                  <Card 
                    className="cursor-pointer border-2 border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all"
                    onClick={() => handleTemplateSelect("empty")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
                          <Grid3x3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">Start from Scratch</h3>
                          <p className="text-sm text-muted-foreground">Build your equipment setup manually</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Template Options */}
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <Card 
                        key={template.id}
                        className="cursor-pointer border-2 border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all"
                        onClick={() => handleTemplateSelect(template.id.toString())}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-blue-500 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-white">{template.name}</h3>
                              {template.description && (
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              )}
                            </div>
                            <Badge variant="secondary">Template</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Equipment Grid & Calculations */}
          {currentStep === 3 && (
            <Card className="max-w-[1400px] mx-auto bg-card/20 backdrop-blur-md border-white/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Equipment Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg text-white">Equipment Grid</h3>
                        <Badge variant="outline" className="text-xs bg-primary/10">
                          {equipment.length} items
                        </Badge>
                      </div>
                      <EquipmentGrid 
                        equipment={equipment}
                        onEditEquipment={handleEditEquipment}
                        onAddEquipment={handleAddEquipment}
                        onClearEquipment={handleDeleteEquipment}
                      />
                    </div>

                    {/* StarForce Calculations */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Calculator className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg text-white">StarForce Calculations</h3>
                      </div>
                      <QuickStarForceTable equipment={starForceItems} />
                    </div>
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

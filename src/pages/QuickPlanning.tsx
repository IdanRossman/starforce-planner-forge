import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot } from "@/types";
import { Template } from "@/services/api";
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
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Users,
  Target,
  Coins,
  ArrowLeft,
  Home,
  FileText,
  AlertTriangle
} from "lucide-react";

interface QuickPlanningProps {
  onNavigateHome?: () => void;
  onNavigateToOverview?: () => void;
}

export function QuickPlanning({ onNavigateHome, onNavigateToOverview }: QuickPlanningProps) {
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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Clear equipment on component mount (page navigation)
  useEffect(() => {
    setEquipment([]);
    setStarForceItems([]);
    setSelectedJob("");
    setSelectedTemplate("empty");
  }, []);

  // Handle job selection changes
  useEffect(() => {
    if (selectedJob) {
      // Clear equipment when job changes
      setEquipment([]);
      setStarForceItems([]);
      setSelectedTemplate("empty");
      loadTemplates();
    } else {
      setTemplates([]);
      setSelectedTemplate("empty");
    }
  }, [selectedJob]);

  // Update starforce items when equipment changes (auto-calculation)
  useEffect(() => {
    const incompleteEquipment = equipment.filter(eq => 
      eq.starforceable && eq.currentStarForce < eq.targetStarForce
    );
    console.log(`Equipment changed: ${equipment.length} total, ${incompleteEquipment.length} pending starforce`);
    setStarForceItems(incompleteEquipment);
  }, [equipment]);

  // Smart image preloading when equipment changes
  useEffect(() => {
    if (equipment.length > 0) {
      // Get all equipment images that need to be loaded
      const imageUrls = equipment
        .map(eq => eq.image)
        .filter(Boolean) as string[];
      
      // Preload images that haven't been loaded yet
      imageUrls.forEach(imageUrl => {
        if (!loadedImages.has(imageUrl)) {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, imageUrl]));
          };
          img.onerror = () => {
            console.warn(`Failed to load equipment image: ${imageUrl}`);
          };
          img.src = imageUrl;
        }
      });
    }
  }, [equipment, loadedImages]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templateData = await getAllTemplates();
      // Sort templates by ID (chronological order of game stages)
      const sortedTemplates = templateData.sort((a, b) => a.id - b.id);
      setTemplates(sortedTemplates);
      console.log('Loaded and sorted templates by ID:', sortedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadTemplateEquipment = async (templateId: number) => {
    if (!selectedJob) return;
    
    setIsLoadingTemplateEquipment(true);
    try {
      const jobDbString = getJobDatabaseString(selectedJob);
      console.log(`Loading template ${templateId} for job: ${jobDbString}`);
      
      const templateEquipment = await getTemplateEquipmentForJob(templateId, jobDbString);
      
      // Clear current equipment and set new template equipment
      console.log(`Replacing ${equipment.length} current items with ${templateEquipment.length} template items`);
      setEquipment(templateEquipment);
      
      console.log(`Successfully loaded template ${templateId} with ${templateEquipment.length} equipment items`);
    } catch (error) {
      console.error('Failed to load template equipment:', error);
    } finally {
      setIsLoadingTemplateEquipment(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "empty") {
      setSelectedTemplate("empty");
      // Clear equipment when empty template is selected
      setEquipment([]);
      return;
    }
    
    // If equipment exists, show confirmation dialog
    if (equipment.length > 0) {
      setPendingTemplateId(templateId);
      setShowTemplateConfirmDialog(true);
    } else {
      // No equipment exists, load template directly
      setSelectedTemplate(templateId);
      const templateIdNum = parseInt(templateId);
      loadTemplateEquipment(templateIdNum);
    }
  };

  const confirmTemplateLoad = async () => {
    setShowTemplateConfirmDialog(false);
    setSelectedTemplate(pendingTemplateId);
    
    const templateId = parseInt(pendingTemplateId);
    await loadTemplateEquipment(templateId);
    setPendingTemplateId("");
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

  const handleAddEquipment = (slot: EquipmentSlot) => {
    setEditingEquipment(null);
    setDefaultSlot(slot);
    setIsEquipmentFormOpen(true);
  };

  const handleClearEquipment = (slot: EquipmentSlot) => {
    setEquipment(prev => prev.filter(eq => eq.slot !== slot));
  };

  const handleSaveEquipment = (equipmentData: Equipment) => {
    if (editingEquipment) {
      setEquipment(prev => {
        const updated = prev.map(eq => eq.id === editingEquipment.id ? equipmentData : eq);
        return updated;
      });
    } else {
      setEquipment(prev => {
        const filtered = prev.filter(eq => eq.slot !== equipmentData.slot);
        const newEquipment = [...filtered, equipmentData];
        return newEquipment;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section with Navigation */}
      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {onNavigateHome && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onNavigateHome}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Quick StarForce Planning
                    <Badge variant="secondary" className="text-xs">No signup required</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a job class and customize your equipment setup
                  </p>
                </div>
              </div>
            </div>
            {onNavigateToOverview && (
              <Button 
                onClick={onNavigateToOverview}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Users className="w-4 h-4 mr-2" />
                Characters
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Job Selector and Template Selection - Combined */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  Setup Your Build
                  <Badge variant="outline" className="text-sm bg-primary/10 border-primary/30">
                    Step 1
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-2">
                  Choose your job class and starting template
                </p>
              </div>
            </div>
            
            {/* Job Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Job Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">1</span>
                  Select Job Class
                </h3>
                <Select 
                  value={selectedJob} 
                  onValueChange={(value) => {
                    setSelectedJob(value);
                  }}
                >
                  <SelectTrigger className="w-full h-14 text-lg border-primary/30 bg-background/80 backdrop-blur-sm">
                    <SelectValue placeholder="Select a job class">
                      {selectedJob && (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const JobIcon = getJobIcon(selectedJob);
                            const jobColors = getJobColors(selectedJob);
                            const jobCategory = getJobCategoryName(selectedJob);
                            const classSubcategory = getClassSubcategory(selectedJob);
                            
                            return (
                              <>
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                  <JobIcon className="w-3 h-3 text-white" />
                                </div>
                                <span>{selectedJob}</span>
                                {jobCategory && classSubcategory && (
                                  <div className="flex gap-1">
                                    <span className={`text-xs px-2 py-1 rounded ${jobColors.bgMuted} ${jobColors.text}`}>
                                      {jobCategory}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
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
                  <SelectContent>
                    {Object.entries(ORGANIZED_CLASSES).map(([key, category]) => (
                      <div key={key}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 border-b">
                          {category.name}
                        </div>
                        {category.classes.map((cls) => {
                          const ClassIcon = getJobIcon(cls);
                          const classColors = getJobColors(cls);
                          const classCategory = getJobCategoryName(cls);
                          
                          return (
                            <SelectItem key={cls} value={cls} className="pl-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${classColors.bg} flex items-center justify-center`}>
                                  <ClassIcon className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="flex-1">{cls}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${classColors.bgMuted} ${classColors.text}`}>
                                  {classCategory}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full ${selectedJob ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'} text-sm font-bold flex items-center justify-center`}>2</span>
                  Choose Template
                </h3>
                <Select 
                  value={selectedTemplate} 
                  onValueChange={handleTemplateSelect}
                  disabled={!selectedJob || isLoadingTemplates || isLoadingTemplateEquipment}
                >
                  <SelectTrigger className={`w-full h-14 text-lg ${selectedJob ? 'border-secondary/30' : 'border-muted'} bg-background/80 backdrop-blur-sm ${!selectedJob ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder={selectedJob ? "Choose a template" : "Select job class first"}>
                      {selectedTemplate && (
                        <div className="flex items-center gap-2">
                          {selectedTemplate === "empty" ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                                <Target className="w-3 h-3 text-white" />
                              </div>
                              <span>Empty Template</span>
                              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                Custom Build
                              </span>
                            </>
                          ) : (
                            (() => {
                              const template = templates.find(t => t.id.toString() === selectedTemplate);
                              return template ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-secondary to-blue-500 flex items-center justify-center">
                                    <FileText className="w-3 h-3 text-white" />
                                  </div>
                                  <span>{template.name}</span>
                                  <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary">
                                    Template
                                  </span>
                                </>
                              ) : null;
                            })()
                          )}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                          <Target className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="flex-1">Empty Template</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Custom
                        </span>
                      </div>
                    </SelectItem>
                    {isLoadingTemplates ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"></div>
                          <span>Loading templates...</span>
                        </div>
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex flex-col gap-1 py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-secondary to-blue-500 flex items-center justify-center">
                                <FileText className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className="flex-1 font-medium">{template.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                                Template
                              </span>
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground ml-6 max-w-xs">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Loading State */}
                {isLoadingTemplateEquipment && (
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"></div>
                    <span className="text-sm">Loading template equipment...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Equipment Grid and Calculation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Equipment Grid */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Equipment Grid
              <Badge variant="outline" className="text-xs bg-secondary/50">
                Step 2
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedJob 
                ? `Click any equipment slot to see ${selectedJob}-specific equipment options`
                : "Complete setup above to enable equipment customization"
              }
            </p>
          </CardHeader>
          <CardContent className="p-6 overflow-hidden">
            <div className="w-full flex justify-center relative">
              {!selectedJob && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-muted">
                  <div className="text-center space-y-2">
                    <Target className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Select a job class to unlock equipment grid
                    </p>
                  </div>
                </div>
              )}
              <EquipmentGrid
                equipment={equipment}
                onEditEquipment={selectedJob ? handleEditEquipment : () => {}}
                onAddEquipment={selectedJob ? handleAddEquipment : () => {}}
                onClearEquipment={selectedJob ? handleClearEquipment : () => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* StarForce Calculation Table */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Live Calculations
              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30">
                Step 3
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Automatic cost calculations update as you make changes
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <QuickStarForceTable equipment={starForceItems} />
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Ready for More?</h3>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This is just a taste of what StarForce Planner can do! Create characters, save your equipment, 
              track progress across multiple builds, and access advanced planning features.
            </p>
            <div className="flex gap-4 justify-center items-center">
              {onNavigateToOverview && (
                <Button 
                  onClick={onNavigateToOverview}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Characters
                </Button>
              )}
              {onNavigateHome && (
                <Button 
                  onClick={onNavigateHome}
                  variant="outline"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Home
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                Loading this template will replace all current equipment with the template's pre-configured setup.
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTemplateLoad}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTemplateLoad}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              Yes, Replace Equipment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

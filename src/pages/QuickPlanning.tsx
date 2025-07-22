import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { QuickStarForceTable } from "@/components/QuickStarForceTable";
import { EquipmentForm } from "@/components/EquipmentForm";
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, getJobDatabaseString, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Users,
  Target,
  Coins,
  ArrowLeft,
  Home
} from "lucide-react";

interface QuickPlanningProps {
  onNavigateHome?: () => void;
  onNavigateToOverview?: () => void;
}

export function QuickPlanning({ onNavigateHome, onNavigateToOverview }: QuickPlanningProps) {
  const [selectedJob, setSelectedJob] = useState<string>("");
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
  }, []);

  // Handle job selection changes
  useEffect(() => {
    if (selectedJob) {
      // Clear equipment when job changes
      setEquipment([]);
      setStarForceItems([]);
    }
  }, [selectedJob]);

  // Update starforce items when equipment changes (auto-calculation)
  useEffect(() => {
    const incompleteEquipment = equipment.filter(eq => 
      eq.starforceable && eq.currentStarForce < eq.targetStarForce
    );
    setStarForceItems(incompleteEquipment);
  }, [equipment]);

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

  // Calculate some quick stats
  const totalEquipment = equipment.length;
  const incompleteEquipment = equipment.filter(eq => 
    eq.starforceable && eq.currentStarForce < eq.targetStarForce
  ).length;
  const completionRate = totalEquipment > 0 ? 
    ((totalEquipment - incompleteEquipment) / totalEquipment * 100) : 0;

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

      {/* Job Selector - Primary Focus */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  Choose Your Job Class
                  <Badge variant="outline" className="text-sm bg-primary/10 border-primary/30">
                    Step 1
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-2">
                  Select your character's job to fetch appropriate equipment
                </p>
              </div>
            </div>
            
            {/* Job Selector */}
            <div className="max-w-md mx-auto">
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
          </div>
          
          {/* Equipment Stats */}
          {selectedJob && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 max-w-lg mx-auto">
              <div className="bg-background/40 backdrop-blur-sm rounded-md p-2 border border-primary/15 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Equipment</span>
                </div>
                <p className="text-base font-bold text-foreground">{totalEquipment}</p>
              </div>
              
              <div className="bg-background/40 backdrop-blur-sm rounded-md p-2 border border-primary/15 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Calculator className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Pending</span>
                </div>
                <p className="text-base font-bold text-foreground">{incompleteEquipment}</p>
              </div>
              
              <div className="bg-background/40 backdrop-blur-sm rounded-md p-2 border border-primary/15 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Progress</span>
                </div>
                <p className="text-base font-bold text-foreground">{Math.round(completionRate)}%</p>
              </div>
            </div>
          )}
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
              <Badge variant="outline" className="text-xs bg-secondary/50">Step 2: Customize</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedJob 
                ? `Click any equipment slot to see ${selectedJob}-specific equipment options`
                : "Select a job class above, then click any equipment slot to customize"
              }
            </p>
          </CardHeader>
          <CardContent className="p-6 overflow-hidden">
            <div className="w-full flex justify-center relative">
              <EquipmentGrid
                equipment={equipment}
                onEditEquipment={handleEditEquipment}
                onAddEquipment={handleAddEquipment}
                onClearEquipment={handleClearEquipment}
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
              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30">Step 3: Results</Badge>
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
    </div>
  );
}

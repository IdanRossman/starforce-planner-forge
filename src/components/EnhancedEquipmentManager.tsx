import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot, StorageItem } from "@/types";
import { StoragePanel } from "@/components/StoragePanel";
import { useCharacterContext } from "@/hooks/useCharacterContext";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  additionalEquipment?: Equipment[]; // StarForce items beyond standard slots
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  onDeleteAdditionalEquipment?: (equipmentId: string) => void;
  characterId?: string; // For per-character localStorage
  characterName?: string; // Fallback for characters without ID
  characterImage?: string;
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
  characterImage
}: EnhancedEquipmentManagerProps) {
  const { isEquipmentLoading, selectedCharacter } = useCharacterContext();
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<EquipmentSlot | null>(null);
  const [activeTab, setActiveTab] = useState("equipment");

  // Use the potential hook
  const { getPotentialSummary } = usePotential();

  // Handle tab switching with analytics tracking
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      trackTabSwitch(activeTab, newTab);
      setActiveTab(newTab);
    }
  };

  // Convert storage items to Equipment shape for calculator/potential tabs
  const storageItems = selectedCharacter?.storageItems ?? [];
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
  const completedEquipment = starforceableEquipment.filter(eq => eq.currentStarForce >= eq.targetStarForce);
  const potentialEquipment = allEquipment.filter(eq => 
    eq.currentPotentialValue || eq.targetPotentialValue
  );
  const completionRate = starforceableEquipment.length > 0 
    ? Math.round((completedEquipment.length / starforceableEquipment.length) * 100)
    : 0;

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
        <TabsList className="grid w-full grid-cols-4 h-11 bg-white/5 backdrop-blur-md border border-border/50 p-1 gap-1 rounded-xl">
          <TabsTrigger 
            value="equipment" 
            className="flex items-center gap-2 font-maplestory data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Package className="w-4 h-4" />
            <span>Equipment</span>
          </TabsTrigger>
              <TabsTrigger 
                value="calculator" 
                className="flex items-center gap-2 font-maplestory data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculator</span>
                {pendingEquipment.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0 min-w-[20px] h-5 font-maplestory">
                    {pendingEquipment.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="potential" 
                className="flex items-center gap-2 font-maplestory data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Zap className="w-4 h-4" />
                <span>Potential</span>
                <Badge variant="secondary" className="ml-1 rounded-full bg-purple-500 text-white text-[10px] px-1.5 py-0 h-4 font-bold">
                  NEW
                </Badge>
                {potentialEquipment.filter(eq => eq.targetPotentialValue && eq.targetPotentialValue !== eq.currentPotentialValue).length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0 min-w-[20px] h-5 font-maplestory">
                    {potentialEquipment.filter(eq => eq.targetPotentialValue && eq.targetPotentialValue !== eq.currentPotentialValue).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Equipment Setup Tab */}
            <TabsContent value="equipment" className="mt-4">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {/* Equipment Grid - Left Side */}
                <Card className="xl:col-span-2 bg-white/5 backdrop-blur-md border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-maplestory text-base">
                      <Target className="w-4 h-4 text-primary" />
                      Equipment Slots
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
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

                {/* Storage Panel - Right Side */}
                <Card className="xl:col-span-3 bg-white/5 backdrop-blur-md border-border/50">
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
                <Card className="bg-white/5 backdrop-blur-md border-border/50">
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

import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { EquipmentImage } from "@/components/EquipmentImage";
import { EquipmentForm } from "@/components/EquipmentForm";
import { StarForceCalculator } from "@/components/StarForceCalculator";
import { StarForceOptimizer } from "@/components/StarForceOptimizer";
import { 
  trackEquipmentAdded, 
  trackStarForceCalculation, 
  trackStarForceCompletion, 
  trackTabSwitch, 
  trackEquipmentTransfer 
} from "@/lib/analytics";
import { 
  Target, 
  Calculator, 
  Sparkles, 
  Edit, 
  Trash2, 
  Plus,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
  Package,
  X,
  Minus,
  ChevronUp,
  ChevronDown,
  DollarSign,
  ArrowRightLeft
} from "lucide-react";

interface EnhancedEquipmentManagerProps {
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onAddEquipment: (slot: EquipmentSlot) => void;
  onClearEquipment: (slot: EquipmentSlot) => void;
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
  onTransfer?: (sourceEquipment: Equipment, targetEquipment: Equipment) => void;
  selectedJob?: string;
  additionalEquipment?: Equipment[]; // StarForce items beyond standard slots
  onSaveAdditionalEquipment?: (equipment: Equipment) => void;
  onDeleteAdditionalEquipment?: (equipmentId: string) => void;
  characterId?: string; // For per-character localStorage
  characterName?: string; // Fallback for characters without ID
}

type FilterType = "all" | "pending" | "completed" | "starforceable";

export function EnhancedEquipmentManager({
  equipment,
  onEditEquipment,
  onAddEquipment,
  onClearEquipment,
  onUpdateStarforce,
  onUpdateActualCost,
  onSaveEquipment,
  onTransfer,
  selectedJob,
  additionalEquipment = [],
  onSaveAdditionalEquipment,
  onDeleteAdditionalEquipment,
  characterId,
  characterName
}: EnhancedEquipmentManagerProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<EquipmentSlot | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("equipment");

  // Handle tab switching with analytics tracking
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      trackTabSwitch(activeTab, newTab);
      setActiveTab(newTab);
    }
  };

  // Calculate stats including additional equipment
  const allEquipment = [...equipment, ...additionalEquipment];
  const starforceableEquipment = allEquipment.filter(eq => eq.starforceable);
  const pendingEquipment = starforceableEquipment.filter(eq => eq.currentStarForce < eq.targetStarForce);
  const completedEquipment = starforceableEquipment.filter(eq => eq.currentStarForce >= eq.targetStarForce);
  const completionRate = starforceableEquipment.length > 0 
    ? Math.round((completedEquipment.length / starforceableEquipment.length) * 100)
    : 0;

  // Track calculator usage when switching to calculator tab with pending equipment
  useEffect(() => {
    if (activeTab === "calculator" && pendingEquipment.length > 0) {
      trackStarForceCalculation(pendingEquipment.length);
    }
  }, [activeTab, pendingEquipment.length]);

  // Filter equipment based on selected filter
  const getFilteredEquipment = () => {
    switch (filter) {
      case "pending":
        return pendingEquipment;
      case "completed":
        return completedEquipment;
      case "starforceable":
        return starforceableEquipment;
      default:
        return allEquipment;
    }
  };

  const handleStartEdit = (equipment: Equipment) => {
    setEditingStarforce(equipment.id);
    setTempValues({
      current: equipment.currentStarForce || 0,
      target: equipment.targetStarForce || 0
    });
  };

  const handleSaveEdit = (equipment: Equipment) => {
    if (onUpdateStarforce) {
      onUpdateStarforce(equipment.id, tempValues.current, tempValues.target);
    }
    setEditingStarforce(null);
  };

  const handleCancelEdit = () => {
    setEditingStarforce(null);
    setTempValues({ current: 0, target: 0 });
  };

  const handleQuickAdjust = (equipment: Equipment, type: 'current' | 'target', delta: number) => {
    if (!onUpdateStarforce) return;
    
    const current = equipment.currentStarForce || 0;
    const target = equipment.targetStarForce || 0;
    
    if (type === 'current') {
      const newCurrent = Math.max(0, Math.min(25, current + delta));
      onUpdateStarforce(equipment.id, newCurrent, target);
    } else {
      const newTarget = Math.max(0, Math.min(25, target + delta));
      onUpdateStarforce(equipment.id, current, newTarget);
    }
  };

  const handleCompleteStarforce = (equipment: Equipment) => {
    if (!onUpdateStarforce || !equipment.starforceable) return;
    
    const target = equipment.targetStarForce || 0;
    onUpdateStarforce(equipment.id, target, target);
    
    // Track StarForce completion
    trackStarForceCompletion(equipment.name, target);
  };

  const handleAddAdditionalEquipment = () => {
    setEditingEquipment(null);
    setDefaultSlot(null);
    setEquipmentFormOpen(true);
  };

  const isAdditionalEquipment = (item: Equipment) => {
    return additionalEquipment.some(eq => eq.id === item.id);
  };

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
    // If we're editing an existing piece of equipment, check if it was originally additional
    const isEditingAdditional = editingEquipment && isAdditionalEquipment(editingEquipment);
    
    // If we're adding new equipment without a slot, or editing existing additional equipment
    const isAdditional = !equipment.slot || isEditingAdditional;
    
    // Track equipment addition (only for new equipment, not edits)
    if (!editingEquipment) {
      trackEquipmentAdded(equipment.slot || 'additional', equipment.name);
    }
    
    if (isAdditional && onSaveAdditionalEquipment) {
      onSaveAdditionalEquipment(equipment);
    } else if (onSaveEquipment) {
      onSaveEquipment(equipment);
    }
    handleCloseEquipmentForm();
  };

  const handleUpdateSafeguard = (equipmentId: string, safeguard: boolean) => {
    // Find the equipment and update its safeguard setting
    const allEquipment = [...equipment, ...additionalEquipment];
    const targetEquipment = allEquipment.find(eq => eq.id === equipmentId);
    
    if (targetEquipment) {
      const updatedEquipment = { ...targetEquipment, safeguard };
      
      // Check if it's additional equipment or main equipment
      const isAdditional = isAdditionalEquipment(targetEquipment);
      
      if (isAdditional && onSaveAdditionalEquipment) {
        onSaveAdditionalEquipment(updatedEquipment);
      } else if (onSaveEquipment) {
        onSaveEquipment(updatedEquipment);
      }
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

  return (
    <div className="space-y-6">
      {/* Main Content with Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 border border-border/50">
              <TabsTrigger value="equipment" className="flex items-center gap-2 font-maplestory relative overflow-hidden group border-r border-border/50 data-[state=active]:border-blue-300 data-[state=active]:bg-blue-50/50">
                {/* Animated highlight background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-indigo-400/40 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent animate-pulse" />
                
                {/* Tab content */}
                <div className="relative flex items-center gap-2">
                  <Package className="w-4 h-4 animate-pulse text-blue-600" />
                  <span className="text-blue-700 font-medium">Equipment Setup</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="calculator" className="flex items-center gap-2 font-maplestory relative overflow-hidden group border-r border-border/50 data-[state=active]:border-green-300 data-[state=active]:bg-green-50/50">
                {/* Animated highlight background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 via-emerald-400/40 to-green-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/15 to-transparent animate-pulse" />
                
                {/* Tab content */}
                <div className="relative flex items-center gap-2">
                  <Calculator className="w-4 h-4 animate-pulse text-green-600" />
                  <span className="text-green-700 font-medium">StarForce Calculator</span>
                  {pendingEquipment.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-400 font-maplestory">
                      {pendingEquipment.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="optimizer" className="flex items-center gap-2 font-maplestory relative overflow-hidden group data-[state=active]:border-orange-300 data-[state=active]:bg-gray-900/20">
                {/* Animated highlight background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800/40 via-gray-700/50 to-gray-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent animate-pulse" />
                
                {/* Tab content */}
                <div className="relative flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse text-orange-600" />
                  <span className="flex items-center gap-1.5">
                    <span className="text-orange-700 font-medium">Smart Planner</span>
                    {/* "NEW" indicator positioned to the side */}
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full animate-bounce">
                      NEW
                    </span>
                  </span>
                  {pendingEquipment.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-600 border-orange-500/30 font-maplestory">
                      BETA
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Equipment Setup Tab */}
            <TabsContent value="equipment" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Equipment Grid - Left Side */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-maplestory">
                      <Target className="w-5 h-5 text-primary" />
                      Equipment Slots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EquipmentGrid
                      equipment={equipment}
                      onEditEquipment={(equipment) => handleOpenEquipmentForm(equipment)}
                      onAddEquipment={(slot) => handleOpenEquipmentForm(undefined, slot)}
                      onClearEquipment={onClearEquipment}
                      onOpenCalculator={() => handleTabChange("calculator")}
                    />
                  </CardContent>
                </Card>

                {/* Equipment Table - Right Side */}
                <Card className="xl:col-span-3">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 font-maplestory">
                        <Package className="w-5 h-5 text-primary" />
                        Equipment Details
                      </CardTitle>
                      
                      <div className="flex items-center gap-4">
                        {/* Add Additional Equipment Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddAdditionalEquipment}
                          className="flex items-center gap-2 font-maplestory"
                        >
                          <Plus className="w-4 h-4" />
                          Add Item
                        </Button>
                        
                        {/* Filter Tabs */}
                        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="w-auto">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all" className="text-xs font-maplestory">All ({allEquipment.length})</TabsTrigger>
                            <TabsTrigger value="starforceable" className="text-xs font-maplestory">SF ({starforceableEquipment.length})</TabsTrigger>
                            <TabsTrigger value="pending" className="text-xs font-maplestory">Pending ({pendingEquipment.length})</TabsTrigger>
                            <TabsTrigger value="completed" className="text-xs font-maplestory">Done ({completedEquipment.length})</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredEquipment().length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2 font-maplestory">No Equipment Found</h3>
                        <p className="text-muted-foreground mb-4 font-maplestory">
                          {filter === "all" 
                            ? "Click on equipment slots to add new items"
                            : `No ${filter} equipment found`
                          }
                        </p>
                        {filter !== "all" && (
                          <Button variant="outline" onClick={() => setFilter("all")} className="font-maplestory">
                            View All Equipment
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[750px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10 border-b">
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead className="font-maplestory">Item</TableHead>
                              <TableHead className="text-center font-maplestory">Current SF</TableHead>
                              <TableHead className="text-center font-maplestory">Target SF</TableHead>
                              <TableHead className="text-center font-maplestory">Status</TableHead>
                              <TableHead className="text-center font-maplestory">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getFilteredEquipment().map((item) => (
                              <TableRow 
                                key={item.id}
                                onMouseEnter={() => setHoveredRow(item.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className="group"
                              >
                                <TableCell>
                                  <EquipmentImage
                                    src={item.image}
                                    alt={item.name}
                                    size="md"
                                    maxRetries={2}
                                    showFallback={true}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium flex items-center gap-2 font-maplestory">
                                      {item.name}
                                      {isAdditionalEquipment(item) && (
                                        <Badge variant="secondary" className="text-xs font-maplestory">Additional</Badge>
                                      )}
                                      {item.transferredFrom && (
                                        <Badge variant="outline" className="text-xs font-maplestory bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                          <ArrowRightLeft className="w-3 h-3 mr-1" />
                                          Transferred
                                        </Badge>
                                      )}
                                      {item.isTransferSource && (
                                        <Badge variant="outline" className="text-xs font-maplestory bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                                          <ArrowRightLeft className="w-3 h-3 mr-1" />
                                          Source (will be destroyed)
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground font-maplestory">
                                      {item.slot || 'No Slot'}
                                      {item.transferredFrom && item.transferredStars && (
                                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                                          • {item.transferredStars}★ transferred
                                        </span>
                                      )}
                                      {item.isTransferSource && (
                                        <span className="ml-2 text-orange-600 dark:text-orange-400">
                                          • Will transfer {item.targetStarForce}★ and be destroyed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {editingStarforce === item.id ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="25"
                                      value={tempValues.current}
                                      onChange={(e) => setTempValues(prev => ({ ...prev, current: parseInt(e.target.value) || 0 }))}
                                      className="w-16 h-8 text-center font-maplestory"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className={`w-3 h-3 ${item.transferredFrom ? 'text-blue-500' : item.isTransferSource ? 'text-orange-500' : 'text-yellow-500'}`} />
                                      <span className={`font-medium font-maplestory ${item.transferredFrom ? 'text-blue-600 dark:text-blue-400' : item.isTransferSource ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                        {item.currentStarForce || 0}
                                        {item.isTransferSource && (
                                          <span className="text-xs ml-1 opacity-75">
                                            (→{item.targetStarForce})
                                          </span>
                                        )}
                                      </span>
                                      {/* Quick Adjust Buttons - Current SF */}
                                      {hoveredRow === item.id && item.starforceable && (
                                        <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickAdjust(item, 'current', 1)}
                                            className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                          >
                                            <ChevronUp className="w-2 h-2 text-green-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickAdjust(item, 'current', -1)}
                                            className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                          >
                                            <ChevronDown className="w-2 h-2 text-red-600" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {editingStarforce === item.id ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="25"
                                      value={tempValues.target}
                                      onChange={(e) => setTempValues(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                      className="w-16 h-8 text-center font-maplestory"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Target className="w-3 h-3 text-primary" />
                                      <span className="font-medium font-maplestory">{item.targetStarForce || 0}</span>
                                      {/* Quick Adjust Buttons - Target SF */}
                                      {hoveredRow === item.id && item.starforceable && (
                                        <div className="flex flex-col ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickAdjust(item, 'target', 1)}
                                            className="h-3 w-4 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                          >
                                            <ChevronUp className="w-2 h-2 text-green-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickAdjust(item, 'target', -1)}
                                            className="h-3 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                          >
                                            <ChevronDown className="w-2 h-2 text-red-600" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(item)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {editingStarforce === item.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSaveEdit(item)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={handleCancelEdit}
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        {item.starforceable && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleStartEdit(item)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        )}
                                        {item.starforceable && item.currentStarForce < item.targetStarForce && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCompleteStarforce(item)}
                                            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                            title="Complete StarForce (set current = target)"
                                          >
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                          </Button>
                                        )}
                                        {/* Delete button for all equipment */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            if (isAdditionalEquipment(item) && onDeleteAdditionalEquipment) {
                                              onDeleteAdditionalEquipment(item.id);
                                            } else if (item.slot && onClearEquipment) {
                                              onClearEquipment(item.slot);
                                            }
                                          }}
                                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                          title={isAdditionalEquipment(item) ? "Delete additional equipment" : "Clear equipment slot"}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* StarForce Calculator Tab */}
            <TabsContent value="calculator" className="mt-6">
              {pendingEquipment.length > 0 ? (
                <StarForceCalculator
                  mode="equipment-table"
                  characterId={characterId}
                  characterName={characterName}
                  equipment={equipment}
                  additionalEquipment={additionalEquipment}
                  onUpdateStarforce={onUpdateStarforce}
                  onUpdateActualCost={onUpdateActualCost}
                  onUpdateSafeguard={handleUpdateSafeguard}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-xl mb-2 font-maplestory">No Pending StarForce Goals</h3>
                    <p className="text-muted-foreground mb-4 font-maplestory">
                      All your equipment is already at target StarForce levels!
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => handleTabChange("equipment")}
                        className="flex items-center gap-2 font-maplestory"
                      >
                        <Target className="w-4 h-4" />
                        Manage Equipment
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleAddAdditionalEquipment}
                        className="flex items-center gap-2 font-maplestory"
                      >
                        <Plus className="w-4 h-4" />
                        Add StarForce Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Smart Planner Tab */}
            <TabsContent value="optimizer" className="mt-6">
              <StarForceOptimizer
                equipment={equipment}
                additionalEquipment={additionalEquipment}
                characterId={characterId}
                characterName={characterName}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

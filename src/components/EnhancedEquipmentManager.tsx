import { useState } from "react";
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
  DollarSign
} from "lucide-react";

interface EnhancedEquipmentManagerProps {
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onAddEquipment: (slot: EquipmentSlot) => void;
  onClearEquipment: (slot: EquipmentSlot) => void;
  onUpdateStarforce?: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
  onSaveEquipment?: (equipment: Equipment) => void;
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

  // Calculate stats including additional equipment
  const allEquipment = [...equipment, ...additionalEquipment];
  const starforceableEquipment = allEquipment.filter(eq => eq.starforceable);
  const pendingEquipment = starforceableEquipment.filter(eq => eq.currentStarForce < eq.targetStarForce);
  const completedEquipment = starforceableEquipment.filter(eq => eq.currentStarForce >= eq.targetStarForce);
  const completionRate = starforceableEquipment.length > 0 
    ? Math.round((completedEquipment.length / starforceableEquipment.length) * 100)
    : 0;

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
    
    if (isAdditional && onSaveAdditionalEquipment) {
      onSaveAdditionalEquipment(equipment);
    } else if (onSaveEquipment) {
      onSaveEquipment(equipment);
    }
    handleCloseEquipmentForm();
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
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Non-SF</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content with Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Equipment Setup
              </TabsTrigger>
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                StarForce Calculator
                {pendingEquipment.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-400">
                    {pendingEquipment.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Equipment Setup Tab */}
            <TabsContent value="equipment" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Equipment Grid - Left Side */}
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
                      onOpenCalculator={() => setActiveTab("calculator")}
                    />
                  </CardContent>
                </Card>

                {/* Equipment Table - Right Side */}
                <Card className="xl:col-span-3">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Equipment Details
                      </CardTitle>
                      
                      <div className="flex items-center gap-4">
                        {/* Add Additional Equipment Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddAdditionalEquipment}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Item
                        </Button>
                        
                        {/* Filter Tabs */}
                        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="w-auto">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all" className="text-xs">All ({allEquipment.length})</TabsTrigger>
                            <TabsTrigger value="starforceable" className="text-xs">SF ({starforceableEquipment.length})</TabsTrigger>
                            <TabsTrigger value="pending" className="text-xs">Pending ({pendingEquipment.length})</TabsTrigger>
                            <TabsTrigger value="completed" className="text-xs">Done ({completedEquipment.length})</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredEquipment().length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No Equipment Found</h3>
                        <p className="text-muted-foreground mb-4">
                          {filter === "all" 
                            ? "Click on equipment slots to add new items"
                            : `No ${filter} equipment found`
                          }
                        </p>
                        {filter !== "all" && (
                          <Button variant="outline" onClick={() => setFilter("all")}>
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
                              <TableHead>Item</TableHead>
                              <TableHead className="text-center">Current SF</TableHead>
                              <TableHead className="text-center">Target SF</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
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
                                    size="sm"
                                    className="w-8 h-8"
                                    maxRetries={2}
                                    showFallback={true}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {item.name}
                                      {isAdditionalEquipment(item) && (
                                        <Badge variant="secondary" className="text-xs">Additional</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.slot || 'No Slot'}
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
                                      className="w-16 h-8 text-center"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500" />
                                      <span className="font-medium">{item.currentStarForce || 0}</span>
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
                                      className="w-16 h-8 text-center"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <Target className="w-3 h-3 text-primary" />
                                      <span className="font-medium">{item.targetStarForce || 0}</span>
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
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-xl mb-2">No Pending StarForce Goals</h3>
                    <p className="text-muted-foreground mb-4">
                      All your equipment is already at target StarForce levels!
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("equipment")}
                        className="flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Manage Equipment
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleAddAdditionalEquipment}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add StarForce Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
        allowSlotEdit={true}
        selectedJob={selectedJob}
      />
    </div>
  );
}

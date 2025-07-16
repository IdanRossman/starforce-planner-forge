import { useState, useEffect } from "react";
import { Equipment, EquipmentSlot } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EquipmentGrid } from "@/components/EquipmentGrid";
import { QuickStarForceTable } from "@/components/QuickStarForceTable";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EQUIPMENT_TEMPLATES, getTemplateById, getDefaultTemplate } from "@/data/equipmentTemplates";
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Users,
  Target,
  Coins,
  Info
} from "lucide-react";

interface QuickCalculatorProps {
  onNavigateToFullFeatures: () => void;
}

export function QuickCalculator({ onNavigateToFullFeatures }: QuickCalculatorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(getDefaultTemplate().id);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [starForceItems, setStarForceItems] = useState<Equipment[]>([]);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<EquipmentSlot | null>(null);

  // Load template equipment when template changes
  useEffect(() => {
    const template = getTemplateById(selectedTemplateId);
    if (template) {
      setEquipment([...template.equipment]);
      setStarForceItems([]);
    }
  }, [selectedTemplateId]);

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
      // Update existing equipment
      setEquipment(prev => 
        prev.map(eq => eq.id === editingEquipment.id ? equipmentData : eq)
      );
    } else {
      // Add new equipment
      setEquipment(prev => [
        ...prev.filter(eq => eq.slot !== equipmentData.slot),
        equipmentData
      ]);
    }
  };

  const handleAddStarForceItem = () => {
    // For quick calculator, this would just open the equipment form for a new item
    setEditingEquipment(null);
    setDefaultSlot('weapon');
    setIsEquipmentFormOpen(true);
  };

  const handleRemoveStarForceItem = (id: string) => {
    // Remove from equipment list
    setEquipment(prev => prev.filter(eq => eq.id !== id));
  };

  // Calculate some quick stats
  const totalEquipment = equipment.length;
  const incompleteEquipment = equipment.filter(eq => 
    eq.starforceable && eq.currentStarForce < eq.targetStarForce
  ).length;
  const completionRate = totalEquipment > 0 ? 
    ((totalEquipment - incompleteEquipment) / totalEquipment * 100) : 0;

  const currentTemplate = getTemplateById(selectedTemplateId);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Quick StarForce Calculator
                  <Badge variant="secondary" className="text-xs">Try it now!</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a template, customize equipment, and see instant cost calculations
                </p>
              </div>
            </div>
            <Button 
              onClick={onNavigateToFullFeatures}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Users className="w-4 h-4 mr-2" />
              Get Full Features
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Template Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Equipment Template
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a preset equipment configuration to get started quickly
              </p>
            </div>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Template Info */}
          {currentTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Equipment</span>
                </div>
                <p className="text-lg font-bold">{totalEquipment} pieces</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <p className="text-lg font-bold">{incompleteEquipment} items</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Progress</span>
                </div>
                <p className="text-lg font-bold">{Math.round(completionRate)}%</p>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Equipment Grid and Calculation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equipment Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Equipment Grid
              <Badge variant="outline" className="text-xs">Click to edit</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="scale-110 origin-top">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Live Calculations
              <Badge variant="outline" className="text-xs">Auto-updates</Badge>
            </CardTitle>
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
            <Button 
              onClick={onNavigateToFullFeatures}
              size="lg"
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Users className="w-5 h-5 mr-2" />
              Unlock Full Features
            </Button>
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
      />
    </div>
  );
}

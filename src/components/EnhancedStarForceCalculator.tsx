import { useState, useMemo } from "react";
import { Equipment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { EquipmentImage } from "@/components/EquipmentImage";
import { 
  Calculator, 
  Star, 
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Shield,
  Download,
  Settings,
  Zap,
  Crown,
  ChevronUp,
  ChevronDown,
  Edit,
  CheckCircle2,
  X,
  Info,
  AlertTriangle,
  Heart,
  Gift,
  Percent,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StarForceCalculatorProps {
  equipment: Equipment[];
  additionalEquipment?: Equipment[];
  onUpdateStarforce: (equipmentId: string, current: number, target: number) => void;
  onUpdateActualCost?: (equipmentId: string, actualCost: number) => void;
}

interface StarForceSettings {
  discountEvent: boolean; // 30% off event
  starcatchEvent: boolean; // 5/10/15 event
  shiningStarForce: boolean; // Shining StarForce
  serverType: 'regular' | 'interactive' | 'heroic';
  hasSpares: boolean;
}

interface StarForceCost {
  expectedCost: number;
  worstCase: number; // 95th percentile
  median: number;
  attempts: number;
}

export function EnhancedStarForceCalculator({ 
  equipment, 
  additionalEquipment = [],
  onUpdateStarforce,
  onUpdateActualCost 
}: StarForceCalculatorProps) {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<StarForceSettings>({
    discountEvent: true,
    starcatchEvent: true,
    shiningStarForce: true,
    serverType: 'regular',
    hasSpares: true
  });
  
  const [editingStarforce, setEditingStarforce] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ current: number; target: number }>({ current: 0, target: 0 });
  const [editingActualCost, setEditingActualCost] = useState<string | null>(null);
  const [tempActualCost, setTempActualCost] = useState<number>(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Combine all equipment
  const allEquipment = [...equipment, ...additionalEquipment];
  const pendingEquipment = allEquipment.filter(eq => 
    eq.starforceable && eq.currentStarForce < eq.targetStarForce
  );

  // StarForce calculation service
  const calculateStarForceCost = (equipment: Equipment): StarForceCost => {
    const fromStar = equipment.currentStarForce || 0;
    const toStar = equipment.targetStarForce || 0;
    const level = equipment.level || 200;
    
    let totalExpectedCost = 0;
    let totalExpectedAttempts = 0;
    
    for (let star = fromStar; star < toStar; star++) {
      // Base meso cost calculation
      let baseCost = 0;
      if (star <= 10) {
        baseCost = Math.round(level * level * level * (star + 1) * 2.7);
      } else if (star <= 15) {
        baseCost = Math.round(level * level * level * (star + 1) * 40);
      } else {
        baseCost = Math.round(level * level * level * (star + 1) * 200);
      }
      
      // Apply 30% discount if event is active
      if (settings.discountEvent) {
        baseCost = Math.round(baseCost * 0.7);
      }
      
      // Success rate calculation
      let successRate = 0.95; // Default high success rate for low stars
      if (star >= 5 && star <= 10) successRate = 0.6;
      else if (star >= 11 && star <= 14) successRate = 0.3;
      else if (star >= 15 && star <= 19) successRate = 0.15;
      else if (star >= 20) successRate = 0.03;
      
      // Adjust for Shining StarForce
      if (settings.shiningStarForce && star >= 10 && star <= 14) {
        successRate = Math.min(successRate * 1.5, 0.95);
      }
      
      // Adjust for 5/10/15 event
      if (settings.starcatchEvent && (star === 4 || star === 9 || star === 14)) {
        successRate = 1.0; // 100% success
      }
      
      // Adjust for spares (Interactive/Heroic servers)
      if (settings.hasSpares && (settings.serverType === 'interactive' || settings.serverType === 'heroic')) {
        if (star >= 15 && star <= 16) successRate *= 1.2; // Slight boost with spares
      }
      
      const expectedAttempts = 1 / successRate;
      const expectedCostThisStar = baseCost * expectedAttempts;
      
      totalExpectedCost += expectedCostThisStar;
      totalExpectedAttempts += expectedAttempts;
    }
    
    // Calculate percentiles (simplified model)
    const worstCase = totalExpectedCost * 2.5; // Rough 95th percentile
    const median = totalExpectedCost * 0.85; // Rough median
    
    return {
      expectedCost: Math.round(totalExpectedCost),
      worstCase: Math.round(worstCase),
      median: Math.round(median),
      attempts: Math.round(totalExpectedAttempts)
    };
  };

  // Calculate overall statistics
  const allCosts = pendingEquipment.map(eq => calculateStarForceCost(eq));
  const totalExpectedCost = allCosts.reduce((sum, cost) => sum + cost.expectedCost, 0);
  const totalWorstCase = allCosts.reduce((sum, cost) => sum + cost.worstCase, 0);
  const totalMedian = allCosts.reduce((sum, cost) => sum + cost.median, 0);
  const totalActualCost = pendingEquipment.reduce((sum, eq) => sum + (eq.actualCost || 0), 0);
  
  // Calculate luck percentage
  const luckPercentage = totalExpectedCost > 0 
    ? ((totalActualCost - totalExpectedCost) / totalExpectedCost) * 100 
    : 0;

  const handleQuickAdjust = (equipment: Equipment, type: 'current' | 'target', delta: number) => {
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

  const handleStartEdit = (equipment: Equipment) => {
    setEditingStarforce(equipment.id);
    setTempValues({
      current: equipment.currentStarForce || 0,
      target: equipment.targetStarForce || 0
    });
  };

  const handleSaveEdit = (equipment: Equipment) => {
    onUpdateStarforce(equipment.id, tempValues.current, tempValues.target);
    setEditingStarforce(null);
  };

  const handleCancelEdit = () => {
    setEditingStarforce(null);
    setTempValues({ current: 0, target: 0 });
  };

  const handleStartActualCostEdit = (equipment: Equipment) => {
    setEditingActualCost(equipment.id);
    setTempActualCost(equipment.actualCost || 0);
  };

  const handleSaveActualCost = (equipment: Equipment) => {
    if (onUpdateActualCost) {
      onUpdateActualCost(equipment.id, tempActualCost);
    }
    setEditingActualCost(null);
  };

  const handleCancelActualCostEdit = () => {
    setEditingActualCost(null);
    setTempActualCost(0);
  };

  const formatMesos = (amount: number) => {
    if (amount >= 1e12) return `${(amount / 1e12).toFixed(1)}T`;
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
    return amount.toString();
  };

  const exportData = () => {
    const exportData = {
      settings,
      equipment: pendingEquipment.map(eq => ({
        name: eq.name,
        currentStarForce: eq.currentStarForce,
        targetStarForce: eq.targetStarForce,
        expectedCost: calculateStarForceCost(eq).expectedCost,
        actualCost: eq.actualCost || 0
      })),
      summary: {
        totalExpectedCost,
        totalActualCost,
        luckPercentage
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starforce-plan.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "StarForce plan exported successfully"
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            StarForce Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Event Toggles */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Events</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-500" />
                    <Label htmlFor="discount">30% Off</Label>
                  </div>
                  <Switch
                    id="discount"
                    checked={settings.discountEvent}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, discountEvent: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="starcatch">5/10/15</Label>
                  </div>
                  <Switch
                    id="starcatch"
                    checked={settings.starcatchEvent}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, starcatchEvent: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <Label htmlFor="shining">Shining SF</Label>
                  </div>
                  <Switch
                    id="shining"
                    checked={settings.shiningStarForce}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, shiningStarForce: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Server Settings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Server Type</Label>
              <Select
                value={settings.serverType}
                onValueChange={(value: 'regular' | 'interactive' | 'heroic') => 
                  setSettings(prev => ({ ...prev, serverType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Regular
                    </div>
                  </SelectItem>
                  <SelectItem value="interactive">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Interactive
                    </div>
                  </SelectItem>
                  <SelectItem value="heroic">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Heroic
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <Label htmlFor="spares">Has Spares</Label>
                </div>
                <Switch
                  id="spares"
                  checked={settings.hasSpares}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hasSpares: checked }))}
                />
              </div>
            </div>

            {/* Export */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Export</Label>
              <Button
                variant="outline"
                onClick={exportData}
                className="w-full flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-bold">{formatMesos(totalExpectedCost)}</div>
                <div className="text-sm text-muted-foreground">Expected Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-lg font-bold">{formatMesos(totalMedian)}</div>
                <div className="text-sm text-muted-foreground">Median Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-lg font-bold">{formatMesos(totalWorstCase)}</div>
                <div className="text-sm text-muted-foreground">Worst Case</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                luckPercentage > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                {luckPercentage > 0 ? 
                  <TrendingDown className="w-5 h-5 text-red-500" /> :
                  <TrendingUp className="w-5 h-5 text-green-500" />
                }
              </div>
              <div>
                <div className={`text-lg font-bold ${
                  luckPercentage > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {luckPercentage > 0 ? '+' : ''}{luckPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {luckPercentage > 0 ? 'Unlucky' : 'Lucky'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* StarForce Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            StarForce Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEquipment.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Pending StarForce</h3>
              <p className="text-muted-foreground">
                All your starforceable equipment is already at target levels!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead className="text-center">Current</TableHead>
                    <TableHead className="text-center">Target</TableHead>
                    <TableHead className="text-center">Expected Cost</TableHead>
                    <TableHead className="text-center">Actual Cost</TableHead>
                    <TableHead className="text-center">Luck</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEquipment.map((item) => {
                    const cost = calculateStarForceCost(item);
                    const actualCost = item.actualCost || 0;
                    const itemLuck = cost.expectedCost > 0 
                      ? ((actualCost - cost.expectedCost) / cost.expectedCost) * 100 
                      : 0;

                    return (
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
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">Level {item.level}</div>
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
                              {hoveredRow === item.id && (
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
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="25"
                                value={tempValues.target}
                                onChange={(e) => setTempValues(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Target className="w-3 h-3 text-primary" />
                              <span className="font-medium">{item.targetStarForce || 0}</span>
                              {hoveredRow === item.id && (
                                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex flex-col">
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
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(item)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{formatMesos(cost.expectedCost)}</div>
                          <div className="text-xs text-muted-foreground">
                            {cost.attempts.toFixed(1)} attempts
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingActualCost === item.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={tempActualCost}
                                onChange={(e) => setTempActualCost(parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                                placeholder="0"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveActualCost(item)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelActualCostEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                              onClick={() => handleStartActualCostEdit(item)}
                            >
                              {actualCost > 0 ? formatMesos(actualCost) : 'Click to add'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {actualCost > 0 ? (
                            <Badge 
                              variant="secondary" 
                              className={
                                itemLuck > 0 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }
                            >
                              {itemLuck > 0 ? '+' : ''}{itemLuck.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

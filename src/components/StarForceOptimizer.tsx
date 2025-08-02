import { useState, useEffect, useMemo, useCallback } from "react";
import { Equipment, StarforceOptimizationRequestDto, StarforceOptimizationResponseDto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatMeso, parseMesoInput, isValidMesoInput, loadCharacterSpareData } from "@/lib/utils";
import { EquipmentImage } from "./EquipmentImage";
import { 
  Sparkles, 
  DollarSign,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Shield,
  Award,
  ArrowRight,
  Calculator,
  Loader2,
  Info,
  Trophy,
  Play,
  Circle
} from "lucide-react";

interface StarForceOptimizerProps {
  equipment: Equipment[];
  additionalEquipment?: Equipment[];
  characterId?: string;
  characterName?: string;
  onUpdateProgress?: (step: number) => void;
}

export function StarForceOptimizer({
  equipment,
  additionalEquipment = [],
  characterId,
  characterName,
  onUpdateProgress
}: StarForceOptimizerProps) {
  const [availableMeso, setAvailableMeso] = useState<string>("");
  const [mesoUnit, setMesoUnit] = useState<string>("B"); // B for billion, M for million, K for thousand
  const [isLoading, setIsLoading] = useState(false);
  const [optimization, setOptimization] = useState<StarforceOptimizationResponseDto | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [events, setEvents] = useState({
    fiveTenFifteen: false,
    thirtyOff: false,
    starCatching: false,
    mvpDiscount: false
  });
  
  const { toast } = useToast();

  // Get all starforceable equipment
  const allEquipment = [...equipment, ...additionalEquipment];
  const pendingEquipment = allEquipment.filter(eq => 
    eq.starforceable && eq.currentStarForce < eq.targetStarForce
  );

  // Memoize equipment IDs to prevent unnecessary re-renders
  const equipmentIds = useMemo(() => 
    pendingEquipment.map(eq => eq.id).join(','), 
    [pendingEquipment]
  );

  // Utility function to get appropriate styling for special notes
  const getSpecialNoteStyle = (note: string) => {
    if (note.includes('GUARANTEED SUCCESS')) {
      return 'text-green-600 bg-green-50 border border-green-200 p-2 rounded-lg';
    }
    if (note.includes('EXCEEDS BUDGET')) {
      return 'text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg';
    }
    if (note.includes('Event')) {
      return 'text-blue-600 bg-blue-50 border border-blue-200 p-2 rounded-lg';
    }
    return 'text-blue-600 bg-blue-50 border border-blue-200 p-2 rounded-lg';
  };

  // Utility function to find equipment by action description
  const findEquipmentByAction = (action: string): Equipment | undefined => {
    const allEquipment = [...equipment, ...additionalEquipment];
    return allEquipment.find(eq => {
      const itemName = eq.name || `${eq.slot} (Level ${eq.level})`;
      return action.includes(itemName);
    });
  };

  // Utility function to extract equipment name from action
  const extractEquipmentNameFromAction = (action: string): string => {
    // Action format is usually like "StarForce [Equipment Name] from X to Y stars"
    const match = action.match(/StarForce (.+?) from \d+ to \d+ stars?/);
    return match ? match[1] : action;
  };

  // Helper function to convert input to meso amount
  const convertToMeso = (amount: string, unit: string): number => {
    const numAmount = parseFloat(amount) || 0;
    switch (unit) {
      case "B": return numAmount * 1000000000; // Billion
      case "M": return numAmount * 1000000; // Million
      case "K": return numAmount * 1000; // Thousand
      default: return numAmount; // Raw number
    }
  };

  // Helper function to validate meso input
  const isValidMesoAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };

  const handleOptimize = async () => {
    if (!availableMeso || !isValidMesoAmount(availableMeso)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid meso amount.",
        variant: "destructive",
      });
      return;
    }

    if (pendingEquipment.length === 0) {
      toast({
        title: "No Equipment",
        description: "No StarForce goals found to optimize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const parsedMesoAmount = convertToMeso(availableMeso, mesoUnit);
      
      // Load calculator data for spare counts only (safeguard comes from Equipment objects)
      const savedData = loadCharacterSpareData(characterId, characterName);
      
      const request: StarforceOptimizationRequestDto = {
        availableMeso: parsedMesoAmount,
        isInteractive: false,
        events: {
          fiveTenFifteen: events.fiveTenFifteen,
          thirtyOff: events.thirtyOff,
          starCatching: events.starCatching,
          mvpDiscount: events.mvpDiscount
        },
        items: pendingEquipment.map(eq => ({
          itemLevel: eq.level,
          fromStar: eq.currentStarForce,
          toStar: eq.targetStarForce,
          itemName: eq.name || `${eq.slot} (Level ${eq.level})`,
          safeguardEnabled: eq.safeguard ?? false, // Read directly from Equipment object
          spareCount: savedData.spareCounts[eq.id] ?? 0,
          spareCost: 500000000 // Default 500M per spare
        }))
      };

      const response = await apiService.optimizeStarforce(request);
      setOptimization(response);
      
      // Reset completed steps when new optimization is generated
      setCompletedSteps(new Set());
      
      toast({
        title: "Optimization Complete",
        description: `Found optimal plan for ${response.starsGained.total} stars within budget!`,
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to get optimization results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'event': return <Zap className="w-4 h-4" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  // Handle step completion toggle
  const toggleStepCompletion = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  if (pendingEquipment.length === 0) {
    return (
      <div className="p-8">
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-12 text-center">
            <Star className="w-20 h-20 mx-auto mb-6 text-blue-500" />
            <h3 className="font-bold text-2xl mb-3 font-maplestory text-blue-600">
              Perfect StarForce Status! ⭐
            </h3>
            <p className="text-muted-foreground mb-6 font-maplestory text-lg">
              All your equipment is already at target StarForce levels!
            </p>
            <Button 
              variant="outline" 
              className="font-maplestory"
            >
              <Target className="w-4 h-4 mr-2" />
              Set New StarForce Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
        {/* Configuration Section */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3 font-maplestory text-xl">
              <Calculator className="w-6 h-6 text-orange-500" />
              Optimization Settings
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-maplestory">
                  Advanced
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
          {/* Budget Input - Centered and Highlighted */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center space-y-2">
              <Label htmlFor="meso-budget" className="font-maplestory text-lg font-bold text-foreground">
                💰 Available Meso Budget
              </Label>
              <p className="text-sm text-muted-foreground font-maplestory">
                Required to start optimization
              </p>
            </div>
            <div className="flex max-w-sm w-full gap-2">
              {/* Amount Input */}
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meso-budget"
                  type="number"
                  placeholder="5, 500, 1.5..."
                  value={availableMeso}
                  onChange={(e) => setAvailableMeso(e.target.value)}
                  className="pl-9 font-maplestory text-center border-2 border-blue-200 focus:border-blue-400 shadow-md"
                  min="0"
                  step="0.1"
                />
              </div>
              {/* Unit Selector */}
              <Select value={mesoUnit} onValueChange={setMesoUnit}>
                <SelectTrigger className="w-20 font-maplestory border-2 border-blue-200 focus:border-blue-400 shadow-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B" className="font-maplestory">B</SelectItem>
                  <SelectItem value="M" className="font-maplestory">M</SelectItem>
                  <SelectItem value="K" className="font-maplestory">K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground font-maplestory text-center">
              {availableMeso && isValidMesoAmount(availableMeso) ? (
                <span className="text-green-600 font-medium">
                  Budget: {formatMeso(convertToMeso(availableMeso, mesoUnit))} ({convertToMeso(availableMeso, mesoUnit).toLocaleString()} meso)
                </span>
              ) : availableMeso ? (
                <span className="text-red-600 font-medium">
                  Please enter a valid number
                </span>
              ) : (
                <span>
                  Enter your available meso budget and select the unit
                </span>
              )}
            </div>
          </div>

          {/* Event Settings */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 text-foreground font-maplestory">StarForce Events</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="fiveTenFifteen"
                    checked={events.fiveTenFifteen}
                    onCheckedChange={(checked) => 
                      setEvents(prev => ({ 
                        ...prev, 
                        fiveTenFifteen: checked
                      }))
                    }
                  />
                  <Label htmlFor="fiveTenFifteen" className="text-sm font-maplestory">
                    5/10/15 Event (100% success at ★5, ★10, ★15)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="thirtyPercentOff"
                    checked={events.thirtyOff}
                    onCheckedChange={(checked) => 
                      setEvents(prev => ({ 
                        ...prev, 
                        thirtyOff: checked
                      }))
                    }
                  />
                  <Label htmlFor="thirtyPercentOff" className="text-sm font-maplestory">
                    30% Off Event (30% cost reduction)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="starCatching"
                    checked={events.starCatching}
                    onCheckedChange={(checked) => 
                      setEvents(prev => ({ 
                        ...prev, 
                        starCatching: checked
                      }))
                    }
                  />
                  <Label htmlFor="starCatching" className="text-sm font-maplestory">
                    Star Catching (+5% Success Rate)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mvpDiscount"
                    checked={events.mvpDiscount}
                    onCheckedChange={(checked) => 
                      setEvents(prev => ({ 
                        ...prev, 
                        mvpDiscount: checked
                      }))
                    }
                  />
                  <Label htmlFor="mvpDiscount" className="text-sm font-maplestory">
                    MVP Discount (Member Benefits)
                  </Label>
                </div>
              </div>
            </div>
            <Separator />
          </div>

          {/* Optimize Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleOptimize}
              disabled={isLoading || !availableMeso}
              size="lg"
              className="relative overflow-hidden group bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:via-amber-700 hover:to-orange-700 border-0 shadow-xl font-maplestory text-lg px-8 py-4 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                )}
                {isLoading ? 'Optimizing Your StarForce Plan...' : 'Optimize StarForce Plan'}
              </div>
              {!isLoading && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {optimization && (
        <div className="space-y-8">
          {/* Budget Overview */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/20">
              <CardTitle className="flex items-center gap-3 font-maplestory text-xl">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                Budget Analysis
                <div className="ml-auto">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-maplestory">
                    <Trophy className="w-3 h-3 mr-1" />
                    Analysis
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative p-6 rounded-xl border border-green-300/70 bg-gradient-to-br from-green-100 to-emerald-100">
                    <div className="text-3xl font-bold text-green-600 font-maplestory mb-2">
                      {formatMeso(optimization.budget.available)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory flex items-center justify-center gap-1">
                      <Shield className="w-4 h-4" />
                      Available Budget
                    </div>
                  </div>
                </div>
                <div className="text-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative p-6 rounded-xl border border-blue-300/70 bg-gradient-to-br from-blue-100 to-indigo-100">
                    <div className="text-3xl font-bold text-blue-600 font-maplestory mb-2">
                      {formatMeso(optimization.budget.used)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory flex items-center justify-center gap-1">
                      <Target className="w-4 h-4" />
                      Amount Used
                    </div>
                  </div>
                </div>
                <div className="text-center relative group">
                  <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${
                    optimization.budget.remaining < 0 ? 'bg-gradient-to-r from-red-200 to-rose-200' : 'bg-gradient-to-r from-orange-200 to-amber-200'
                  }`} />
                  <div className={`relative p-6 rounded-xl border bg-gradient-to-br ${
                    optimization.budget.remaining < 0 
                      ? 'border-red-300/70 from-red-100 to-rose-100' 
                      : 'border-orange-300/70 from-orange-100 to-amber-100'
                  }`}>
                    <div className={`text-3xl font-bold font-maplestory mb-2 ${
                      optimization.budget.remaining < 0 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {optimization.budget.remaining < 0 ? '-' : ''}{formatMeso(Math.abs(optimization.budget.remaining))}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory flex items-center justify-center gap-1">
                      {optimization.budget.remaining < 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Over Budget
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Remaining
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Budget Progress Visualization */}
              <div className="mt-8">
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-maplestory">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Budget Utilization
                    </span>
                    <span className="flex items-center gap-2">
                      {((optimization.budget.used / optimization.budget.available) * 100).toFixed(1)}%
                      {optimization.budget.remaining < 0 && (
                        <span className="text-red-600 ml-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ({formatMeso(Math.abs(optimization.budget.remaining))} over)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className={`h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                      optimization.budget.remaining < 0 
                        ? 'bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500' 
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (optimization.budget.used / optimization.budget.available) * 100)}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse" />
                  </div>
                  {optimization.budget.remaining < 0 && (
                    <div 
                      className="h-4 bg-red-500 opacity-60 rounded-r-full -mt-4 ml-auto relative overflow-hidden"
                      style={{ 
                        width: `${Math.min(50, ((Math.abs(optimization.budget.remaining)) / optimization.budget.available) * 100)}%` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
                    </div>
                  )}
                </div>
                {optimization.budget.remaining < 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-red-100 to-rose-100 border border-red-300 rounded-xl text-sm text-red-700 font-maplestory">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Budget Exceeded</span>
                    </div>
                    <div className="mt-1">
                      Consider increasing budget or reducing targets for within-budget completion.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Plan */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-white/20">
              <CardTitle className="flex items-center gap-3 font-maplestory text-xl">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                Complete Step-by-Step Roadmap
                <div className="ml-auto">
                  <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-maplestory">
                    <Star className="w-3 h-3 mr-1" />
                    Timeline
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {(() => {
                const withinBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget >= 0);
                const overBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget < 0);
                
                return (
                  <div>
                    {/* Budget Summary - only show if there are over-budget steps */}
                    {overBudgetSteps.length > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-xl">
                        <div className="flex items-center gap-3 text-amber-800 font-maplestory">
                          <div className="p-2 bg-amber-500 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-lg">Budget Overview</span>
                        </div>
                        <div className="text-sm text-amber-700 mt-3 font-maplestory pl-12">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {withinBudgetSteps.length} steps within budget
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            {overBudgetSteps.length} steps over budget - require additional {formatMeso(Math.abs(Math.min(...overBudgetSteps.map(s => s.remainingBudget))))} funding
                          </div>
                        </div>
                      </div>
                    )}
              
                    <div className="space-y-4 relative">
                      {/* Timeline Line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-indigo-200" />
                      
                      {optimization.actionPlan.map((step, index) => {
                        const equipment = findEquipmentByAction(step.action);
                        const isOverBudget = step.remainingBudget < 0;
                        const isLastStep = index === optimization.actionPlan.length - 1;
                        const isCompleted = completedSteps.has(step.step);
                        
                        return (
                          <div key={index} className="relative">
                            {/* Timeline Node */}
                            <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-lg z-10 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : isOverBudget 
                                ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}>
                              <div className="absolute inset-1 rounded-full bg-white opacity-30" />
                            </div>
                            
                            {/* Step Card */}
                            <div className={`ml-16 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                              isCompleted
                                ? 'border-green-200 bg-card hover:border-green-300 opacity-75'
                                : isOverBudget 
                                ? 'border-red-200 bg-card hover:border-red-300' 
                                : 'border-blue-200 bg-card hover:border-blue-300'
                            }`}>
                              <div className="flex items-center gap-6">
                                {/* Step Number */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-maplestory shadow-md ${
                                  isCompleted
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : isOverBudget 
                                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    step.step
                                  )}
                                </div>
                                
                                {/* Equipment Image - Enlarged Centerpiece */}
                                {equipment && (
                                  <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-lg overflow-hidden">
                                    <img 
                                      src={equipment.image}
                                      alt={equipment.name || equipment.slot}
                                      className="w-16 h-16 object-contain object-center rounded-lg shadow-lg hover:scale-110 transition-transform duration-300"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {/* Step Details */}
                                <div className="flex-1 min-w-0">
                                  {/* Step Action Description */}
                                  <div className="mb-3 pb-2 border-b border-gray-100">
                                    <p className={`text-sm font-medium font-maplestory ${
                                      isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                                    }`}>
                                      {step.action}
                                    </p>
                                  </div>
                                  
                                  {/* Enhanced Data Grid with Labels */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center gap-2 font-maplestory">
                                        <Star className="w-3 h-3 text-amber-500" />
                                        <span className="font-medium">{step.fromStar}★ → {step.toStar}★</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground pl-5">StarForce Progress</span>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center gap-2 font-maplestory">
                                        <DollarSign className="w-3 h-3 text-green-500" />
                                        <span className="font-medium">{formatMeso(step.expectedCost)}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground pl-5">Expected Cost</span>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center gap-2 font-maplestory">
                                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                                        <span className="font-medium">{step.expectedBooms.toFixed(1)} booms</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground pl-5">Equipment Destruction</span>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-1">
                                      <div className={`flex items-center gap-2 font-maplestory ${
                                        step.remainingBudget < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'
                                      }`}>
                                        {step.remainingBudget < 0 ? (
                                          <AlertTriangle className="w-3 h-3" />
                                        ) : (
                                          <CheckCircle2 className="w-3 h-3" />
                                        )}
                                        <span className="font-medium">
                                          {step.remainingBudget < 0 ? 'Over: ' : 'Left: '}
                                          {formatMeso(Math.abs(step.remainingBudget))}
                                        </span>
                                      </div>
                                      <span className={`text-xs pl-5 ${
                                        step.remainingBudget < 0 ? 'text-red-500' : 'text-muted-foreground'
                                      }`}>
                                        {step.remainingBudget < 0 ? 'Budget Deficit' : 'Remaining Budget'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {step.specialNote && !isOverBudget && (
                                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="text-xs text-blue-600 font-maplestory italic flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        <span className="font-medium">Special Note:</span>
                                        {step.specialNote}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Completion Checkbox */}
                                <div className="flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStepCompletion(step.step)}
                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                                      isCompleted
                                        ? 'border-green-500 text-green-600 hover:bg-green-50'
                                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-500'
                                    }`}
                                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

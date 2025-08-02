import { useState, useEffect, useMemo, useCallback } from "react";
import { Equipment, StarforceOptimizationRequestDto, StarforceOptimizationResponseDto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Trophy
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
  const [isLoading, setIsLoading] = useState(false);
  const [optimization, setOptimization] = useState<StarforceOptimizationResponseDto | null>(null);
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

  const handleOptimize = async () => {
    if (!availableMeso || !isValidMesoInput(availableMeso)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid meso amount (e.g., 5B, 500M, 1.5B).",
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
      const parsedMesoAmount = parseMesoInput(availableMeso);
      
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
        {/* Hero Header */}
        <div className="text-center py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-20 animate-pulse" />
            <h1 className="relative text-4xl font-bold font-maplestory bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
              ⚡ Smart StarForce Optimizer ⚡
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mt-2 font-maplestory">
            AI-powered optimization for maximum efficiency
          </p>
        </div>

        {/* Configuration Section */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3 font-maplestory text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              Optimization Settings
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-maplestory">
                  Smart AI
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
            <div className="relative max-w-sm w-full">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="meso-budget"
                type="text"
                placeholder="5B, 500M, 1.5B..."
                value={availableMeso}
                onChange={(e) => setAvailableMeso(e.target.value)}
                className="pl-9 font-maplestory text-center border-2 border-blue-200 focus:border-blue-400 shadow-md"
              />
            </div>
            <div className="text-xs text-muted-foreground font-maplestory text-center">
              {availableMeso && isValidMesoInput(availableMeso) ? (
                <span className="text-green-600 font-medium">
                  Budget: {formatMeso(parseMesoInput(availableMeso))} ({parseMesoInput(availableMeso).toLocaleString()} meso)
                </span>
              ) : availableMeso ? (
                <span className="text-red-600 font-medium">
                  Invalid format. Use: 5B, 500M, 1.5B, or 5000000000
                </span>
              ) : (
                <span>
                  Enter amount with units: 5B (billion), 500M (million), 1.5B, etc.
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
              className="relative overflow-hidden group bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 border-0 shadow-xl font-maplestory text-lg px-8 py-4 transition-all duration-300"
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
                    Smart Analysis
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative p-6 rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative p-6 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50">
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
                    optimization.budget.remaining < 0 ? 'bg-gradient-to-r from-red-100 to-rose-100' : 'bg-gradient-to-r from-orange-100 to-amber-100'
                  }`} />
                  <div className={`relative p-6 rounded-xl border bg-gradient-to-br ${
                    optimization.budget.remaining < 0 
                      ? 'border-red-200/50 from-red-50 to-rose-50' 
                      : 'border-orange-200/50 from-orange-50 to-amber-50'
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
                  <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl text-sm text-red-700 font-maplestory">
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
              {optimization.actionPlan.some(step => step.remainingBudget < 0) && (
                <div className="text-sm text-muted-foreground font-maplestory mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    Shows complete roadmap to all targets. Steps with red indicators exceed your current budget.
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {(() => {
                const withinBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget >= 0);
                const overBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget < 0);
                
                return (
                  <div>
                    {/* Budget Summary - only show if there are over-budget steps */}
                    {overBudgetSteps.length > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
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
                        
                        return (
                          <div key={index} className="relative">
                            {/* Timeline Node */}
                            <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-lg z-10 ${
                              isOverBudget 
                                ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}>
                              <div className="absolute inset-1 rounded-full bg-white opacity-30" />
                            </div>
                            
                            {/* Step Card */}
                            <div className={`ml-16 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                              isOverBudget 
                                ? 'border-red-200 bg-card hover:border-red-300' 
                                : 'border-blue-200 bg-card hover:border-blue-300'
                            }`}>
                              <div className="flex items-center gap-6">
                                {/* Step Number */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-maplestory shadow-md ${
                                  isOverBudget 
                                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                }`}>
                                  {step.step}
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
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="flex items-center gap-2 font-maplestory">
                                      <Star className="w-3 h-3 text-amber-500" />
                                      <span>{step.fromStar}★ → {step.toStar}★</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-maplestory">
                                      <DollarSign className="w-3 h-3 text-green-500" />
                                      <span>{formatMeso(step.expectedCost)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-maplestory">
                                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                                      <span>{step.expectedBooms.toFixed(1)} booms</span>
                                    </div>
                                    <div className={`flex items-center gap-2 font-maplestory ${
                                      step.remainingBudget < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'
                                    }`}>
                                      {step.remainingBudget < 0 ? (
                                        <AlertTriangle className="w-3 h-3" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      <span>
                                        {step.remainingBudget < 0 ? 'Over: ' : 'Left: '}
                                        {formatMeso(Math.abs(step.remainingBudget))}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {step.specialNote && (
                                    <div className="mt-2 text-xs text-blue-600 font-maplestory italic">
                                      ⚡ {step.specialNote}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Arrow Indicator */}
                                {!isLastStep && (
                                  <div className="flex-shrink-0 text-muted-foreground">
                                    <ArrowRight className="w-6 h-6" />
                                  </div>
                                )}
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

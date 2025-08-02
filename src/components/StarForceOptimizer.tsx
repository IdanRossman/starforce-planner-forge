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
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2 font-maplestory">No StarForce Goals</h3>
          <p className="text-muted-foreground mb-4 font-maplestory">
            All your equipment is already at target StarForce levels!
          </p>
          <Button variant="outline" className="font-maplestory">
            <Target className="w-4 h-4 mr-2" />
            Set StarForce Goals
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-maplestory">
            <Calculator className="w-5 h-5 text-primary" />
            Optimization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="meso-budget" className="font-maplestory">Available Meso Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meso-budget"
                  type="text"
                  placeholder="5B, 500M, 1.5B..."
                  value={availableMeso}
                  onChange={(e) => setAvailableMeso(e.target.value)}
                  className="pl-9 font-maplestory"
                />
              </div>
              <div className="text-xs text-muted-foreground font-maplestory">
                {availableMeso && isValidMesoInput(availableMeso) ? (
                  <span className="text-green-600">
                    Budget: {formatMeso(parseMesoInput(availableMeso))} ({parseMesoInput(availableMeso).toLocaleString()} meso)
                  </span>
                ) : availableMeso ? (
                  <span className="text-red-600">
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
            <div className="space-y-3">
              <Label className="font-maplestory">Active Events</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Switch 
                    id="event-5-10-15"
                    checked={events.fiveTenFifteen}
                    onCheckedChange={(checked) => setEvents(prev => ({...prev, fiveTenFifteen: checked}))}
                  />
                  <Label htmlFor="event-5-10-15" className="font-maplestory">5/10/15 Event</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    id="event-30-off"
                    checked={events.thirtyOff}
                    onCheckedChange={(checked) => setEvents(prev => ({...prev, thirtyOff: checked}))}
                  />
                  <Label htmlFor="event-30-off" className="font-maplestory">30% Off</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    id="event-star-catching"
                    checked={events.starCatching}
                    onCheckedChange={(checked) => setEvents(prev => ({...prev, starCatching: checked}))}
                  />
                  <Label htmlFor="event-star-catching" className="font-maplestory">Star Catching</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    id="event-mvp"
                    checked={events.mvpDiscount}
                    onCheckedChange={(checked) => setEvents(prev => ({...prev, mvpDiscount: checked}))}
                  />
                  <Label htmlFor="event-mvp" className="font-maplestory">MVP Discount</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Planner Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-maplestory">
              <strong>Simplified Planning:</strong> This planner automatically uses your settings from the StarForce Calculator tab. 
              Just set your budget and events, then get your complete roadmap with clear budget indicators!
            </AlertDescription>
          </Alert>

          {/* Optimize Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleOptimize}
              disabled={isLoading || !availableMeso}
              size="lg"
              className="flex items-center gap-2 font-maplestory"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isLoading ? 'Optimizing...' : 'Optimize StarForce Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {optimization && (
        <div className="space-y-6">
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-maplestory">
                <DollarSign className="w-5 h-5 text-green-600" />
                Budget Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 font-maplestory">
                    {formatMeso(optimization.budget.available)}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 font-maplestory">
                    {formatMeso(optimization.budget.used)}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Used</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold font-maplestory ${optimization.budget.remaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {optimization.budget.remaining < 0 ? '-' : ''}{formatMeso(Math.abs(optimization.budget.remaining))}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">
                    {optimization.budget.remaining < 0 ? 'Over Budget' : 'Remaining'}
                  </div>
                </div>
              </div>
              
              {/* Budget Progress Visualization */}
              <div className="mt-6">
                <div className="mb-2">
                  <div className="flex justify-between text-sm font-maplestory">
                    <span>Budget Utilization</span>
                    <span>
                      {((optimization.budget.used / optimization.budget.available) * 100).toFixed(1)}%
                      {optimization.budget.remaining < 0 && (
                        <span className="text-red-600 ml-2">
                          ({formatMeso(Math.abs(optimization.budget.remaining))} over)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      optimization.budget.remaining < 0 
                        ? 'bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500' 
                        : 'bg-gradient-to-r from-blue-500 to-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (optimization.budget.used / optimization.budget.available) * 100)}%` 
                    }}
                  />
                  {optimization.budget.remaining < 0 && (
                    <div 
                      className="h-3 bg-red-500 opacity-60 rounded-r-full -mt-3 ml-auto"
                      style={{ 
                        width: `${Math.min(50, ((Math.abs(optimization.budget.remaining)) / optimization.budget.available) * 100)}%` 
                      }}
                    />
                  )}
                </div>
                {optimization.budget.remaining < 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-maplestory">
                    ⚠️ Budget exceeded. Consider increasing budget or reducing targets for within-budget completion.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-maplestory">
                <Clock className="w-5 h-5 text-blue-600" />
                Complete Step-by-Step Roadmap
              </CardTitle>
              {optimization.actionPlan.some(step => step.remainingBudget < 0) && (
                <div className="text-sm text-muted-foreground font-maplestory">
                  Shows complete roadmap to all targets. Steps with red indicators exceed your current budget.
                </div>
              )}
            </CardHeader>
            <CardContent>
              {(() => {
                const withinBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget >= 0);
                const overBudgetSteps = optimization.actionPlan.filter(step => step.remainingBudget < 0);
                
                return (
                  <div>
                    {/* Budget Summary - only show if there are over-budget steps */}
                    {overBudgetSteps.length > 0 && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 font-maplestory">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Budget Overview</span>
                        </div>
                        <div className="text-sm text-amber-700 mt-1 font-maplestory">
                          {withinBudgetSteps.length} steps within budget, {overBudgetSteps.length} steps over budget.
                          Over-budget steps require additional {formatMeso(Math.abs(Math.min(...overBudgetSteps.map(s => s.remainingBudget))))} funding.
                        </div>
                      </div>
                    )}
              
                    <div className="space-y-3">
                      {optimization.actionPlan.map((step, index) => {
                        const equipment = findEquipmentByAction(step.action);
                        const isOverBudget = step.remainingBudget < 0;
                        const borderClass = isOverBudget ? 'border-red-200 bg-red-50/50' : 'border-border bg-background';
                        
                        return (
                          <div key={index} className={`flex items-center gap-4 p-4 border rounded-lg ${borderClass}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-maplestory ${
                              isOverBudget ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-primary text-primary-foreground'
                            }`}>
                              {step.step}
                            </div>
                            
                            {equipment && (
                              <div className="flex-shrink-0">
                                <EquipmentImage 
                                  src={equipment.image}
                                  alt={equipment.name || equipment.slot}
                                  size="sm"
                                  className="w-8 h-8" 
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium font-maplestory">{step.action}</span>
                                <Badge className={`text-xs ${getRiskColor(step.riskLevel)} font-maplestory`}>
                                  {step.riskLevel} Risk
                                </Badge>
                                {step.specialNote && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 font-maplestory">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Event
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                <span className="font-maplestory">{step.fromStar}★ → {step.toStar}★</span>
                                <span className="font-maplestory">Cost: {formatMeso(step.expectedCost)}</span>
                                <span className="font-maplestory">Booms: {step.expectedBooms.toFixed(2)}</span>
                                <span className={`font-maplestory ${step.remainingBudget < 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {step.remainingBudget < 0 ? 'Over Budget: ' : 'Remaining: '}
                                  {formatMeso(Math.abs(step.remainingBudget))}
                                </span>
                              </div>
                              
                              {step.specialNote && (
                                <div className={`mt-2 text-sm font-medium font-maplestory ${getSpecialNoteStyle(step.specialNote)}`}>
                                  {step.specialNote}
                                </div>
                              )}
                            </div>
                            
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {optimization.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-maplestory">
                  <Award className="w-5 h-5 text-purple-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimization.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <div className="flex items-start gap-3">
                        {getRecommendationIcon(rec.type)}
                        <div>
                          <AlertDescription className="font-maplestory">
                            {rec.message}
                          </AlertDescription>
                          <Badge variant="outline" className="text-xs mt-1 font-maplestory">
                            {rec.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Benefits */}
          {optimization.analysis.eventBenefits && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-maplestory">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Event Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 font-maplestory">
                      {optimization.analysis.eventBenefits.guaranteedSuccesses}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory">Guaranteed Successes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 font-maplestory">
                      {formatMeso(optimization.analysis.eventBenefits.mesoSaved)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory">Meso Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground font-maplestory">Risk Reduction</div>
                    <div className="text-sm font-medium text-green-600 font-maplestory">
                      {optimization.analysis.eventBenefits.riskReduced}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

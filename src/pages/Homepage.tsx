import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Users, 
  Target, 
  Coins, 
  Calculator,
  BarChart3,
  Zap,
  TrendingUp,
  ArrowRight,
  Crown,
  Sword,
  Shield
} from "lucide-react";
import { loadFromLocalStorage } from "@/lib/utils";

export default function Homepage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [starForceItems, setStarForceItems] = useState<Equipment[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const stored = loadFromLocalStorage();
    if (stored) {
      setCharacters(stored.characters);
      setStarForceItems(stored.starForceItems);
    }
  }, []);

  // Calculate overview stats
  const totalCharacters = characters.length;
  const totalEquipment = characters.reduce((sum, char) => sum + char.equipment.length, 0);
  const incompleteEquipment = characters.reduce(
    (sum, char) => sum + char.equipment.filter(eq => eq.starforceable && eq.currentStarForce < eq.targetStarForce).length, 
    0
  );
  const completionRate = totalEquipment > 0 ? ((totalEquipment - incompleteEquipment) / totalEquipment * 100) : 0;

  const quickActions = [
    // Removed unused overview and settings routes
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-3xl" />
        <div className="relative px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* App Logo/Title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Star className="w-12 h-12 text-yellow-400" />
                <Zap className="w-6 h-6 text-blue-400 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                StarForce Planner
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plan, track, and optimize your MapleStory StarForce journey across all your characters. 
              Save your progress, calculate costs with spares management, and achieve your enhancement goals with confidence.
            </p>

            {/* Quick Stats */}
            {totalCharacters > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Characters</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalCharacters}</p>
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Equipment</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalEquipment}</p>
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Progress</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{Math.round(completionRate)}%</p>
                </div>
              </div>
            )}

            {/* Primary Call to Action */}
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 mb-3"
                onClick={() => navigate('/characters')}
              >
                <Users className="w-5 h-5 mr-2" />
                {totalCharacters > 0 ? 'Manage Characters' : 'Get Started'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Or explore all planning options below
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Planning Comparison Section */}
      <div className="px-6 py-16 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Planning Style</h2>
            <p className="text-lg text-muted-foreground">
              Quick calculations for immediate needs or comprehensive character management for long-term success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quick Planning */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Calculator className="w-6 h-6 text-orange-400" />
                  <CardTitle className="text-xl">Quick Calculator</CardTitle>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                    Session-based
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect for instant calculations and one-time planning sessions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-orange-400" />
                    Instant calculations with preset templates
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4 text-orange-400" />
                    StarForce event support (5/10/15, 30% off)
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-orange-400" />
                    Basic cost and success rate calculations
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4 text-center">✗</span>
                    No data persistence or character tracking
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4 text-center">✗</span>
                    No spare management or advanced planning
                  </div>
                </div>
                <Button variant="outline" className="w-full border-orange-500/30 hover:bg-orange-500/10" onClick={() => navigate('/quick-planning')}>
                  Try Quick Calculator
                </Button>
              </CardContent>
            </Card>
            
            {/* Character Management */}
            <Card className="bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/20 ring-2 ring-primary/30 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1">
                  Recommended
                </Badge>
              </div>
              <CardHeader className="pt-8">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-primary" />
                  <CardTitle className="text-xl">Character Management</CardTitle>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    Long-term
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive planning with persistent data and advanced features
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    Persistent data storage across sessions
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-primary" />
                    Multiple character tracking and management
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="w-4 h-4 text-primary" />
                    <strong>Advanced spare management and cost planning</strong>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Progress tracking and completion analytics
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Long-term planning with equipment progression
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => navigate('/characters')}>
                  {totalCharacters > 0 ? 'Manage Characters' : 'Start Long-Term Planning'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Why Choose StarForce Planner?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Advanced Cost Planning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed spare management, boom probability calculations, and comprehensive cost breakdowns with event support for optimal meso planning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Persistent Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All your character data, equipment, and spare counts are automatically saved locally. Pick up exactly where you left off.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Smart Organization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visual equipment grids, multi-character management, and intelligent progress tracking across your entire MapleStory account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

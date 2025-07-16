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
  Import,
  Settings,
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
    {
      title: "Manage Characters",
      description: "Add, edit, and organize your MapleStory characters and their equipment",
      icon: Users,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      route: "/characters",
      stats: `${totalCharacters} characters`
    },
    {
      title: "StarForce Planning",
      description: "Calculate costs and plan your StarForce upgrades across all characters",
      icon: Calculator,
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30", 
      route: "/planning",
      stats: `${incompleteEquipment} items pending`
    },
    {
      title: "Progress Overview",
      description: "View detailed statistics and progress across your entire account",
      icon: BarChart3,
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      route: "/overview",
      stats: `${Math.round(completionRate)}% complete`
    },
    {
      title: "Import & Export",
      description: "Backup your data or share configurations with other players",
      icon: Import,
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      route: "/import-export",
      stats: "Data management"
    }
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
              The ultimate tool for planning and tracking your MapleStory StarForce upgrades. 
              Optimize your meso spending and achieve your enhancement goals efficiently.
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

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => navigate(totalCharacters > 0 ? '/overview' : '/characters')}
            >
              {totalCharacters > 0 ? (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Overview
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Get Started
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/50"
                onClick={() => navigate(action.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${action.color} shrink-0`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {action.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {action.stats}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Smart Calculations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms calculate expected costs, boom rates, and optimal upgrade paths for all your equipment.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Sword className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Equipment Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track equipment across multiple characters with visual equipment grids and smart organization tools.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Event Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built-in support for StarForce events like 5/10/15 success rates and 30% cost reductions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

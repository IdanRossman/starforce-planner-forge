import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Character, Equipment } from "@/types";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Hero Section - Centered Content */}
      <div className="text-center max-w-4xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight whitespace-nowrap">
          Maple Forge Planner
        </h1>
        
        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-200 mb-12 font-light drop-shadow-lg">
          Plan and optimize your MapleStory Progression journey.
        </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all"
              onClick={() => navigate('/characters')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm shadow-xl"
              onClick={() => navigate('/quick-planning')}
            >
              Quick Calculator
            </Button>
          </div>

          {/* Stats - Only if user has data */}
          {totalCharacters > 0 && (
            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{totalCharacters}</p>
                <p className="text-sm text-gray-300 mt-1">Characters</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{totalEquipment}</p>
                <p className="text-sm text-gray-300 mt-1">Equipment</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{Math.round(completionRate)}%</p>
                <p className="text-sm text-gray-300 mt-1">Complete</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

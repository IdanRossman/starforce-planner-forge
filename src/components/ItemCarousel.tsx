import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EquipmentSlot, Equipment } from "@/types";
import { getEquipmentBySlotAndJob, getEquipmentBySlot } from "@/services/equipmentService";
import { ItemCard } from "./ItemCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";

interface ItemCarouselProps {
  slot: EquipmentSlot;
  slotLabel: string;
  selectedItem?: Equipment | null;
  onSelectItem: (item: Equipment | null) => void;
  job?: string; // Optional job for filtering
  className?: string;
  currentStarForce?: number;
  onCurrentStarForceChange?: (stars: number) => void;
}

export function ItemCarousel({ 
  slot, 
  slotLabel,
  selectedItem, 
  onSelectItem,
  job,
  className = "",
  currentStarForce = 0,
  onCurrentStarForceChange
}: ItemCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local');
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const displayedItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Check if selected item is starforceable
  const isStarforceable = selectedItem?.starforceable ?? false;

  // Fetch equipment when slot or job changes
  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      setCurrentPage(0); // Reset to first page on new data
      try {
        const result = job 
          ? await getEquipmentBySlotAndJob(slot, job)
          : await getEquipmentBySlot(slot);
        
        setItems(result.equipment);
        setDataSource(result.source);
      } catch (error) {
        console.error('Failed to fetch equipment:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [slot, job]);

  const scroll = (direction: 'left' | 'right') => {
    setScrollDirection(direction);
    
    if (direction === 'left' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'right' && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
    
    // Reset scroll direction after animation
    setTimeout(() => setScrollDirection(null), 400);
  };

  const handleStarForceChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
      onCurrentStarForceChange?.(numValue);
    } else if (value === '') {
      onCurrentStarForceChange?.(0);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Slot Label */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground font-maplestory flex items-center gap-2">
          {slotLabel}
        </h3>
        {selectedItem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectItem(null)}
            className="h-6 text-xs font-maplestory"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-24 bg-muted/20 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-24 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground font-maplestory">No equipment available</p>
        </div>
      ) : (
        /* Carousel with SF Input */
        <div className="flex gap-3 items-start">
          {/* Left Arrow - Outside carousel */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('left')}
            disabled={currentPage === 0}
            className="mt-8 h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Carousel Container */}
          <div className="flex-1 min-w-0">
            {/* Scrollable Container */}
            <div className="overflow-hidden p-2 -m-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPage}
                  initial={{ 
                    x: scrollDirection === 'left' ? -200 : scrollDirection === 'right' ? 200 : 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: 0,
                    opacity: 1 
                  }}
                  exit={{ 
                    x: scrollDirection === 'left' ? 200 : scrollDirection === 'right' ? -200 : 0,
                    opacity: 0 
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }}
                  className="flex gap-3 pb-2"
                >
                  {displayedItems.map((item, index) => {
                    // More robust selection check - compare name and slot
                    const isItemSelected = selectedItem && (
                      (selectedItem.id === item.id) ||
                      (selectedItem.name === item.name && selectedItem.slot === item.slot)
                    );
                    
                    return (
                      <ItemCard
                        key={`${item.id}-${index}`}
                        item={item}
                        isSelected={!!isItemSelected}
                        onClick={() => onSelectItem(item)}
                        size="md"
                      />
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Page Indicator */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentPage 
                        ? 'w-6 bg-primary' 
                        : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Arrow - Outside carousel */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('right')}
            disabled={currentPage >= totalPages - 1}
            className="mt-8 h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Current StarForce Input - Only show for starforceable items */}
          {isStarforceable && selectedItem && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-2 min-w-[120px]"
            >
              <label className="text-xs font-semibold text-muted-foreground font-maplestory flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                Current SF
              </label>
              <Input
                type="number"
                min="0"
                max="25"
                value={currentStarForce}
                onChange={(e) => handleStarForceChange(e.target.value)}
                className="h-10 font-maplestory text-center text-lg font-bold"
                placeholder="0"
              />
              <div className="flex gap-1 flex-wrap">
                {[0, 12, 17, 22].map((sfValue) => (
                  <Button
                    key={sfValue}
                    variant="outline"
                    size="sm"
                    onClick={() => onCurrentStarForceChange?.(sfValue)}
                    className={`h-6 px-2 text-xs font-maplestory ${
                      currentStarForce === sfValue 
                        ? 'bg-primary/20 border-primary' 
                        : ''
                    }`}
                  >
                    {sfValue}★
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

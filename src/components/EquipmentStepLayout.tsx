import { Equipment, EquipmentSlot } from "@/types";
import { EquipmentGrid } from "./EquipmentGrid";
import { Card, CardContent } from "./ui/card";

interface EquipmentStepLayoutProps {
  equipment: Equipment[];
  children: React.ReactNode;
  className?: string;
}

export function EquipmentStepLayout({ 
  equipment, 
  children,
  className = "" 
}: EquipmentStepLayoutProps) {
  // Dummy handlers for the grid (read-only mode)
  const handleEdit = () => {};
  const handleAdd = () => {};
  const handleClear = () => {};

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 ${className}`}>
      {/* Left Side - Equipment Grid (Read-only preview) */}
      <Card className="lg:col-span-2 bg-white/5 backdrop-blur-md border-border/50">
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground font-maplestory">
              Equipment Preview
            </h3>
            <p className="text-xs text-muted-foreground font-maplestory">
              Your selections will appear here
            </p>
          </div>
          <EquipmentGrid
            equipment={equipment}
            onEditEquipment={handleEdit}
            onAddEquipment={handleAdd}
            onClearEquipment={handleClear}
          />
        </CardContent>
      </Card>

      {/* Right Side - Equipment Selection */}
      <Card className="lg:col-span-3 bg-white/5 backdrop-blur-md border-border/50">
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PotentialTableHeader() {
  return (
    <TableHeader className="sticky top-0 bg-background z-10 border-b">
      <TableRow className="bg-muted/50">
        <TableHead className="font-maplestory">Item</TableHead>
        <TableHead className="text-center font-maplestory">Current</TableHead>
        <TableHead className="text-center font-maplestory">Target</TableHead>
        <TableHead className="text-center font-maplestory">Cube Type</TableHead>
        <TableHead className="text-center font-maplestory">Avg Cost</TableHead>
        <TableHead className="text-center font-maplestory">Median Cost</TableHead>
        <TableHead className="text-center font-maplestory">75th % Cost</TableHead>
        <TableHead className="text-center font-maplestory">Avg Cubes</TableHead>
        <TableHead className="text-center font-maplestory">Median Cubes</TableHead>
        <TableHead className="text-center font-maplestory">75th % Cubes</TableHead>
        <TableHead className="text-center font-maplestory">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

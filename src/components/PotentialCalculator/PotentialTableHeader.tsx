import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PotentialTableHeader() {
  return (
    <TableHeader className="bg-[hsl(217_33%_7%)]">
      {/* Superheader row */}
      <TableRow className="border-b border-white/8 hover:bg-transparent">
        <TableHead className="py-1.5" colSpan={4} />
        <TableHead className="py-1.5 text-center" colSpan={3}>
          <span className="text-[9px] text-primary/40 uppercase tracking-widest font-maplestory">Cost</span>
        </TableHead>
        <TableHead className="py-1.5 text-center" colSpan={3}>
          <span className="text-[9px] text-amber-400/40 uppercase tracking-widest font-maplestory">Cubes</span>
        </TableHead>
        <TableHead className="py-1.5" />
      </TableRow>

      {/* Column header row */}
      <TableRow className="border-b border-white/8 hover:bg-transparent">
        <TableHead className="py-2 pl-4">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Item</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Current</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Target</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Cube Type</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Avg</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Med</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">75th%</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Avg</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Med</span>
        </TableHead>
        <TableHead className="py-2 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">75th%</span>
        </TableHead>
        <TableHead className="py-2 pr-4 text-center">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-maplestory">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

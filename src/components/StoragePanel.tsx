import { useState } from 'react';
import { Equipment, EquipmentSlot, StorageItem } from '@/types';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EquipmentImage } from '@/components/EquipmentImage';
import { EquipmentForm, StorageSaveData } from '@/components/EquipmentForm';
import { Star, Plus, X, Package, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type SortKey = 'none' | 'type' | 'name' | 'starforce' | 'level';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'none', label: 'Default' },
  { value: 'type', label: 'Type' },
  { value: 'name', label: 'Name' },
  { value: 'starforce', label: 'StarForce' },
  { value: 'level', label: 'Level' },
];

// Maps catalog itemType (API types) → a valid EquipmentSlot for the form slot picker
const ITEM_TYPE_TO_SLOT: Record<string, EquipmentSlot> = {
  ring: 'ring1', pendant: 'pendant1', earrings: 'earring',
  weapon: 'weapon', secondary: 'secondary', emblem: 'emblem',
  hat: 'hat', top: 'top', bottom: 'bottom', overall: 'overall',
  shoes: 'shoes', gloves: 'gloves', cape: 'cape', belt: 'belt', shoulder: 'shoulder',
  face: 'face', eye: 'eye', earring: 'earring',
  pocket: 'pocket', heart: 'heart', badge: 'badge', medal: 'medal',
};

function storageItemToEquipment(item: StorageItem): Equipment {
  const slot = ITEM_TYPE_TO_SLOT[item.itemType ?? ''] ?? 'medal';
  return {
    id: item.id,
    catalogId: item.catalogId,
    name: item.name,
    set: item.set,
    slot,
    type: item.type,
    level: item.level,
    starforceable: item.starforceable,
    currentStarForce: item.currentStarForce,
    targetStarForce: item.targetStarForce,
    currentPotentialValue: item.currentPotential,
    targetPotentialValue: item.targetPotential,
    image: item.image,
    itemType: item.itemType,
  };
}

const TOTAL_CAPACITY = 100;
const EMPTY_SLOT_BUFFER = 8;

interface StoragePanelProps {
  characterId?: string;
  selectedJob?: string;
  equippedCount: number;
}

export function StoragePanel({ characterId, selectedJob, equippedCount }: StoragePanelProps) {
  const { selectedCharacter, addStorageItem, updateStorageItem, removeStorageItem } = useCharacterContext();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('none');

  const storageItems = selectedCharacter?.storageItems ?? [];
  const usedSlots = equippedCount + storageItems.length;
  const remaining = TOTAL_CAPACITY - usedSlots;

  const sortedItems = [...storageItems].sort((a, b) => {
    switch (sortKey) {
      case 'type': return (a.itemType ?? '').localeCompare(b.itemType ?? '');
      case 'name': return (a.name ?? '').localeCompare(b.name ?? '');
      case 'starforce': return b.currentStarForce - a.currentStarForce;
      case 'level': return b.level - a.level;
      default: return 0;
    }
  });

  const emptySlots = Math.min(EMPTY_SLOT_BUFFER, TOTAL_CAPACITY - storageItems.length);

  const handleOpenAdd = () => {
    if (remaining <= 0) {
      toast.error('Storage is full (100/100 items).');
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: StorageItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleSaveStorage = async (data: StorageSaveData) => {
    if (!characterId) return;
    try {
      if (editingItem) {
        await updateStorageItem(characterId, editingItem.id, {
          catalogId: data.catalogId || editingItem.catalogId,
          currentStarForce: data.currentStarForce,
          targetStarForce: data.targetStarForce,
          currentPotential: data.currentPotential,
          targetPotential: data.targetPotential,
        });
        toast.success('Storage item updated.');
      } else {
        await addStorageItem(characterId, {
          catalogId: data.catalogId,
          currentStarForce: data.currentStarForce,
          targetStarForce: data.targetStarForce,
          currentPotential: data.currentPotential,
          targetPotential: data.targetPotential,
          name: data.name,
          set: data.set,
          image: data.image,
          level: data.level,
          starforceable: data.starforceable,
          itemType: data.itemType,
          type: data.type,
        });
        toast.success('Item added to storage.');
      }
      setFormOpen(false);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        toast.error('Storage is full (100/100 items).');
      } else {
        toast.error('Failed to save storage item.');
      }
    }
  };

  const handleDelete = async (item: StorageItem) => {
    if (!characterId) return;
    try {
      await removeStorageItem(characterId, item.id);
      toast.success('Item removed from storage.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-maplestory">Storage</span>
          <span className="text-[11px] text-white/40 font-maplestory">{usedSlots} / {TOTAL_CAPACITY}</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-maplestory transition-colors bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/8">
                {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[hsl(217_33%_9%/0.98)] border-white/10 min-w-[110px]">
              {SORT_OPTIONS.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setSortKey(opt.value)}
                  className={`text-xs font-maplestory cursor-pointer ${sortKey === opt.value ? 'text-primary' : 'text-white/60'}`}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            disabled={remaining <= 0}
            className="flex items-center gap-1.5 font-maplestory rounded-lg h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90"
          >
            <Plus className="w-3 h-3" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-[hsl(217_33%_9%/0.97)] rounded-xl border border-primary/15 p-2">
        <div className="grid grid-cols-5 gap-1 overflow-y-auto xl:max-h-[580px]">
          {sortedItems.map(item => (
            <StorageSlot
              key={item.id}
              item={item}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <EmptyStorageSlot key={`empty-${i}`} />
          ))}
        </div>
      </div>

      {/* EquipmentForm in storage mode */}
      <EquipmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        storageMode
        onSaveStorage={handleSaveStorage}
        onSave={() => {}}
        selectedJob={selectedJob}
        allowSlotEdit
        equipment={editingItem ? storageItemToEquipment(editingItem) : undefined}
      />
    </>
  );
}

function StorageSlot({ item, onEdit, onDelete }: { item: StorageItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card
      className="relative group cursor-pointer bg-white/8 border-white/10 hover:bg-white/12 hover:border-white/20 hover:shadow-md hover:shadow-black/30 transition-all duration-150"
      onClick={onEdit}
    >
      <CardContent className="p-0 h-[78px] w-full flex items-center justify-center relative">
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
          <EquipmentImage
            src={item.image}
            alt={item.name || item.set || 'Storage item'}
            size="md"
            fallbackIcon={() => <Package className="w-4 h-4" />}
            className="shrink-0"
          />
          {item.starforceable && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-semibold text-[10px]">{item.currentStarForce}</span>
              {item.targetStarForce > item.currentStarForce && (
                <>
                  <span className="text-white/50 text-[10px]">→</span>
                  <span className="text-primary font-semibold text-[10px]">{item.targetStarForce}</span>
                </>
              )}
            </div>
          )}
        </div>
        {/* Delete button */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="p-0.5 h-auto w-auto text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <X className="w-2 h-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStorageSlot() {
  return (
    <div className="h-10 rounded-lg border border-dashed border-white/6 bg-white/2" />
  );
}

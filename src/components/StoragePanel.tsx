import { useState } from 'react';
import { Equipment, EquipmentSlot, StorageItem } from '@/types';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EquipmentImage } from '@/components/EquipmentImage';
import { EquipmentForm, StorageSaveData } from '@/components/EquipmentForm';
import { Star, Plus, X, Package, ArrowUpDown } from 'lucide-react';
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
const MIN_VISIBLE_SLOTS = 40;

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

  const visibleSlotCount = Math.max(storageItems.length + 8, MIN_VISIBLE_SLOTS);
  const emptySlots = visibleSlotCount - storageItems.length;

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
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold font-maplestory">Storage</span>
          <Badge variant="secondary" className="text-xs font-maplestory">
            {usedSlots} / {TOTAL_CAPACITY}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex gap-0.5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortKey(opt.value)}
                  className={`text-[10px] px-2 py-1 rounded-full font-maplestory transition-colors ${
                    sortKey === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/10 text-muted-foreground hover:bg-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            disabled={remaining <= 0}
            className="flex items-center gap-1.5 font-maplestory rounded-full h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card/30 rounded-lg border border-border/50 p-2">
        <div className="grid grid-cols-8 gap-1 max-h-[500px] overflow-y-auto">
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
      className="relative group cursor-pointer bg-gradient-to-br from-card to-card/80 hover:scale-105 hover:shadow-md transition-all duration-200"
      onClick={onEdit}
    >
      <CardContent className="p-0 h-[74px] w-full flex items-center justify-center relative">
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
    <Card className="bg-muted/30 border-dashed border-muted">
      <CardContent className="p-0 h-[74px] w-full" />
    </Card>
  );
}

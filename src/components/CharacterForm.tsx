import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character } from '@/types';
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { fetchCharacterFromMapleRanks, Region } from '@/services/mapleRanksService';
import { CategorizedSelect, SelectCategory } from '@/components/shared';
import { FormFieldWrapper } from '@/components/shared/forms';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, X, Sparkles, User } from 'lucide-react';
import { createPortal } from 'react-dom';

const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(50, 'Name too long'),
  class: z.string().min(1, 'Character class is required'),
  level: z.coerce.number().min(1, 'Level must be at least 1').max(300, 'Level cannot exceed 300'),
  image: z.string().optional(),
  enableCallingCard: z.boolean().default(false),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterFormProps {
  onAddCharacter: (character: Omit<Character, 'id'>) => void;
  editingCharacter?: Character | null;
  onEditingChange?: (character: Character | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SearchStatus = 'idle' | 'found' | 'not-found' | 'error';


export function CharacterForm({
  onAddCharacter,
  editingCharacter,
  onEditingChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: CharacterFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [selectedRegion, setSelectedRegion] = useState<Region>('north-america');

  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('scale(0.95)');

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const classCategories = useMemo((): SelectCategory[] => {
    return Object.entries(ORGANIZED_CLASSES).map(([key, category]) => ({
      name: category.name,
      options: category.classes.map(cls => ({
        value: cls,
        label: cls,
        icon: getJobIcon(cls),
        colors: getJobColors(cls),
        badges: [{
          text: getJobCategoryName(cls),
          className: `text-xs px-1.5 py-0.5 rounded ${getJobColors(cls).bgMuted} ${getJobColors(cls).text}`
        }]
      }))
    }));
  }, []);

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: { name: '', class: '', level: 200, image: '', enableCallingCard: false },
  });

  const { isDirty } = form.formState;
  const watchImage = form.watch('image');
  const watchName = form.watch('name');
  const watchClass = form.watch('class');
  const watchLevel = form.watch('level');

  // Use editingCharacter image as immediate fallback before form hydrates
  const displayImage = watchImage || editingCharacter?.image;

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => { setOpacity(1); setTransform('scale(1)'); }, 10);
    } else {
      setOpacity(0);
      setTransform('scale(0.95)');
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [open]);

  useEffect(() => {
    if (editingCharacter) {
      form.reset({
        name: editingCharacter.name,
        class: editingCharacter.class,
        level: editingCharacter.level,
        image: editingCharacter.image || '',
        enableCallingCard: editingCharacter.enableCallingCard ?? false,
      });
      setSearchStatus('idle');
      setOpen(true);
      // Auto-fetch sprite on edit open
      if (editingCharacter.name) fetchFromNexon(editingCharacter.name);
    }
  }, [editingCharacter, form, setOpen]);

  const handleClose = () => {
    setOpen(false);
    onEditingChange?.(null);
    setSearchStatus('idle');
  };

  const fetchFromNexon = async (characterName: string, region: Region = selectedRegion) => {
    if (!characterName.trim()) return;
    setIsSearching(true);
    setSearchStatus('idle');
    try {
      const data = await fetchCharacterFromMapleRanks(characterName.trim(), region);
      if (data) {
        form.setValue('level', data.level, { shouldDirty: false });
        form.setValue('image', data.image, { shouldDirty: false });
        setSearchStatus('found');
      } else {
        setSearchStatus('not-found');
      }
    } catch {
      setSearchStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchClick = () => {
    fetchFromNexon(form.getValues('name'));
  };

  const handleTryEU = () => {
    setSelectedRegion('europe');
    fetchFromNexon(form.getValues('name'), 'europe');
  };

  const onSubmit = (data: CharacterFormData) => {
    onAddCharacter({
      name: data.name,
      class: data.class,
      level: data.level,
      image: data.image,
      enableCallingCard: data.enableCallingCard,
      equipment: editingCharacter?.equipment || [],
    });
    form.reset();
    handleClose();
  };

  const headerSubtitle = (() => {
    const cls = watchClass || editingCharacter?.class;
    const lvl = watchLevel || editingCharacter?.level;
    if (cls && lvl) return `${cls} · Lv.${lvl}`;
    if (cls) return cls;
    return editingCharacter ? editingCharacter.name : 'New character';
  })();

  const statusText = (() => {
    if (searchStatus === 'found') return '✓ Found on Nexon Ranking — level & sprite loaded';
    if (searchStatus === 'error') return 'Search failed — you can still continue manually';
    return null;
  })();

  const statusColor = searchStatus === 'found' ? 'text-green-400/60' : 'text-white/25';

  if (!isVisible) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        style={{ opacity, transition: 'opacity 0.2s ease' }}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm px-4 sm:px-0"
        style={{
          opacity,
          transform: `translate(-50%, -50%) ${transform}`,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div className="bg-[hsl(217_33%_9%)] border border-primary/20 rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
            <div className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white/20" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white font-maplestory truncate">
                {editingCharacter ? 'Edit Character' : 'Add New Character'}
              </p>
              <p className="text-[10px] text-white/40 font-maplestory uppercase tracking-wide truncate">
                {headerSubtitle}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-4 flex-1">

            {/* Sprite Preview */}
            {displayImage ? (
              <div className="flex justify-center mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <img
                  src={displayImage}
                  alt={watchName || editingCharacter?.name}
                  className="max-h-44 object-contain"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 24px rgba(100,200,255,0.2))'
                  }}
                  onError={(e) => { e.currentTarget.src = './characters/maple-admin.png'; }}
                />
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="w-28 h-36 rounded-xl border border-dashed border-white/10 bg-white/3 flex flex-col items-center justify-center gap-2">
                  <User className="w-6 h-6 text-white/10" />
                  <p className="text-[9px] text-white/20 font-maplestory text-center leading-relaxed">
                    Search your IGN<br />to load sprite
                  </p>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

                {/* Character Name + Region + Search */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-maplestory px-0.5">Character Name</p>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <input
                            {...field}
                            placeholder="Enter your IGN..."
                            onChange={(e) => { field.onChange(e); setSearchStatus('idle'); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchClick(); } }}
                            className="flex-1 h-9 px-3 rounded-lg border border-white/15 text-sm font-maplestory text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                          />
                          {/* Region toggle */}
                          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-lg border border-white/15 shrink-0">
                            {(['north-america', 'europe'] as Region[]).map(r => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setSelectedRegion(r)}
                                className={`px-2.5 h-8 rounded-md font-maplestory text-[10px] font-semibold transition-all ${
                                  selectedRegion === r
                                    ? 'bg-white/15 text-white shadow-sm'
                                    : 'text-white/40 hover:text-white/70'
                                }`}
                              >
                                {r === 'north-america' ? 'NA' : 'EU'}
                              </button>
                            ))}
                          </div>
                          {/* Search button */}
                          <button
                            type="button"
                            onClick={handleSearchClick}
                            disabled={!field.value?.trim() || isSearching}
                            className="px-2.5 h-9 rounded-lg border border-white/15 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                            title="Search on Nexon Ranking"
                          >
                            {isSearching
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Search className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>

                        {/* Status line — only shown when there's feedback */}
                        {(statusText || searchStatus === 'not-found') && (
                          <div className="flex items-center gap-2 mt-1 px-0.5">
                            {statusText && (
                              <p className={`text-[10px] font-maplestory flex-1 ${statusColor}`}>
                                {statusText}
                              </p>
                            )}
                            {searchStatus === 'not-found' && selectedRegion === 'north-america' && (
                              <button
                                type="button"
                                onClick={handleTryEU}
                                className="text-[10px] font-maplestory text-primary/70 hover:text-primary underline transition-colors shrink-0"
                              >
                                Try EU instead
                              </button>
                            )}
                            {searchStatus === 'not-found' && selectedRegion === 'europe' && (
                              <p className="text-[10px] font-maplestory text-white/30">
                                Not found in EU — enter details manually
                              </p>
                            )}
                          </div>
                        )}

                        <FormMessage className="text-[10px] font-maplestory" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Class + Level inline */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-maplestory px-0.5">Class</p>
                    <FormFieldWrapper name="class" label="" control={form.control} hideLabel>
                      {(field) => (
                        <CategorizedSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a class"
                          categories={classCategories}
                          className="bg-white/8 border-white/15 font-maplestory w-full"
                          variant="dark"
                          renderSelectedValue={(option) => (
                            <div className="flex items-center gap-2">
                              {option.icon && option.colors && (
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${option.colors.bg} flex items-center justify-center shrink-0`}>
                                  <option.icon className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <span className="text-white font-maplestory truncate">{option.label}</span>
                            </div>
                          )}
                        />
                      )}
                    </FormFieldWrapper>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-maplestory px-0.5">Level</p>
                    <FormFieldWrapper name="level" label="" control={form.control} hideLabel>
                      {(field) => (
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg border border-white/15 text-sm font-maplestory text-white focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        />
                      )}
                    </FormFieldWrapper>
                  </div>
                </div>

                {/* AI Calling Card */}
                <FormField
                  control={form.control}
                  name="enableCallingCard"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400/70" />
                          <div>
                            <FormLabel className="text-xs font-medium text-white/70 font-maplestory cursor-pointer">
                              AI Calling Card
                            </FormLabel>
                            <p className="text-[10px] text-white/30 font-maplestory">Generate an AI image for this character</p>
                          </div>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/8 shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-sm font-maplestory rounded-lg text-white/40 hover:text-white/70 hover:bg-white/8 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={editingCharacter ? !isDirty : false}
              className="px-5 py-1.5 text-sm font-maplestory rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingCharacter ? 'Save Changes' : 'Create Character'}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}

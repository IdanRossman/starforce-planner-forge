import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character } from '@/types';
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { fetchCharacterFromMapleRanks } from '@/services/mapleRanksService';
import { CategorizedSelect, SelectCategory, MapleButton, MapleDialog } from '@/components/shared';
import { MapleInput } from '@/components/shared/forms';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Search, X } from 'lucide-react';

const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(50, 'Name too long'),
  class: z.string().min(1, 'Character class is required'),
  level: z.coerce.number().min(1, 'Level must be at least 1').max(300, 'Level cannot exceed 300'),
  image: z.string().optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterFormProps {
  onAddCharacter: (character: Omit<Character, 'id'>) => void;
  editingCharacter?: Character | null;
  onEditingChange?: (character: Character | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MAPLE_CLASSES = [
  'Hero', 'Paladin', 'Dark Knight', 
  'Fire/Poison Mage', 'Ice/Lightning Mage', 'Bishop', 
  'Bowmaster', 'Marksman', 'Pathfinder',
  'Night Lord', 'Shadower', 'Dual Blade',
  'Buccaneer', 'Corsair', 'Cannoneer',
  'Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker',
  'Aran', 'Evan', 'Mercedes', 'Phantom', 'Luminous', 'Shade',
  'Blaster', 'Battle Mage', 'Wild Hunter', 'Mechanic', 'Xenon', 'Demon Slayer', 'Demon Avenger',
  'Kaiser', 'Angelic Buster', 'Cadena', 'Kain', 'Illium', 'Ark', 'Adele', 'Khali', 'Lara',
  'Zero', 'Kinesis', 'Hayato', 'Kanna', 'Beast Tamer'
];

export function CharacterForm({ onAddCharacter, editingCharacter, onEditingChange, open: externalOpen, onOpenChange: externalOnOpenChange }: CharacterFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [characterNotFound, setCharacterNotFound] = useState(false);
  
  // Animation states for MapleDialog
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('translateY(-20px)');

  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  // Transform ORGANIZED_CLASSES into CategorizedSelect format
  const classCategories = useMemo((): SelectCategory[] => {
    return Object.entries(ORGANIZED_CLASSES).map(([key, category]) => ({
      name: category.name,
      options: category.classes.map(cls => ({
        value: cls,
        label: cls,
        icon: getJobIcon(cls),
        colors: getJobColors(cls),
        badges: [
          {
            text: getJobCategoryName(cls),
            className: `text-xs px-1.5 py-0.5 rounded ${getJobColors(cls).bgMuted} ${getJobColors(cls).text}`
          }
        ]
      }))
    }));
  }, []);

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      class: '',
      level: 200,
      image: '',
    },
  });

  // Handle character name changes to clear image when name is cleared
  const handleCharacterNameChange = (value: string) => {
    // If the name is cleared or changed, remove the image and clear not found state
    if (!value.trim()) {
      form.setValue('image', '');
    }
    setCharacterNotFound(false); // Reset not found state when typing
  };

  // Handle MapleRanks character lookup
  const handleCharacterNameBlur = async () => {
    const characterName = form.getValues('name');
    if (!characterName.trim()) return; // Don't fetch if name is empty
    
    await fetchFromMapleRanks(characterName.trim());
  };

  // Separate function for manual search
  const fetchFromMapleRanks = async (characterName: string) => {
    setIsLoadingCharacter(true);
    setCharacterNotFound(false); // Reset not found state
    try {
      const mapleRanksData = await fetchCharacterFromMapleRanks(characterName);
      if (mapleRanksData) {
        // Auto-populate fields with MapleRanks data
        form.setValue('class', mapleRanksData.class);
        form.setValue('level', mapleRanksData.level);
        form.setValue('image', mapleRanksData.image);
        setCharacterNotFound(false);
      } else {
        // Character not found
        setCharacterNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching character from MapleRanks:', error);
      setCharacterNotFound(true);
    } finally {
      setIsLoadingCharacter(false);
    }
  };

  // Handle manual search button click
  const handleSearchClick = () => {
    const characterName = form.getValues('name');
    if (characterName.trim()) {
      fetchFromMapleRanks(characterName.trim());
    }
  };

  // Update form when editing character changes
  useEffect(() => {
    if (editingCharacter) {
      form.reset({
        name: editingCharacter.name,
        class: editingCharacter.class,
        level: editingCharacter.level,
        image: editingCharacter.image || '',
      });
      setOpen(true);
    }
  }, [editingCharacter, form, setOpen]);

  const onSubmit = (data: CharacterFormData) => {
    const newCharacter: Omit<Character, 'id'> = {
      name: data.name,
      class: data.class,
      level: data.level,
      image: data.image,
      equipment: editingCharacter?.equipment || [], // Preserve equipment when editing
    };
    onAddCharacter(newCharacter);
    form.reset();
    setOpen(false);
    onEditingChange?.(null); // Reset editing state
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setOpen(true);
      setIsVisible(true);
      // Start animation
      setTimeout(() => {
        setOpacity(1);
        setTransform('translateY(0px)');
      }, 50);
      
      if (!editingCharacter) {
        // Reset form when opening for a new character (not editing)
        form.reset({
          name: '',
          class: '',
          level: 200,
          image: '',
        });
        setCharacterNotFound(false); // Reset not found state
      }
    } else {
      // Start close animation
      setOpacity(0);
      setTransform('translateY(-20px)');
      setTimeout(() => {
        setIsVisible(false);
        setOpen(false);
        onEditingChange?.(null); // Reset editing state when dialog closes
        setCharacterNotFound(false); // Reset not found state
      }, 300);
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  // Handle animation when open state changes externally
  useEffect(() => {
    if (open && !isVisible) {
      setIsVisible(true);
      setTimeout(() => {
        setOpacity(1);
        setTransform('translateY(0px)');
      }, 50);
    } else if (!open && isVisible) {
      setOpacity(0);
      setTransform('translateY(-20px)');
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [open, isVisible]);

  return (
    <>
      {/* Trigger Button */}
      <MapleButton 
        variant="blue" 
        size="md"
        onClick={() => handleOpenChange(true)}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Character
      </MapleButton>

      {/* MapleStory-styled Character Form Dialog */}
      <MapleDialog
        isVisible={isVisible}
        opacity={opacity}
        transform={transform}
        position="center"
        minWidth="500px"
        className="max-w-2xl"
        character={form.watch('image') ? {
          name: form.watch('name') || 'New Character',
          image: form.watch('image')
        } : undefined}
        bottomLeftActions={
          <MapleButton 
            variant="green" 
            size="sm" 
            onClick={handleClose}
          >
            END CHAT
          </MapleButton>
        }
        bottomRightActions={
          <MapleButton 
            variant="green" 
            size="sm" 
            onClick={form.handleSubmit(onSubmit)}
          >
            {editingCharacter ? 'Update Character' : 'Create Character'}
          </MapleButton>
        }
      >
        {/* Form Content */}
        <div className="w-full h-full flex flex-col space-y-4 p-2">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-black font-maplestory">
              {editingCharacter ? 'Edit Character' : 'Add New Character'}
            </h2>
            <p className="text-sm text-gray-700 font-maplestory">
              {editingCharacter ? 'Update character information.' : 'Create a new character to track their StarForce progress.'}
            </p>
          </div>

          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <MapleInput
                      title="Character Name"
                      placeholder="Enter character name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleCharacterNameChange(e.target.value);
                      }}
                      onBlur={handleCharacterNameBlur}
                      isLoading={isLoadingCharacter}
                      underText={
                        <span className="flex items-center gap-1">
                          Auto-lookup from MapleRanks 
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Beta
                          </span>
                        </span>
                      }
                      errorMessage={characterNotFound && !isLoadingCharacter ? 
                        "Character not found on MapleRanks. You can still create the character manually." : 
                        undefined
                      }
                      searchButton={{
                        icon: <Search className="h-3 w-3" />,
                        onClick: handleSearchClick,
                        disabled: !field.value?.trim(),
                        title: "Search on MapleRanks",
                        variant: "orange"
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black font-maplestory font-medium">Class</FormLabel>
                    <FormControl>
                      <CategorizedSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a class"
                        categories={classCategories}
                        className="bg-white border-gray-300 font-maplestory"
                        renderSelectedValue={(option) => {
                          const jobCategory = getJobCategoryName(option.value);
                          const classSubcategory = getClassSubcategory(option.value);
                          
                          return (
                            <div className="flex items-center gap-2">
                              {option.icon && option.colors && (
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${option.colors.bg} flex items-center justify-center`}>
                                  <option.icon className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <span className="text-black font-maplestory">{option.label}</span>
                              {jobCategory && classSubcategory && (
                                <div className="flex gap-1">
                                  <span className={`text-xs px-2 py-1 rounded ${option.colors?.bgMuted} ${option.colors?.text}`}>
                                    {jobCategory}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                                    {classSubcategory}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <MapleInput
                      title="Level"
                      type="number"
                      placeholder="200"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden field to store image */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
            </form>
          </Form>
        </div>
      </MapleDialog>
    </>
  );
}
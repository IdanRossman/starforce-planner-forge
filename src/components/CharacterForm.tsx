import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character } from '@/types';
import { Button } from '@/components/ui/button';
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { fetchCharacterFromMapleRanks } from '@/services/mapleRanksService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Search } from 'lucide-react';

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

export function CharacterForm({ onAddCharacter, editingCharacter, onEditingChange }: CharacterFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [characterNotFound, setCharacterNotFound] = useState(false);

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
  }, [editingCharacter, form]);

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
    setOpen(newOpen);
    if (!newOpen) {
      onEditingChange?.(null); // Reset editing state when dialog closes
      setCharacterNotFound(false); // Reset not found state
    } else if (!editingCharacter) {
      // Reset form when opening for a new character (not editing)
      form.reset({
        name: '',
        class: '',
        level: 200,
        image: '',
      });
      setCharacterNotFound(false); // Reset not found state
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Character
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingCharacter ? 'Edit Character' : 'Add New Character'}</DialogTitle>
          <DialogDescription>
            {editingCharacter ? 'Update character information.' : 'Create a new character to track their StarForce progress.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Character Image Preview */}
            {form.watch('image') && (
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={form.watch('image')} 
                    alt={form.watch('name') || 'Character'} 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    MapleRanks
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Name</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Enter character name" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            handleCharacterNameChange(e.target.value);
                          }}
                          onBlur={handleCharacterNameBlur}
                        />
                        {isLoadingCharacter && (
                          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleSearchClick}
                        disabled={isLoadingCharacter || !field.value?.trim()}
                        title="Search on MapleRanks"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Auto-lookup from MapleRanks 
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Beta
                    </span>
                  </p>
                  {isLoadingCharacter && (
                    <p className="text-sm text-muted-foreground">Looking up character on MapleRanks...</p>
                  )}
                  {characterNotFound && !isLoadingCharacter && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Character not found on MapleRanks. You can still create the character manually.
                    </p>
                  )}
                </FormItem>
              )}
            />

             <FormField
               control={form.control}
               name="class"
               render={({ field }) => {
                 const JobIcon = field.value ? getJobIcon(field.value) : null;
                 const jobColors = field.value ? getJobColors(field.value) : null;
                 const jobCategory = field.value ? getJobCategoryName(field.value) : null;
                 const classSubcategory = field.value ? getClassSubcategory(field.value) : null;
                 
                 return (
                   <FormItem>
                     <FormLabel>Class</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select a class">
                             {field.value && JobIcon && jobColors && (
                               <div className="flex items-center gap-2">
                                 <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${jobColors.bg} flex items-center justify-center`}>
                                   <JobIcon className="w-3 h-3 text-white" />
                                 </div>
                                 <span>{field.value}</span>
                                 {jobCategory && classSubcategory && (
                                   <div className="flex gap-1">
                                     <span className={`text-xs px-2 py-1 rounded ${jobColors.bgMuted} ${jobColors.text}`}>
                                       {jobCategory}
                                     </span>
                                     <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                       {classSubcategory}
                                     </span>
                                   </div>
                                 )}
                               </div>
                             )}
                           </SelectValue>
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         {Object.entries(ORGANIZED_CLASSES).map(([key, category]) => (
                           <div key={key}>
                             <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 border-b">
                               {category.name}
                             </div>
                             {category.classes.map((cls) => {
                               const ClassIcon = getJobIcon(cls);
                               const classColors = getJobColors(cls);
                               const classCategory = getJobCategoryName(cls);
                               
                               return (
                                 <SelectItem key={cls} value={cls} className="pl-6">
                                   <div className="flex items-center gap-2">
                                     <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${classColors.bg} flex items-center justify-center`}>
                                       <ClassIcon className="w-2.5 h-2.5 text-white" />
                                     </div>
                                     <span className="flex-1">{cls}</span>
                                     <span className={`text-xs px-1.5 py-0.5 rounded ${classColors.bgMuted} ${classColors.text}`}>
                                       {classCategory}
                                     </span>
                                   </div>
                                 </SelectItem>
                               );
                             })}
                           </div>
                         ))}
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 );
               }}
             />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="200" {...field} />
                  </FormControl>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCharacter ? 'Update Character' : 'Create Character'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
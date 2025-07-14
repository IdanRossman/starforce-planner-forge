import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character } from '@/types';
import { Button } from '@/components/ui/button';
import { getJobIcon, getJobColors, getJobCategoryName, getClassSubcategory, ORGANIZED_CLASSES } from '@/lib/jobIcons';
import { fetchCharacterSprite, getPlaceholderSprite, REGIONS, SKIN_IDS, type CharacterSprite } from '@/lib/maplestoryApi';
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
import { Plus } from 'lucide-react';

const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(50, 'Name too long'),
  class: z.string().min(1, 'Character class is required'),
  level: z.coerce.number().min(1, 'Level must be at least 1').max(300, 'Level cannot exceed 300'),
  server: z.string().min(1, 'Server is required'),
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

const ORGANIZED_SERVERS = {
  'Interactive Servers': {
    name: 'Interactive Servers (Regular)',
    servers: [
      'Scania', 'Bera', 'Aurora', 'Elysium'
    ]
  },
  'Heroic Servers': {
    name: 'Heroic Servers (Reboot)',
    servers: [
      'Hyperion', 'Kronos'
    ]
  }
};

export function CharacterForm({ onAddCharacter, editingCharacter, onEditingChange }: CharacterFormProps) {
  const [open, setOpen] = useState(false);
  const [characterSprite, setCharacterSprite] = useState<CharacterSprite | null>(null);
  const [spriteLoading, setSpriteLoading] = useState(false);

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      class: '',
      level: 200,
      server: '',
    },
  });

  // Update form when editing character changes
  useEffect(() => {
    if (editingCharacter) {
      form.reset({
        name: editingCharacter.name,
        class: editingCharacter.class,
        level: editingCharacter.level,
        server: editingCharacter.server,
      });
      setOpen(true);
    }
  }, [editingCharacter, form]);

  // Fetch character sprite when class changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.class) {
        console.log('Character class changed to:', value.class);
        setSpriteLoading(true);
        fetchCharacterSprite(value.class)
          .then((sprite) => {
            console.log('Received sprite:', sprite);
            if (sprite) {
              setCharacterSprite(sprite);
            } else {
              // Fallback to placeholder when API fails
              console.log('Using placeholder sprite for:', value.class);
              const placeholder = getPlaceholderSprite(value.class);
              setCharacterSprite(placeholder);
            }
            setSpriteLoading(false);
          })
          .catch((error) => {
            console.error('Error in fetchCharacterSprite:', error);
            setCharacterSprite(null);
            setSpriteLoading(false);
          });
      } else {
        setCharacterSprite(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: CharacterFormData) => {
    const newCharacter: Omit<Character, 'id'> = {
      name: data.name,
      class: data.class,
      level: data.level,
      server: data.server,
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter character name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Character Sprite Preview */}
            {(characterSprite || spriteLoading) && (
              <div className="flex flex-col items-center space-y-2 py-4 border rounded-lg bg-card">
                <h4 className="text-sm font-medium text-muted-foreground">Character Preview</h4>
                {spriteLoading ? (
                  <div className="flex items-center justify-center w-24 h-24 bg-muted rounded-lg animate-pulse">
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : characterSprite ? (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <img 
                      src={characterSprite.url} 
                      alt="Character sprite"
                      className="max-w-[80px] max-h-[80px] object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground text-center">
                  Powered by MapleStory.io
                </p>
              </div>
            )}

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

            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a server" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ORGANIZED_SERVERS).map(([key, serverGroup]) => (
                        <div key={key}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 border-b">
                            {serverGroup.name}
                          </div>
                          {serverGroup.servers.map((server) => (
                            <SelectItem key={server} value={server} className="pl-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${key === 'Interactive Servers' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                <span>{server}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${key === 'Interactive Servers' ? 'bg-blue-500/20 text-blue-600' : 'bg-orange-500/20 text-orange-600'}`}>
                                  {key === 'Interactive Servers' ? 'Interactive' : 'Heroic'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
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
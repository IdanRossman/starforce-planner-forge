import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character } from '@/types';
import { Button } from '@/components/ui/button';
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

const MAPLE_SERVERS = [
  'Scania', 'Bera', 'Broa', 'Windia', 'Khaini', 'Yellonde', 'Mardia', 'Kradia',
  'Galicia', 'El Nido', 'Zenith', 'Arcania', 'Chaos', 'Nova', 'Renegades',
  'Aurora', 'Elysium', 'Luna', 'Reboot', 'Burning'
];

export function CharacterForm({ onAddCharacter, editingCharacter, onEditingChange }: CharacterFormProps) {
  const [open, setOpen] = useState(false);

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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAPLE_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
                      {MAPLE_SERVERS.map((server) => (
                        <SelectItem key={server} value={server}>
                          {server}
                        </SelectItem>
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
import React, { createContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Character, Equipment, EquipmentSlot, StorageItem } from '../types';
import { apiService } from '../services/api';
import { buildEquipmentFromSlots, SLOT_TO_BACKEND_NAME } from '../services/equipmentService';
import { useAuth } from './AuthContext';

export interface CharacterContextState {
  // Character Management
  characters: Character[];
  selectedCharacter: Character | null;

  // Basic Character CRUD Operations
  addCharacter: (character: Omit<Character, 'id'>, serverId?: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  selectCharacter: (characterId: string | null) => void;

  // Basic Equipment CRUD (simple operations only)
  addEquipmentToCharacter: (characterId: string, equipment: Omit<Equipment, 'id'>) => void;
  removeEquipmentFromCharacter: (characterId: string, equipmentId: string) => void;
  updateCharacterEquipment: (characterId: string, equipment: Equipment[]) => void;

  // Storage operations
  addStorageItem: (characterId: string, data: { catalogId: string; currentStarForce: number; targetStarForce: number; currentPotential?: string; targetPotential?: string; name?: string; set?: string; image?: string; level?: number; starforceable?: boolean; itemType?: string; type?: string }) => Promise<void>;
  updateStorageItem: (characterId: string, itemId: string, data: { catalogId: string; currentStarForce: number; targetStarForce: number; currentPotential?: string; targetPotential?: string }) => Promise<void>;
  removeStorageItem: (characterId: string, itemId: string) => Promise<void>;

  // Utility
  getCharacterById: (characterId: string) => Character | undefined;
  refreshCharacterEquipment: (characterId: string) => Promise<void>;
  isLoading: boolean;
  isEquipmentLoading: boolean;
  error: string | null;
}

const CharacterContext = createContext<CharacterContextState | undefined>(undefined);

export { CharacterContext };

interface CharacterProviderProps {
  children: ReactNode;
}

export function CharacterProvider({ children }: CharacterProviderProps) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which characters have had equipment loaded from backend this session
  const equipmentLoadedRef = useRef(new Set<string>());
  // Debounce timers for equipment sync — prevents firing on every star click
  const equipmentSyncTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Load characters — from backend if authenticated, otherwise localStorage
  useEffect(() => {
    const load = async () => {
      equipmentLoadedRef.current.clear();
      setIsLoading(true);
      try {
        if (user) {
          const serverCharacters = await apiService.getCharactersByUser(user.id);
          const mapped: Character[] = serverCharacters.map(c => ({
            id: c.id,
            name: c.name,
            class: c.job,
            level: c.level,
            equipment: [],
            image: undefined,
            enableCallingCard: c.enableCallingCard,
            callingCardHash: c.callingCardHash,
            cardGenerationDate: c.cardGenerationDate,
            cardGenerationCount: c.cardGenerationCount,
            animatedCardVideoHash: c.animatedCardVideoHash,
          }));
          setCharacters(mapped);

          const savedSelectedId = localStorage.getItem('starforce-selected-character');
          if (savedSelectedId) {
            const selected = mapped.find(c => c.id === savedSelectedId);
            if (selected) setSelectedCharacter(selected);
          }
        } else {
          const savedCharacters = localStorage.getItem('starforce-characters');
          const savedSelectedId = localStorage.getItem('starforce-selected-character');
          if (savedCharacters) {
            const parsed: Character[] = JSON.parse(savedCharacters);
            setCharacters(parsed);
            if (savedSelectedId) {
              const selected = parsed.find(c => c.id === savedSelectedId);
              if (selected) setSelectedCharacter(selected);
            }
          }
        }
      } catch (err) {
        console.error('Error loading characters:', err);
        setError('Failed to load characters');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist to localStorage — strip equipment for auth users (backend is source of truth)
  useEffect(() => {
    if (!isLoading) {
      try {
        const toSave = user
          ? characters.map(c => ({ ...c, equipment: [] }))
          : characters;
        localStorage.setItem('starforce-characters', JSON.stringify(toSave));
      } catch (err) {
        console.error('Error saving characters to localStorage:', err);
      }
    }
  }, [characters, isLoading, user]);

  // Persist selected character to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        if (selectedCharacter) {
          localStorage.setItem('starforce-selected-character', selectedCharacter.id);
        } else {
          localStorage.removeItem('starforce-selected-character');
        }
      } catch (err) {
        console.error('Error saving selected character:', err);
      }
    }
  }, [selectedCharacter, isLoading]);

  // Also trigger lazy equipment load when selectedCharacter changes via direct state set
  // (e.g., auto-selection of first character in addCharacter)
  useEffect(() => {
    if (!user || !selectedCharacter) return;
    const characterId = selectedCharacter.id;
    if (equipmentLoadedRef.current.has(characterId)) return;

    equipmentLoadedRef.current.add(characterId);
    setIsEquipmentLoading(true);
    (async () => {
      try {
        const backendSlots = await apiService.getCharacterEquipment(characterId);
        const { equipped, storage } = await buildEquipmentFromSlots(backendSlots);
        setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, equipment: equipped, storageItems: storage } : c));
        setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, equipment: equipped, storageItems: storage } : prev);
      } catch (err) {
        equipmentLoadedRef.current.delete(characterId);
        console.error('Failed to load character equipment:', err);
      } finally {
        setIsEquipmentLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter?.id, user?.id]);

  const addCharacter = useCallback((characterData: Omit<Character, 'id'>, serverId?: string) => {
    const newCharacter: Character = {
      ...characterData,
      id: serverId ?? crypto.randomUUID(),
      equipment: characterData.equipment || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCharacters(prev => {
      if (prev.length === 0) setSelectedCharacter(newCharacter);
      return [...prev, newCharacter];
    });
  }, []);

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(char =>
      char.id === characterId
        ? { ...char, ...updates, updatedAt: new Date().toISOString() }
        : char
    ));
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }

    if (user) {
      // Sync name/job/level changes
      const char = characters.find(c => c.id === characterId);
      if (char && (updates.name !== undefined || updates.class !== undefined || updates.level !== undefined)) {
        const merged = { ...char, ...updates };
        apiService.updateCharacter(characterId, {
          userId: user.id,
          name: merged.name,
          job: merged.class,
          level: merged.level,
        }).catch(err => console.error('Failed to sync character update to backend:', err));
      }

      // Sync equipment changes — debounced to batch rapid StarForce adjustments
      if (updates.equipment !== undefined) {
        const existing = equipmentSyncTimers.current.get(characterId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
          equipmentSyncTimers.current.delete(characterId);
          const allSlots = Object.keys(SLOT_TO_BACKEND_NAME) as EquipmentSlot[];
          const equipment = updates.equipment!;
          const payload = allSlots.map(slot => {
            const eq = equipment.find(e => e.slot === slot);
            return {
              equipmentSlot: SLOT_TO_BACKEND_NAME[slot],
              equipmentId: eq?.catalogId ? parseInt(eq.catalogId, 10) : null,
              currentStarforce: eq?.currentStarForce ?? 0,
              targetStarforce: eq?.targetStarForce ?? 0,
              currentPotential: eq?.currentPotentialValue ?? '',
              targetPotential: eq?.targetPotentialValue ?? '',
            };
          });
          apiService.upsertCharacterEquipment(characterId, payload)
            .catch(err => console.error('Failed to sync equipment to backend:', err));
        }, 800);

        equipmentSyncTimers.current.set(characterId, timer);
      }
    }
  }, [selectedCharacter?.id, characters, user]);

  const deleteCharacter = useCallback((characterId: string) => {
    setCharacters(prev => prev.filter(char => char.id !== characterId));
    if (selectedCharacter?.id === characterId) setSelectedCharacter(null);

    if (user) {
      apiService.deleteCharacter(characterId)
        .catch(err => console.error('Failed to delete character from backend:', err));
    }
  }, [selectedCharacter?.id, user]);

  const selectCharacter = useCallback((characterId: string | null) => {
    if (characterId === null) {
      setSelectedCharacter(null);
      return;
    }

    const character = characters.find(char => char.id === characterId);
    if (!character) return;
    const alreadyLoaded = equipmentLoadedRef.current.has(characterId);
    setSelectedCharacter(alreadyLoaded ? character : { ...character, equipment: [] });

    // Lazy-load equipment from backend the first time this character is selected
    if (user && !equipmentLoadedRef.current.has(characterId)) {
      equipmentLoadedRef.current.add(characterId);
      setIsEquipmentLoading(true);
      (async () => {
        try {
          const backendSlots = await apiService.getCharacterEquipment(characterId);
          const { equipped, storage } = await buildEquipmentFromSlots(backendSlots);
          setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, equipment: equipped, storageItems: storage } : c));
          setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, equipment: equipped, storageItems: storage } : prev);
        } catch (err) {
          equipmentLoadedRef.current.delete(characterId); // allow retry on error
          console.error('Failed to load character equipment:', err);
        } finally {
          setIsEquipmentLoading(false);
        }
      })();
    }
  }, [characters, user]);

  const getCharacterById = useCallback((characterId: string) => {
    return characters.find(char => char.id === characterId);
  }, [characters]);

  const addEquipmentToCharacter = useCallback((characterId: string, equipmentData: Omit<Equipment, 'id'>) => {
    const newEquipment: Equipment = {
      ...equipmentData,
      id: crypto.randomUUID(),
    };

    const character = characters.find(char => char.id === characterId);
    if (character) {
      const updatedEquipment = [...character.equipment, newEquipment];
      updateCharacter(characterId, { equipment: updatedEquipment });
    }
  }, [characters, updateCharacter]);

  const removeEquipmentFromCharacter = useCallback((characterId: string, equipmentId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (character) {
      const updatedEquipment = character.equipment.filter(eq => eq.id !== equipmentId);
      updateCharacter(characterId, { equipment: updatedEquipment });
    }
  }, [characters, updateCharacter]);

  const updateCharacterEquipment = useCallback((characterId: string, equipment: Equipment[]) => {
    updateCharacter(characterId, { equipment });
  }, [updateCharacter]);

  const addStorageItem = useCallback(async (characterId: string, data: { catalogId: string; currentStarForce: number; targetStarForce: number; currentPotential?: string; targetPotential?: string; name?: string; set?: string; image?: string; level?: number; starforceable?: boolean; itemType?: string; type?: string }) => {
    const result = await apiService.addStorageItem(characterId, {
      equipmentId: parseInt(data.catalogId, 10),
      currentStarforce: data.currentStarForce,
      targetStarforce: data.targetStarForce,
      currentPotential: data.currentPotential ?? '',
      targetPotential: data.targetPotential ?? '',
    });
    const newItem: StorageItem = {
      id: result.id,
      catalogId: data.catalogId,
      currentStarForce: data.currentStarForce,
      targetStarForce: data.targetStarForce,
      currentPotential: data.currentPotential,
      targetPotential: data.targetPotential,
      name: data.name,
      set: data.set,
      image: data.image,
      level: data.level ?? 0,
      starforceable: data.starforceable ?? true,
      type: (data.type ?? 'armor') as StorageItem['type'],
      itemType: data.itemType,
    };
    setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, storageItems: [...(c.storageItems ?? []), newItem] } : c));
    setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, storageItems: [...(prev.storageItems ?? []), newItem] } : prev);
  }, []);

  const updateStorageItem = useCallback(async (characterId: string, itemId: string, data: { catalogId: string; currentStarForce: number; targetStarForce: number; currentPotential?: string; targetPotential?: string }) => {
    await apiService.updateStorageItem(characterId, itemId, {
      equipmentId: parseInt(data.catalogId, 10),
      currentStarforce: data.currentStarForce,
      targetStarforce: data.targetStarForce,
      currentPotential: data.currentPotential ?? '',
      targetPotential: data.targetPotential ?? '',
    });
    const applyUpdate = (items: StorageItem[] = []) =>
      items.map(item => item.id === itemId ? { ...item, ...data } : item);
    setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, storageItems: applyUpdate(c.storageItems) } : c));
    setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, storageItems: applyUpdate(prev.storageItems) } : prev);
  }, []);

  const removeStorageItem = useCallback(async (characterId: string, itemId: string) => {
    await apiService.deleteStorageItem(characterId, itemId);
    const applyRemove = (items: StorageItem[] = []) => items.filter(item => item.id !== itemId);
    setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, storageItems: applyRemove(c.storageItems) } : c));
    setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, storageItems: applyRemove(prev.storageItems) } : prev);
  }, []);

  const refreshCharacterEquipment = useCallback(async (characterId: string) => {
    if (!user) return;
    equipmentLoadedRef.current.delete(characterId);
    setIsEquipmentLoading(true);
    try {
      const backendSlots = await apiService.getCharacterEquipment(characterId);
      const { equipped, storage } = await buildEquipmentFromSlots(backendSlots);
      equipmentLoadedRef.current.add(characterId);
      setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, equipment: equipped, storageItems: storage } : c));
      setSelectedCharacter(prev => prev?.id === characterId ? { ...prev, equipment: equipped, storageItems: storage } : prev);
    } catch (err) {
      console.error('Failed to refresh character equipment:', err);
    } finally {
      setIsEquipmentLoading(false);
    }
  }, [user]);

  const contextValue: CharacterContextState = {
    // State
    characters,
    selectedCharacter,
    isLoading,
    isEquipmentLoading,
    error,
    
    // Character Operations
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    getCharacterById,
    refreshCharacterEquipment,

    // Basic Equipment Operations
    addEquipmentToCharacter,
    removeEquipmentFromCharacter,
    updateCharacterEquipment,

    // Storage Operations
    addStorageItem,
    updateStorageItem,
    removeStorageItem,
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}

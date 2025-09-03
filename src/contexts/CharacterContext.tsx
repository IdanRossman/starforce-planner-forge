import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Character, Equipment } from '../types';

export interface CharacterContextState {
  // Character Management
  characters: Character[];
  selectedCharacter: Character | null;
  
  // Basic Character CRUD Operations
  addCharacter: (character: Omit<Character, 'id'>) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  selectCharacter: (characterId: string | null) => void;
  
  // Basic Equipment CRUD (simple operations only)
  addEquipmentToCharacter: (characterId: string, equipment: Omit<Equipment, 'id'>) => void;
  removeEquipmentFromCharacter: (characterId: string, equipmentId: string) => void;
  updateCharacterEquipment: (characterId: string, equipment: Equipment[]) => void;
  
  // Utility
  getCharacterById: (characterId: string) => Character | undefined;
  isLoading: boolean;
  error: string | null;
}

const CharacterContext = createContext<CharacterContextState | undefined>(undefined);

export { CharacterContext };

interface CharacterProviderProps {
  children: ReactNode;
}

export function CharacterProvider({ children }: CharacterProviderProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load characters from localStorage on mount
  useEffect(() => {
    try {
      const savedCharacters = localStorage.getItem('starforce-characters');
      const savedSelectedId = localStorage.getItem('starforce-selected-character');
      
      if (savedCharacters) {
        const parsedCharacters = JSON.parse(savedCharacters);
        setCharacters(parsedCharacters);
        
        // Restore selected character
        if (savedSelectedId) {
          const selected = parsedCharacters.find((char: Character) => char.id === savedSelectedId);
          if (selected) {
            setSelectedCharacter(selected);
          }
        }
      }
    } catch (err) {
      console.error('Error loading characters from localStorage:', err);
      setError('Failed to load saved characters');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save characters to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('starforce-characters', JSON.stringify(characters));
      } catch (err) {
        console.error('Error saving characters to localStorage:', err);
        setError('Failed to save characters');
      }
    }
  }, [characters, isLoading]);

  // Save selected character to localStorage
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

  const addCharacter = useCallback((characterData: Omit<Character, 'id'>) => {
    const newCharacter: Character = {
      ...characterData,
      id: crypto.randomUUID(),
      equipment: characterData.equipment || [], // Use provided equipment or empty array
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCharacters(prev => [...prev, newCharacter]);
    
    // Auto-select if it's the first character
    if (characters.length === 0) {
      setSelectedCharacter(newCharacter);
    }
  }, [characters.length]);

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(char => 
      char.id === characterId 
        ? { ...char, ...updates, updatedAt: new Date().toISOString() }
        : char
    ));

    // Update selected character if it's the one being updated
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
  }, [selectedCharacter?.id]);

  const deleteCharacter = useCallback((characterId: string) => {
    setCharacters(prev => prev.filter(char => char.id !== characterId));
    
    // Clear selection if deleted character was selected
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
    }
  }, [selectedCharacter?.id]);

  const selectCharacter = useCallback((characterId: string | null) => {
    if (characterId === null) {
      setSelectedCharacter(null);
      return;
    }

    const character = characters.find(char => char.id === characterId);
    if (character) {
      setSelectedCharacter(character);
    }
  }, [characters]);

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

  const contextValue: CharacterContextState = {
    // State
    characters,
    selectedCharacter,
    isLoading,
    error,
    
    // Character Operations
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    getCharacterById,
    
    // Basic Equipment Operations
    addEquipmentToCharacter,
    removeEquipmentFromCharacter,
    updateCharacterEquipment,
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}

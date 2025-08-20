import { useCallback } from 'react';
import { Character, Equipment } from '../../types';
import { useCharacterContext } from '../useCharacterContext';
import { fetchCharacterFromMapleRanks } from '../../services/mapleRanksService';

export interface CharacterOperations {
  // Character CRUD operations
  createCharacter: (characterData: Omit<Character, 'id' | 'equipment'>) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  duplicateCharacter: (characterId: string) => void;
  
  // Character selection
  selectCharacter: (characterId: string) => void;
  clearSelection: () => void;
  
  // MapleRanks integration
  updateCharacterFromMapleRanks: (characterId: string) => Promise<unknown>;
  fetchCharacterData: (characterName: string) => Promise<unknown>;
  
  // Equipment operations for selected character
  addEquipmentToSelected: (equipment: Omit<Equipment, 'id'>) => void;
  removeEquipmentFromSelected: (equipmentId: string) => void;
  updateSelectedCharacterEquipment: (equipment: Equipment[]) => void;
  clearSelectedCharacterEquipment: () => void;
  
  // Bulk operations
  exportCharacterData: (characterId: string) => string;
  importCharacterData: (jsonData: string) => void;
  
  // Utility operations
  getCharacterSummary: (characterId: string) => {
    totalEquipment: number;
    starforceItems: number;
    completedItems: number;
    totalCost: number;
  } | null;
  
  // Character validation
  validateCharacterName: (name: string, excludeId?: string) => { isValid: boolean; reason?: string };
}

/**
 * Hook for managing all character operations
 * Handles character CRUD, MapleRanks integration, and character-specific equipment operations
 */
export function useCharacter(): CharacterOperations {
  const { 
    characters, 
    selectedCharacter, 
    addCharacter, 
    updateCharacter: contextUpdateCharacter, 
    deleteCharacter: contextDeleteCharacter, 
    selectCharacter: contextSelectCharacter,
    updateCharacterEquipment,
    addEquipmentToCharacter,
    removeEquipmentFromCharacter
  } = useCharacterContext();

  // Character CRUD operations
  const createCharacter = useCallback((characterData: Omit<Character, 'id' | 'equipment'>) => {
    const character = {
      ...characterData,
      equipment: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addCharacter(character);
    
    // Auto-select if it's the first character
    if (characters.length === 0) {
      // Note: We can't get the new character ID from addCharacter since it returns void
      // The context will handle auto-selection logic internally
    }
  }, [addCharacter, characters.length]);

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    contextUpdateCharacter(characterId, updatedData);
  }, [contextUpdateCharacter]);

  const deleteCharacter = useCallback((characterId: string) => {
    contextDeleteCharacter(characterId);
  }, [contextDeleteCharacter]);

  const duplicateCharacter = useCallback((characterId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (!character) return;

    const duplicated: Omit<Character, 'id' | 'equipment'> = {
      name: `${character.name} (Copy)`,
      class: character.class,
      level: character.level,
      image: character.image,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createCharacter(duplicated);
  }, [characters, createCharacter]);

  // Character selection
  const selectCharacter = useCallback((characterId: string) => {
    contextSelectCharacter(characterId);
  }, [contextSelectCharacter]);

  const clearSelection = useCallback(() => {
    contextSelectCharacter('');
  }, [contextSelectCharacter]);

  // MapleRanks integration
  const updateCharacterFromMapleRanks = useCallback(async (characterId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (!character) return null;

    try {
      const mapleRanksData = await fetchCharacterFromMapleRanks(character.name);
      if (mapleRanksData) {
        updateCharacter(characterId, {
          level: mapleRanksData.level,
          class: mapleRanksData.class,
          image: mapleRanksData.image
        });
        return mapleRanksData;
      }
      return null;
    } catch (error) {
      console.error('Failed to update character from MapleRanks:', error);
      throw error;
    }
  }, [characters, updateCharacter]);

  const fetchCharacterData = useCallback(async (characterName: string) => {
    try {
      return await fetchCharacterFromMapleRanks(characterName);
    } catch (error) {
      console.error('Failed to fetch character data:', error);
      throw error;
    }
  }, []);

  // Equipment operations for selected character
  const addEquipmentToSelected = useCallback((equipment: Omit<Equipment, 'id'>) => {
    if (!selectedCharacter) return;
    
    const newEquipment: Equipment = {
      ...equipment,
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    addEquipmentToCharacter(selectedCharacter.id, newEquipment);
  }, [selectedCharacter, addEquipmentToCharacter]);

  const removeEquipmentFromSelected = useCallback((equipmentId: string) => {
    if (!selectedCharacter) return;
    removeEquipmentFromCharacter(selectedCharacter.id, equipmentId);
  }, [selectedCharacter, removeEquipmentFromCharacter]);

  const updateSelectedCharacterEquipment = useCallback((equipment: Equipment[]) => {
    if (!selectedCharacter) return;
    updateCharacterEquipment(selectedCharacter.id, equipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  const clearSelectedCharacterEquipment = useCallback(() => {
    if (!selectedCharacter) return;
    updateCharacterEquipment(selectedCharacter.id, []);
  }, [selectedCharacter, updateCharacterEquipment]);

  // Bulk operations
  const exportCharacterData = useCallback((characterId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (!character) return '';

    const exportData = {
      ...character,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [characters]);

  const importCharacterData = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate required fields
      if (!data.name || !data.class || typeof data.level !== 'number') {
        throw new Error('Invalid character data format');
      }

      // Generate new character data
      const characterData: Omit<Character, 'id' | 'equipment'> = {
        name: `${data.name} (Imported)`,
        class: data.class,
        level: data.level,
        image: data.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      createCharacter(characterData);
      
      // Import equipment if present - we'll need to handle this separately
      // since createCharacter doesn't return the character ID
      if (data.equipment && Array.isArray(data.equipment)) {
        // Note: Equipment import would need to be handled after character creation
        // This could be improved by having the context return the created character
        console.log('Equipment import not fully implemented - character created without equipment');
      }

    } catch (error) {
      console.error('Failed to import character data:', error);
      throw error;
    }
  }, [createCharacter]);

  // Utility operations
  const getCharacterSummary = useCallback((characterId: string) => {
    const character = characters.find(char => char.id === characterId);
    if (!character) return null;

    const totalEquipment = character.equipment.length;
    const starforceItems = character.equipment.filter(eq => eq.starforceable).length;
    const completedItems = character.equipment.filter(eq => 
      eq.starforceable && eq.currentStarForce >= eq.targetStarForce
    ).length;
    const totalCost = character.equipment.reduce((sum, eq) => 
      sum + (eq.actualCost || 0), 0
    );

    return {
      totalEquipment,
      starforceItems,
      completedItems,
      totalCost
    };
  }, [characters]);

  // Character validation
  const validateCharacterName = useCallback((name: string, excludeId?: string): { isValid: boolean; reason?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, reason: 'Character name cannot be empty' };
    }

    if (name.trim().length > 50) {
      return { isValid: false, reason: 'Character name is too long (max 50 characters)' };
    }

    const existingCharacter = characters.find(char => 
      char.name.toLowerCase() === name.toLowerCase() && char.id !== excludeId
    );

    if (existingCharacter) {
      return { isValid: false, reason: 'A character with this name already exists' };
    }

    return { isValid: true };
  }, [characters]);

  return {
    createCharacter,
    updateCharacter,
    deleteCharacter,
    duplicateCharacter,
    selectCharacter,
    clearSelection,
    updateCharacterFromMapleRanks,
    fetchCharacterData,
    addEquipmentToSelected,
    removeEquipmentFromSelected,
    updateSelectedCharacterEquipment,
    clearSelectedCharacterEquipment,
    exportCharacterData,
    importCharacterData,
    getCharacterSummary,
    validateCharacterName
  };
}

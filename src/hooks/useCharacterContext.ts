import { useContext } from 'react';
import { CharacterContext, CharacterContextState } from '../contexts/CharacterContext';

export function useCharacterContext(): CharacterContextState {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
}

// Convenience hooks for common operations
export function useSelectedCharacter() {
  const { selectedCharacter } = useCharacterContext();
  return selectedCharacter;
}

export function useSelectedCharacterEquipment() {
  const { selectedCharacter } = useCharacterContext();
  return selectedCharacter?.equipment || [];
}

export function useCharacters() {
  const { characters } = useCharacterContext();
  return characters;
}

import { Character } from "@/types";
import { CharacterWorthSummary } from "@/components/CharacterWorthSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Crown,
  Edit,
  Trash2,
  RefreshCw,
  Target
} from "lucide-react";

interface CharacterOverviewProps {
  selectedCharacter: Character | null;
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  onEditCharacter?: () => void;
  onDeleteCharacter?: () => void;
  onRefreshCharacter?: () => void;
  getCharacterSummary: (characterId: string) => {
    totalEquipment: number;
    starforceItems: number;
    completedItems: number;
  } | null;
}

export function CharacterOverview({
  selectedCharacter,
  characters,
  onSelectCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onRefreshCharacter,
  getCharacterSummary
}: CharacterOverviewProps) {
  if (!selectedCharacter) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-2 font-maplestory">
            Select a Character
          </h3>
          <p className="text-muted-foreground font-maplestory mb-6">
            Choose a character from the dropdown to view their details and equipment worth
          </p>
          <Select onValueChange={(value) => {
            const character = characters.find(char => char.id === value);
            if (character) onSelectCharacter(character);
          }}>
            <SelectTrigger className="w-[300px] mx-auto">
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              {characters.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  <div className="flex items-center gap-3">
                    {character.image ? (
                      <img 
                        src={character.image} 
                        alt={character.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span>{character.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {character.class}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  const stats = getCharacterSummary(selectedCharacter.id);

  return (
    <div className="space-y-6">
    <div className="space-y-4">
      {/* Character Selection Row - Full Width */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center">
            <div className="w-[500px]">
              <Select 
                value={selectedCharacter.id} 
                onValueChange={(value) => {
                  const character = characters.find(char => char.id === value);
                  if (character) onSelectCharacter(character);
                }}
              >
                <SelectTrigger className="w-full h-16 font-maplestory text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((character) => {
                    const charStats = getCharacterSummary(character.id);
                    return (
                      <SelectItem key={character.id} value={character.id}>
                        <div className="flex items-center gap-4 py-2">
                          {character.image ? (
                            <img 
                              src={character.image} 
                              alt={character.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-8 h-8" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base">{character.name}</span>
                              <Badge variant="outline" className="text-sm">
                                {character.class}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Lv.{character.level} • {charStats?.totalEquipment || 0} items • {(charStats?.starforceItems || 0) - (charStats?.completedItems || 0)} pending
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Info + Worth Cards Row */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {/* Character Info */}
            <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
              {/* Character Avatar */}
              <div className="relative">
                {selectedCharacter.image ? (
                  <img 
                    src={selectedCharacter.image} 
                    alt={selectedCharacter.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/30">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>

              {/* Character Details */}
              <div className="min-w-0">
                <h2 className="text-2xl font-bold font-maplestory">{selectedCharacter.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-maplestory">
                    {selectedCharacter.class}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-maplestory">
                    Level {selectedCharacter.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Worth Cards - Full Remaining Width */}
            <div className="flex-1 min-w-0">
              <CharacterWorthSummary equipment={selectedCharacter.equipment} isCompact={true} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

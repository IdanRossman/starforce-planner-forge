import React from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Switch } from '../../../ui/switch';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { EquipmentTableSettingsProps } from '../../types/table';

/**
 * Settings Panel Component
 * Handles global StarForce enhancement settings and recalculation
 */
export function EquipmentTableSettings({
  globalSettings,
  onUpdateGlobalSettings,
  onRecalculate,
  isCalculating
}: EquipmentTableSettingsProps) {
  
  const handleSettingChange = <K extends keyof typeof globalSettings>(
    key: K,
    value: typeof globalSettings[K]
  ) => {
    onUpdateGlobalSettings({
      ...globalSettings,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-maplestory">
          <Settings className="w-5 h-5 text-primary" />
          Enhancement Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Settings */}
        <div>
          <h4 className="font-medium text-sm mb-3 text-muted-foreground font-maplestory">
            Enhancement Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="discount-event"
                checked={globalSettings.thirtyPercentOff}
                onCheckedChange={(checked) => handleSettingChange('thirtyPercentOff', checked)}
              />
              <Label htmlFor="discount-event" className="text-sm cursor-pointer font-maplestory">
                30% Off Event
              </Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="starcatch-event"
                checked={globalSettings.fiveTenFifteenEvent}
                onCheckedChange={(checked) => handleSettingChange('fiveTenFifteenEvent', checked)}
              />
              <Label htmlFor="starcatch-event" className="text-sm cursor-pointer font-maplestory">
                5/10/15 Event
              </Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="star-catching"
                checked={globalSettings.starCatching !== false}
                onCheckedChange={(checked) => handleSettingChange('starCatching', checked)}
              />
              <Label htmlFor="star-catching" className="text-sm cursor-pointer font-maplestory">
                Star Catching
              </Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                id="interactive-server"
                checked={globalSettings.isInteractive}
                onCheckedChange={(checked) => handleSettingChange('isInteractive', checked)}
              />
              <Label htmlFor="interactive-server" className="text-sm cursor-pointer font-maplestory">
                Interactive Server
              </Label>
            </div>
          </div>
        </div>

        {/* Recalculate Button */}
        <div className="pt-2 border-t">
          <Button
            onClick={onRecalculate}
            disabled={isCalculating}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StarforceStrategy } from '@/services/starforceService';
import { getAvailableEvents, StarforceEventState } from '@/lib/starforceEvents';

interface StarforceEventTogglesProps {
  strategy: StarforceStrategy;
  events: StarforceEventState;
  onEventsChange: (events: StarforceEventState) => void;
  className?: string;
  compact?: boolean; // For smaller layouts
}

export function StarforceEventToggles({ 
  strategy, 
  events, 
  onEventsChange, 
  className = '',
  compact = false 
}: StarforceEventTogglesProps) {
  const availableEvents = getAvailableEvents(strategy);

  const handleEventChange = (eventId: string, checked: boolean) => {
    onEventsChange({ ...events, [eventId]: checked });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {availableEvents.map(event => (
          <div 
            key={event.id} 
            className={`flex items-center space-x-2 p-3 bg-muted/30 rounded-lg ${
              event.isSpecial ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20' : ''
            }`}
          >
            <Switch
              id={event.id}
              checked={(events as Record<string, boolean>)[event.id] || false}
              onCheckedChange={(checked) => handleEventChange(event.id, checked)}
            />
            <div className="flex-1">
              <Label 
                htmlFor={event.id} 
                className={`text-sm font-medium font-maplestory cursor-pointer ${
                  event.isSpecial ? 'text-yellow-400' : ''
                }`}
              >
                {event.name}
                {event.icon && <span className="ml-1">{event.icon}</span>}
              </Label>
              {event.description && !compact && (
                <p className="text-xs text-muted-foreground font-maplestory mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Strategy indicator */}
      <div className="text-xs text-muted-foreground font-maplestory text-center">
        Events available for {strategy === StarforceStrategy.LEGACY ? 'Legacy System' : 'New KMS System'}
      </div>
    </div>
  );
}

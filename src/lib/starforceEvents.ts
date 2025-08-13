import { StarforceStrategy } from '@/services/starforceService';

// Event configuration types
export interface StarforceEventConfig {
  id: string;
  name: string;
  icon?: string;
  isSpecial?: boolean; // For special styling like Yohi's event
}

export interface StarforceEventState {
  thirtyOff?: boolean;
  fiveTenFifteen?: boolean;
  starCatching?: boolean;
  boomReduction?: boolean;
}

// Get available events for each strategy
export function getAvailableEvents(strategy: StarforceStrategy): StarforceEventConfig[] {
  const baseEvents: StarforceEventConfig[] = [
    {
      id: 'starCatching',
      name: 'Star Catching',
    },
    {
      id: 'thirtyOff',
      name: '30% Off Event',
    },
  ];

  const legacyEvents: StarforceEventConfig[] = [
    ...baseEvents,
    {
      id: 'fiveTenFifteen',
      name: '5/10/15 Event',
    },
  ];

  const newKmsEvents: StarforceEventConfig[] = [
    ...baseEvents,
    {
      id: 'boomReduction',
      name: ' 30% Boom Reduction',
    },
  ];

  switch (strategy) {
    case StarforceStrategy.LEGACY:
      return legacyEvents;
    case StarforceStrategy.NEW_KMS:
      return newKmsEvents;
    default:
      return legacyEvents;
  }
}

// Get default event state for a strategy
export function getDefaultEventState(strategy: StarforceStrategy): StarforceEventState {
  const availableEvents = getAvailableEvents(strategy);
  const defaultState: StarforceEventState = {
    starCatching: true, // Default enabled
  };

  // Initialize all available events to false (except starCatching)
  availableEvents.forEach(event => {
    if (event.id !== 'starCatching') {
      (defaultState as Record<string, boolean>)[event.id] = false;
    }
  });

  return defaultState;
}

// Check if an event is available for a strategy
export function isEventAvailable(strategy: StarforceStrategy, eventId: string): boolean {
  const availableEvents = getAvailableEvents(strategy);
  return availableEvents.some(event => event.id === eventId);
}

// Create API-compatible event object
export function createApiEventObject(strategy: StarforceStrategy, eventState: StarforceEventState) {
  return {
    thirtyOff: isEventAvailable(strategy, 'thirtyOff') ? (eventState.thirtyOff || false) : false,
    fiveTenFifteen: isEventAvailable(strategy, 'fiveTenFifteen') ? (eventState.fiveTenFifteen || false) : false,
    starCatching: isEventAvailable(strategy, 'starCatching') ? (eventState.starCatching !== false) : true,
    boomReduction: isEventAvailable(strategy, 'boomReduction') ? (eventState.boomReduction || false) : false,
  };
}

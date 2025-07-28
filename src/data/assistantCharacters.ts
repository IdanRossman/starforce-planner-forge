import { AssistantTip, AssistantCharacter } from '@/types';

/**
 * ASSISTANT CHARACTER CONFIGURATION
 * ================================
 * 
 * How to add a new character:
 * 1. Add a new entry to 'assistantCharacters' with a unique key
 * 2. Set the character name, image path (in /public/characters/), and tips
 * 3. Add the character to 'pageCharacterConfig' for specific pages
 * 
 * How to add new tips:
 * - Add to the 'tips' array of any character
 * - Set 'context' array to specify which pages the tip appears on
 * - Use 'type' for different styling: 'general' | 'warning' | 'success' | 'info'
 * - Set 'duration' in milliseconds (how long tip stays visible)
 * 
 * How to assign characters to pages:
 * - Update 'pageCharacterConfig' with pageContext: 'character-key'
 * 
 * Global Timing Configuration:
 * - Adjust 'globalTimingConfig' to control tip display and transition timing
 */

// Global timing configuration for all GameAssistant instances
export const globalTimingConfig = {
  tipDisplayDuration: 10000, // How long each tip is displayed (10 seconds)
  transitionDelay: 15000,   // Time between tip transitions (15 seconds)
  nextTipDelay: 15000,       // Time to wait before showing next tip (15 seconds)
  initialDelay: 2000,       // Delay before first tip appears (2 seconds)
  debugInitialDelay: 500,   // Faster delay in debug mode (0.5 seconds)
};

// Define all your assistant characters here
export const assistantCharacters: Record<string, AssistantCharacter> = {
  'maple-admin': {
    name: "Maple Admin",
    image: "./characters/maple-admin.png",
    tips: [
      {
        id: "welcome-tip",
        message: "Welcome to StarForce Planner! I'll be here to guide you through your enhancement journey.",
        type: "general"
      },
      {
        id: "getting-started",
        message: "New here? I recommend starting with Character Management for full features, or try Quick Calculator for instant calculations!",
        type: "info",
        context: ["homepage"]
      },
      {
        id: "spare-management",
        message: "Pro tip: The character system includes advanced spare management - track your backup equipment and calculate realistic enhancement costs!",
        type: "success",
        context: ["homepage"]
      },
      {
        id: "data-persistence",
        message: "Good to know: Your character data is saved locally in your browser. No account needed - just bookmark this page!",
        type: "info",
        context: ["homepage"]
      },
      {
        id: "character-dashboard-tip",
        message: "This is your character dashboard! Here you can manage all your characters and their equipment efficiently.",
        type: "info",
        context: ["character-dashboard"]
      },
      {
        id: "equipment-manager-tip",
        message: "Use the Equipment Manager to add, edit, and organize all your gear. You can even import equipment data directly from MapleRanks!",
        type: "success",
        context: ["character-dashboard"]
      },
      {
        id: "character-wizard-tip",
        message: "The Character Wizard makes it easy to create new characters. Just fill in the basics and I'll help you get started!",
        type: "info",
        context: ["character-dashboard"]
      },
      {
        id: "data-export-tip",
        message: "Don't forget: You can export your character data as backup or share it with friends using the export feature!",
        type: "info",
        context: ["character-dashboard"]
      },
      {
        id: "quick-calc-tip",
        message: "The Quick Calculator is perfect for fast calculations without saving data. Great for experimenting!",
        type: "info",
        context: ["quick-planning"]
      },
      {
        id: "template-system-tip",
        message: "Try the template system! Load pre-configured equipment sets for different jobs and situations. It's a huge time saver!",
        type: "success",
        context: ["quick-planning"]
      },
      {
        id: "lost-help",
        message: "Looks like you've stumbled into uncharted territory! Don't worry, I can help you find your way back.",
        type: "info",
        context: ["not-found"]
      },
      {
        id: "navigation-help",
        message: "Use the navigation links to get back to the main sections: Character Dashboard or Quick Planning are great starting points!",
        type: "success",
        context: ["not-found"]
      }
    ]
  },
};

// Page-specific character assignments
export const pageCharacterConfig: Record<string, string> = {
  'homepage': 'maple-admin',
  'character-dashboard': 'maple-admin',
  'equipment-form': 'maple-admin',
  'quick-planning': 'maple-admin',
  'not-found': 'maple-admin',
  'default': 'maple-admin'
};

// Helper function to get character for a specific page
export function getCharacterForPage(pageContext: string): AssistantCharacter {
  const characterKey = pageCharacterConfig[pageContext] || pageCharacterConfig.default;
  return assistantCharacters[characterKey];
}

// Helper function to get all available characters (for future character selection UI)
export function getAllCharacters(): AssistantCharacter[] {
  return Object.values(assistantCharacters);
}

// Helper function to add a new character (for future expansion)
export function addCharacter(key: string, character: AssistantCharacter): void {
  assistantCharacters[key] = character;
}

// Debug character for testing (with static message)
export const debugCharacter: AssistantCharacter = {
  name: "Debug Assistant",
  image: "./characters/maple-admin.png", 
  tips: [
    {
      id: "debug-tip",
      message: "This is a test message to help debug the MapleStory-style chat interface design. The layout should look like classic quest dialogs!",
      type: "info",
      duration: 30000 // Long duration for testing
    }
  ]
};

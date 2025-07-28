# Assistant Character Configuration Guide

## Quick Setup

The assistant system is now centralized in `/src/data/assistantCharacters.ts`. Here's how to easily configure new characters and their tips:

## Adding a New Character

1. **Add character to `assistantCharacters` object:**
```typescript
'my-new-character': {
  name: "My Character Name",
  image: "/characters/my-character.png", // Place image in public/characters/
  tips: [
    {
      id: "welcome-tip",
      message: "Hi! I'm your new assistant character!",
      type: "info" // 'general' | 'warning' | 'success' | 'info'
      // Note: duration is now controlled globally, no need for individual durations
    }
  ]
}
```

2. **Assign character to pages in `pageCharacterConfig`:**
```typescript
'my-page': 'my-new-character'
```

## Using Characters in Components

**Simple (recommended):**
```tsx
<GameAssistant pageContext="homepage" />
```

**With debug mode:**
```tsx
<GameAssistant pageContext="homepage" debugMode={true} />
```

## Page Context Values

Current page contexts:
- `homepage` → Uses `maple-admin`
- `character-dashboard` → Uses `maple-admin`  
- `equipment-form` → Uses `maple-admin`
- `quick-planning` → Uses `maple-helper`
- `default` → Fallback to `maple-admin`

## Global Timing Configuration

All tip timing is now controlled globally in `globalTimingConfig`:

```typescript
export const globalTimingConfig = {
  tipDisplayDuration: 10000, // How long each tip is displayed (10 seconds)
  transitionDelay: 15000,     // Time between tip transitions (15 seconds)
  nextTipDelay: 15000,        // Time to wait before showing next tip (15 seconds)
  initialDelay: 2000,         // Delay before first tip appears (2 seconds)
  debugInitialDelay: 500,     // Faster delay in debug mode (0.5 seconds)
};
```

## Tip Configuration

### Context-Specific Tips
Add `context: ["homepage", "equipment-form"]` to show tips only on specific pages.

### Tip Types & Styling
- `general` → Purple accent
- `info` → Blue accent  
- `success` → Green accent
- `warning` → Orange accent

### Example Multi-Context Tip:
```typescript
{
  id: "universal-tip",
  message: "This tip appears on multiple pages!",
  type: "info",
  context: ["homepage", "character-dashboard"]
  // No duration needed - uses global timing
}
```

## Debug Mode

Enable debug mode for development:
```tsx
<GameAssistant pageContext="homepage" debugMode={true} />
```

**Debug features:**
- Tips persist until manually closed
- "DEBUG" indicator badge
- Tip counter (e.g., "2/5")
- Manual "NEXT TIP" button for cycling
- Faster initial appearance (500ms vs 2 seconds)

## Current Characters

- **maple-admin**: Main assistant (Maple Admin)
- **maple-helper**: Alternative assistant (Maple Helper)
- **debugCharacter**: For testing layouts

## File Structure

```
src/
├── data/
│   └── assistantCharacters.ts     # 👈 Main config file
├── types/
│   └── index.ts                   # Contains assistant types
└── components/
    └── GameAssistant.tsx          # Component (no config needed)
```

## Quick Examples

**Add a character for settings page:**
```typescript
// In assistantCharacters.ts
'settings-helper': {
  name: "Settings Guide",
  image: "/characters/settings-character.png",
  tips: [
    {
      id: "settings-tip",
      message: "Configure your preferences here!",
      type: "info",
      context: ["settings"]
      // Duration controlled globally
    }
  ]
}

// In pageCharacterConfig
'settings': 'settings-helper'
```

**Use in settings page:**
```tsx
<GameAssistant pageContext="settings" />
```

## Current Timing Behavior

- **Each tip displays for**: 10 seconds
- **Pause between tips**: 15 seconds  
- **Total cycle time**: 25 seconds per tip
- **Debug mode**: Tips persist until manually navigated

That's it! The system automatically handles character selection, tip filtering, timing, and display logic.

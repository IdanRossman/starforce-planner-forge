# Equipment Images

This guide explains how to add images to equipment in the StarForce Planner.

## Directory Structure

Equipment images are stored in the following structure:
```
public/images/equipment/
├── weapon/
├── secondary/
├── emblem/
├── hat/
├── top/
├── bottom/
├── overall/
├── shoes/
├── gloves/
├── cape/
├── belt/
├── shoulder/
├── face/
├── eye/
├── earring/
├── ring/
├── pendant/
├── pocket/
├── heart/
└── badge/
```

## Adding Equipment Images

1. **Create or obtain an SVG image** for your equipment piece
   - Images should be 32x32px for best results
   - SVG format is recommended for scalability
   - PNG/JPG are also supported

2. **Name the file** according to the equipment name in `equipmentSets.ts`
   - Use lowercase
   - Replace spaces with underscores
   - Example: "Dominator Pendant" → `dominator.svg`

3. **Place the file** in the appropriate directory
   - Example: `public/images/equipment/pendant/dominator.svg`

4. **The image path in `equipmentSets.ts`** should match:
   ```typescript
   { name: 'Dominator Pendant', level: 140, tier: null, image: '/images/equipment/pendant/dominator.svg' }
   ```

## Image Guidelines

- **Size**: 32x32px recommended
- **Format**: SVG preferred, PNG/JPG acceptable
- **Style**: Should match the overall UI design
- **Background**: Transparent preferred
- **Quality**: High resolution for crisp display

## Fallback Behavior

If an image fails to load or no image path is provided:
- A default icon will be displayed based on the equipment slot
- The application will continue to function normally
- No error will be shown to users

## Example Equipment with Images

Currently implemented examples:
- Dominator Pendant: `/images/equipment/pendant/dominator.svg`
- Fafnir Weapon: `/images/equipment/weapon/fafnir.svg`
- Arcane Umbra Hat: `/images/equipment/hat/arcane.svg`

## Batch Adding Images

To add images for all equipment:
1. Create images following the naming convention
2. Place them in appropriate directories
3. The paths in `equipmentSets.ts` are already configured
4. Images will automatically appear when files are added

## Testing

After adding images:
1. Start the development server: `npm run dev`
2. Create a new equipment piece with your image
3. Check both the Equipment Grid and Equipment Form dropdown
4. Verify the image displays correctly or shows appropriate fallback

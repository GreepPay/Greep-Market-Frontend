# Seasonal Animations System

A beautiful, automatic seasonal animation system that displays themed animations across all pages based on the current season and holidays.

## Features

- 🎄 **Winter/Christmas**: Falling snowflakes with sparkle effects during the holiday season
- 🌸 **Spring**: Gentle falling cherry blossom petals in soft pink tones
- ☀️ **Summer**: Warm sunshine rays and floating particles
- 🍂 **Autumn**: Colorful falling leaves in warm orange and red tones
- 🔄 **Automatic**: Detects current season and holidays automatically
- 📱 **Performance Optimized**: Uses canvas for smooth 60fps animations
- 🎨 **Non-intrusive**: Animations are non-blocking and don't interfere with UI

## How It Works

The system automatically:
1. Detects the current season based on the date
2. Identifies special holidays (Christmas, New Year, Halloween, etc.)
3. Displays appropriate animations across all pages
4. Updates automatically when seasons change

## Season Detection

- **Winter**: December, January, February (with Christmas/New Year enhancements)
- **Spring**: March, April, May
- **Summer**: June, July, August
- **Autumn**: September, October, November (with Halloween on Oct 31)

## Usage

The animations are automatically enabled and appear on all pages. The component is integrated into `App.tsx`:

```tsx
<SeasonalAnimationWrapper intensity="medium" />
```

### Props

- `intensity`: `'low' | 'medium' | 'high'` - Controls the number of animated elements (default: `'medium'`)
- `enabled`: `boolean` - Enable/disable animations (default: `true`)

### Manual Control

You can also use the seasonal context directly:

```tsx
import { useSeason } from '../../../context/SeasonContext';

const { seasonInfo, season, refreshSeason } = useSeason();
console.log(`Current season: ${seasonInfo.name} ${seasonInfo.emoji}`);
```

## Customization

### Adjusting Intensity

In `App.tsx`, you can change the intensity:

```tsx
<SeasonalAnimationWrapper intensity="low" />  // Subtle
<SeasonalAnimationWrapper intensity="medium" /> // Default
<SeasonalAnimationWrapper intensity="high" />   // More dramatic
```

### Disabling Animations

To temporarily disable animations:

```tsx
<SeasonalAnimationWrapper enabled={false} />
```

### Creating Custom Seasons

You can extend the system by:
1. Adding new animation components in `SeasonalAnimations/`
2. Updating `SeasonalAnimationWrapper.tsx` to include them
3. Adding season detection logic in `seasonUtils.ts`

## Performance

- Uses HTML5 Canvas for optimal performance
- Animations run at 60fps
- Automatically adapts to screen size
- Non-blocking (pointer-events: none)
- Lightweight implementation

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- requestAnimationFrame
- ES6+ JavaScript

## Notes

- Animations are positioned with `z-index: 1` to appear behind content but above background
- The system uses blend modes for aesthetic integration with your theme
- All animations are fully responsive and adapt to any screen size


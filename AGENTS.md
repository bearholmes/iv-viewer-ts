# AGENTS.md - iv-viewer-ts Project Guide

## Project Overview

**iv-viewer-ts** is a TypeScript-based image viewer library that provides Google Photos-like zooming and panning functionality for web images. It's a fork of the original `s-yadav/iv-viewer` project, enhanced with TypeScript for better type safety and developer experience.

### Key Capabilities

- Smooth image dragging and panning with momentum physics
- Multi-touch gesture support (pinch zoom, double-tap)
- Mouse wheel zoom with smooth animations
- Progressive image loading (low-res preview, then high-res)
- Snap view minimap for navigating zoomed images
- Three usage modes: Full-Screen, Container, and Image Mode
- Zero external dependencies

### Package Information

- **Version**: 2.1.14
- **License**: MIT
- **Main Entry**: `dist/iv-viewer-ts.js` (CommonJS)
- **Module Entry**: `dist/iv-viewer-ts.mjs` (ES Module)
- **Types**: `dist/types/index.d.ts`

---

## Technology Stack

### Core Technologies

- **TypeScript 5.0.2** - Type-safe JavaScript with ES2020+ target
- **Vite 5** - Primary build tool with fast HMR
- **Rollup** - Secondary bundler for CommonJS distribution
- **SASS 1.59.3** - SCSS preprocessing for styles

### Build Tools

- **vite-plugin-dts** - TypeScript declaration file generation
- **rollup-plugin-typescript2** - TypeScript support for Rollup
- **PostCSS 8.4.21** with Autoprefixer and cssnano
- **ESLint 8.36.0** with TypeScript support

### Distribution Formats

- **CommonJS** (`.js`) - Node.js compatibility
- **ES Module** (`.mjs`) - Modern bundlers
- **UMD** (`.umd.js`) - Browser globals
- **TypeScript Declarations** (`.d.ts`) - IDE support

---

## Project Structure

```
iv-viewer-ts/
├── src/                           # TypeScript source files
│   ├── ImageViewer.ts            # Core viewer class (1195 lines)
│   ├── FullScreen.ts             # Full-screen viewer extension (71 lines)
│   ├── Slider.ts                 # Touch/mouse drag handler (131 lines)
│   ├── util.ts                   # Utility functions
│   ├── dist.ts                   # Distribution entry point
│   ├── index.ts                  # Main export file
│   └── scss/                     # Styles
│       ├── _variables.scss       # SCSS variables
│       ├── _iv-viewer.scss       # Main styles
│       └── build.scss            # Build entry point
├── example/                      # Working examples
│   ├── container-mode/           # Gallery with navigation
│   ├── fullscreen-mode/          # Click-to-open viewer
│   ├── image-mode/               # Direct image zoom
│   └── index.html                # Demo landing page
├── dist/                         # Built output
│   ├── types/                    # TypeScript declarations
│   ├── iv-viewer-ts.js           # CommonJS bundle
│   ├── iv-viewer-ts.mjs          # ES Module bundle
│   ├── iv-viewer-ts.umd.js       # UMD bundle
│   └── iv-viewer-ts.css          # Compiled styles
├── package.json                  # Project metadata
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite build config
├── rollup.config.mjs             # Rollup config
└── build-css.cjs                 # CSS build script
```

---

## Key Components

### 1. ImageViewer (`src/ImageViewer.ts`)

**Responsibility**: Core image viewer engine handling all viewing modes and interactions.

**Key Methods**:

- `constructor(element, options)` - Initialize viewer with element or selector
- `load(imageSrc, hiResImageSrc?)` - Load images with optional high-res version
- `zoom(percentage, point?)` - Programmatic zoom control
- `resetZoom()` - Return to default zoom level
- `refresh()` - Recalculate dimensions after resize
- `destroy()` - Clean up and remove all references

**State Management**:

```typescript
_state: {
  zoomValue: number,
  loaded: boolean,
  imageDim: {w, h},
  containerDim: {w, h},
  snapImageDim: {w, h},
  zooming: boolean,
  snapViewVisible: boolean,
  zoomSliderLength: number,
  snapHandleDim: {w, h}
}
```

**Options**:

```typescript
{
  zoomValue: number,        // Initial zoom (100-maxZoom)
  maxZoom: number,          // Maximum zoom level (default: 500)
  snapView: boolean,        // Enable snap view minimap
  refreshOnResize: boolean, // Auto-refresh on window resize
  zoomOnMouseWheel: boolean,// Enable mouse wheel zoom
  listeners: {              // Event callbacks
    onInit, onDestroy, onImageLoaded,
    onImageError, onZoomChange
  }
}
```

### 2. FullScreenViewer (`src/FullScreen.ts`)

**Responsibility**: Extends ImageViewer for full-screen display mode.

**Key Methods**:

- `show(imageSrc, hiResImageSrc?)` - Display image in fullscreen overlay
- `hide()` - Close fullscreen viewer
- `destroy()` - Cleanup fullscreen elements

**Features**:

- Creates fullscreen DOM overlay
- Disables body scroll when active
- Provides close button
- Inherits all ImageViewer functionality

### 3. Slider (`src/Slider.ts`)

**Responsibility**: Abstract drag interaction handler for touch and mouse events.

**Usage**: Three instances composed into ImageViewer:

- **ImageSlider** - Image panning
- **SnapSlider** - Snap view handle dragging
- **ZoomSlider** - Zoom slider control

**Key Methods**:

- `init()` - Attach event listeners
- `startHandler()` - Begin drag operation
- `moveHandler()` - Track position changes
- `endHandler()` - End drag and cleanup
- `destroy()` - Remove all listeners

### 4. Utility Functions (`src/util.ts`)

**Key Functions**:

- `easeOutQuart()` - Smooth animation timing function
- `createElement()` - DOM element creation helper
- `addClass/removeClass()` - Class management
- `css()` - Style getter/setter
- `imageLoaded()` - Check if image is loaded
- `assignEvent()` - Event listener wrapper

---

## Build and Development

### Build Commands

```bash
# Primary build (Vite + TypeScript)
npm run build           # Builds all formats + type checking

# Secondary builds
npm run build-cjs       # CommonJS bundle via Rollup
npm run build-css       # Process SCSS → CSS (minified + unminified)
```

### Build Pipeline

**Vite Build** (`vite.config.ts`):

1. Entry: `src/index.ts`
2. Processes TypeScript with native Vite support
3. Generates ES Module (`dist/iv-viewer-ts.mjs`)
4. Generates ES Format (`dist/iv-viewer-ts.js`)
5. Runs `tsc` for strict type checking
6. Generates TypeScript declarations via `vite-plugin-dts`

**Rollup Build** (`rollup.config.mjs`):

- Generates CommonJS format
- Applies terser minification
- Includes source maps

**CSS Build** (`build-css.cjs`):

1. SCSS compilation: `src/scss/build.scss` → CSS
2. PostCSS autoprefixer for browser compatibility
3. cssnano minification
4. Outputs both `.css` and `.min.css`

### Development Workflow

1. **Code Changes**: Edit TypeScript files in `src/`
2. **Style Changes**: Edit SCSS files in `src/scss/`
3. **Build**: Run `npm run build` or individual build commands
4. **Test**: Open `example/index.html` to test changes
5. **Type Check**: Automatic with strict TypeScript config

---

## TypeScript Configuration

### Strict Mode Settings (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

### ESLint Configuration

- TypeScript parser enabled
- Unused variables detection
- Consistent code style enforcement

---

## Important Patterns and Guidelines

### 1. Class-Based Architecture

- **ImageViewer**: Main viewer class
- **FullScreenViewer extends ImageViewer**: Inheritance pattern
- **Slider**: Reusable composition pattern

### 2. Event-Driven Design

```typescript
listeners: {
  (onInit(data), // Instance initialized
    onDestroy(), // Instance destroyed
    onImageLoaded(data), // Image successfully loaded
    onImageError(data), // Image load failed
    onZoomChange(data)); // Zoom value changed
}
```

### 3. State Management

- Private `_state` object holds all viewer state
- Private `_elements` object holds DOM references
- Private `_options` object holds configuration
- Public API methods manipulate state safely

### 4. Animation and Performance

- Uses `requestAnimationFrame()` for 60fps animations
- `easeOutQuart()` timing function for natural motion
- Momentum-based panning with physics simulation
- Proper cleanup of animation frames in `_clearFrames()`

### 5. Memory Management

```typescript
destroy() {
  // 1. Clear animation frames
  this._clearFrames();
  // 2. Destroy slider instances
  this._sliders.imageSlider?.destroy();
  // 3. Remove event listeners
  assignEvent(window, 'resize', this.refresh, true);
  // 4. Clear references
  this._elements = {};
  this._state = {};
}
```

### 6. CSS Namespacing

- All classes prefixed with `.iv-` to prevent conflicts
- Example: `.iv-image-view`, `.iv-snap-view`, `.iv-zoom-slider`

### 7. SCSS Variables

Customizable theme through SCSS variables in `src/scss/_variables.scss`:

```scss
$color-1: #222;
$color-2: #ccc;
$color-3: #888;
$color-4: #fff;
$snap-view-width: 150px;
$snap-view-height: 150px;
```

---

## Common Tasks for Agents

### Adding a New Feature

1. **Read**: Understand the relevant component (`ImageViewer.ts`, etc.)
2. **Modify**: Add the feature with proper TypeScript types
3. **Update**: Add any new options to the Options interface
4. **Test**: Verify in `example/` HTML files
5. **Build**: Run `npm run build` to verify compilation
6. **Document**: Update README.md if needed

### Fixing a Bug

1. **Locate**: Use grep to find relevant code
2. **Read**: Understand the affected component
3. **Fix**: Make minimal changes to resolve the issue
4. **Test**: Verify fix doesn't break existing functionality
5. **Build**: Ensure TypeScript compilation succeeds

### Updating Dependencies

1. **Check**: Review `package.json` devDependencies
2. **Update**: Modify version numbers carefully
3. **Test**: Run `npm run build` to verify compatibility
4. **Verify**: Check that examples still work

### Modifying Styles

1. **Edit**: Modify SCSS files in `src/scss/`
2. **Build**: Run `npm run build-css`
3. **Test**: Check visual changes in `example/` pages
4. **Verify**: Ensure both minified and unminified CSS are generated

---

## File Naming Conventions

- **Source**: PascalCase for classes (`ImageViewer.ts`)
- **Utilities**: camelCase for utilities (`util.ts`)
- **Config**: kebab-case for configs (`vite.config.ts`)
- **Styles**: kebab-case with underscore for partials (`_variables.scss`)
- **Distribution**: kebab-case (`iv-viewer-ts.js`)

---

## Testing Considerations

### Manual Testing

- Use `example/` directory HTML files
- Test all three modes: fullscreen, container, image
- Verify on desktop (mouse) and touch devices
- Check browser console for errors

### What to Test

- Image loading (low-res, high-res)
- Zoom controls (wheel, buttons, pinch)
- Panning/dragging
- Snap view functionality
- Event listeners firing correctly
- Responsive behavior on resize
- Touch gestures (if possible)

---

## Recent Changes (Git History)

- **Update devDependencies** (v2.1.14)
- **Remove console.log** statements
- **Improve listeners**: Fix onImageLoaded event, add onImageError
- **Fix image path** resolution for external URLs
- **Fix CSS paths** in examples
- **Fix horizontal overflow** issues

---

## Key Dependencies (Development Only)

```json
{
  "vite": "^5.4.11",
  "typescript": "^5.0.2",
  "rollup": "^4.31.0",
  "sass": "^1.59.3",
  "eslint": "^8.36.0",
  "postcss": "^8.4.21",
  "autoprefixer": "^10.4.14",
  "cssnano": "^6.1.2"
}
```

**Production Dependencies**: None (zero dependencies)

---

## Agent Guidelines

### When Making Changes

1. **Always read files first** before modifying
2. **Use TypeScript strict mode** - no implicit any
3. **Maintain backward compatibility** when possible
4. **Follow existing patterns** in the codebase
5. **Test in examples** before committing
6. **Clean up properly** - remove unused variables
7. **Preserve formatting** and code style

### Code Quality Standards

- No unused variables or parameters
- Proper TypeScript types for all functions
- Event listeners must be cleaned up in `destroy()`
- Animation frames must be cleared in `_clearFrames()`
- All public APIs should be documented with JSDoc

### Build Verification

Before committing, ensure:

```bash
npm run build        # Must succeed without errors
npm run build-cjs    # Must succeed without errors
npm run build-css    # Must succeed without errors
```

---

## Summary

**iv-viewer-ts** is a well-architected, TypeScript-based image viewer library with:

- **Clean separation of concerns** (viewer, fullscreen, slider, utilities)
- **Zero dependencies** for maximum portability
- **Multiple bundle formats** for broad compatibility
- **Type-safe API** with full TypeScript support
- **Event-driven architecture** for extensibility
- **Performance-focused** with smooth animations and progressive loading

When working with this project, prioritize maintaining its lightweight nature, type safety, and clean API design.

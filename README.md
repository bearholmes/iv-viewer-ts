# 📸 iv-viewer-ts

<div align="center">

**Modern TypeScript image viewer with Google Photos-like zoom and pan**

[![npm version](https://img.shields.io/npm/v/iv-viewer-ts.svg)](https://www.npmjs.com/package/iv-viewer-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/iv-viewer-ts)](https://bundlephobia.com/package/iv-viewer-ts)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/iv-viewer-ts)

[Demo](https://bearholmes.github.io/iv-viewer-ts/) • [Documentation](#-api-reference) • [Examples](#-usage-modes)

</div>

---

## ✨ Features

- 🎯 **Zero Dependencies** - Lightweight and fast
- 📱 **Touch Support** - Pinch zoom, double-tap, swipe gestures
- 🖱️ **Mouse Controls** - Wheel zoom, click-and-drag panning
- 🎨 **Progressive Loading** - Show low-res preview while high-res loads
- 🗺️ **Snap View** - Mini-map for easy navigation of zoomed images
- 📐 **Three Modes** - Fullscreen, Container, or direct Image enhancement
- ⚡ **Smooth Animations** - Butter-smooth 60fps zoom and pan
- 🎭 **Customizable** - Event listeners and configuration options
- 📦 **Multiple Formats** - ESM, CommonJS, UMD
- 🔒 **Type-Safe** - Full TypeScript support

---

## 📦 Installation

```bash
npm install iv-viewer-ts
```

```bash
yarn add iv-viewer-ts
```

```bash
pnpm add iv-viewer-ts
```

---

## 🚀 Quick Start

```typescript
import ImageViewer from 'iv-viewer-ts';
import 'iv-viewer-ts/dist/iv-viewer-ts.css';

const viewer = new ImageViewer('#image-container');
viewer.load('image.jpg', 'high-res-image.jpg');
```

---

## 🎯 Usage Modes

### 1️⃣ Full-Screen Mode

Perfect for lightbox-style image viewing.

```typescript
import { FullScreenViewer } from 'iv-viewer-ts';
import 'iv-viewer-ts/dist/iv-viewer-ts.css';

const viewer = new FullScreenViewer();

// Show image in fullscreen
viewer.show('image.jpg', 'high-res-image.jpg');

// Hide when done
viewer.hide();
```

**Use Case**: Photo galleries, lightboxes, modal image viewers

---

### 2️⃣ Container Mode

Embed the viewer in your own container.

```html
<div id="image-container"></div>
```

```typescript
import ImageViewer from 'iv-viewer-ts';
import 'iv-viewer-ts/dist/iv-viewer-ts.css';

const container = document.querySelector('#image-container');
const viewer = new ImageViewer(container, {
  zoomValue: 100,
  maxZoom: 500,
  snapView: true,
});

viewer.load('image.jpg', 'high-res-image.jpg');
```

**Use Case**: Custom layouts, dashboards, image editors

---

### 3️⃣ Image Mode

Enhance existing `<img>` elements directly.

```html
<img id="my-image" src="preview.jpg" data-high-res-src="full-quality.jpg" alt="Zoomable image" />
```

```typescript
import ImageViewer from 'iv-viewer-ts';
import 'iv-viewer-ts/dist/iv-viewer-ts.css';

const image = document.querySelector('#my-image');
const viewer = new ImageViewer(image);
```

**Use Case**: Product images, documentation, blog posts

---

## ⚙️ Configuration Options

| Option             | Type      | Default | Description                       |
| ------------------ | --------- | ------- | --------------------------------- |
| `zoomValue`        | `number`  | `100`   | Initial zoom percentage (100-500) |
| `maxZoom`          | `number`  | `500`   | Maximum zoom percentage           |
| `snapView`         | `boolean` | `true`  | Show mini-map navigation          |
| `refreshOnResize`  | `boolean` | `true`  | Auto-refresh on window resize     |
| `zoomOnMouseWheel` | `boolean` | `true`  | Enable mouse wheel zoom           |
| `hasZoomButtons`   | `boolean` | `true`  | Show zoom in/out buttons          |
| `zoomStep`         | `number`  | `50`    | Zoom increment for buttons        |
| `listeners`        | `object`  | `{}`    | Event callbacks (see below)       |

### Example with All Options

```typescript
const viewer = new ImageViewer('#container', {
  zoomValue: 150, // Start at 150% zoom
  maxZoom: 800, // Allow up to 800% zoom
  snapView: true, // Show mini-map
  refreshOnResize: true, // Responsive
  zoomOnMouseWheel: true,
  hasZoomButtons: true,
  zoomStep: 25, // Zoom by 25% per click
  listeners: {
    onInit: (data) => console.log('Initialized', data),
    onImageLoaded: (data) => console.log('Image loaded', data),
    onZoomChange: (data) => console.log('Zoom:', data.zoomValue),
    onImageError: (error) => console.error('Failed to load', error),
    onDestroy: () => console.log('Viewer destroyed'),
  },
});
```

---

## 🎧 Event Listeners

React to viewer state changes with event callbacks:

```typescript
const viewer = new ImageViewer(element, {
  listeners: {
    // Called when viewer is initialized
    onInit(data) {
      console.log('Viewer ready', data.instance);
    },

    // Called when image successfully loads
    onImageLoaded(data) {
      console.log('Image loaded:', data.container);
    },

    // Called if image fails to load
    onImageError(error) {
      console.error('Load failed:', error);
    },

    // Called whenever zoom changes
    onZoomChange(data) {
      console.log('Zoom:', data.zoomValue);
      console.log('At min zoom:', data.reachedMin);
      console.log('At max zoom:', data.reachedMax);
    },

    // Called when viewer is destroyed
    onDestroy() {
      console.log('Viewer cleaned up');
    },
  },
});
```

### Callback Data Structure

```typescript
interface CallbackData {
  container: HTMLElement; // Viewer container
  snapView: HTMLElement; // Mini-map element
  zoomValue: number; // Current zoom (100-500)
  reachedMin: boolean; // At minimum zoom
  reachedMax: boolean; // At maximum zoom
  instance: ImageViewer; // Viewer instance
}
```

---

## 🔧 API Reference

### ImageViewer

#### Constructor

```typescript
new ImageViewer(element: string | HTMLElement, options?: Options)
```

- **element**: CSS selector string or DOM element (container or `<img>`)
- **options**: Configuration object (see [Configuration Options](#️-configuration-options))

---

#### Methods

##### `load(imageSrc, hiResImageSrc?)`

Load an image into the viewer.

```typescript
viewer.load('preview.jpg', 'full-resolution.jpg');
```

- **imageSrc**: Low-resolution image (loads immediately)
- **hiResImageSrc** _(optional)_: High-resolution image (loads progressively)

---

##### `zoom(percentage, point?)`

Programmatically zoom to a specific percentage.

```typescript
// Zoom to 300%
viewer.zoom(300);

// Zoom to 200% centered at specific point
viewer.zoom(200, { x: 500, y: 300 });
```

- **percentage**: Zoom level (100-maxZoom)
- **point** _(optional)_: Center point `{x: number, y: number}`

---

##### `resetZoom()`

Reset zoom to initial value.

```typescript
viewer.resetZoom();
```

---

##### `refresh()`

Recalculate dimensions after container resize.

```typescript
viewer.refresh();
```

---

##### `destroy()`

Clean up the viewer and remove all event listeners.

```typescript
viewer = viewer.destroy(); // Returns null
```

---

### FullScreenViewer

Extends `ImageViewer` with additional fullscreen methods.

#### Constructor

```typescript
new FullScreenViewer(options?: Options)
```

No element parameter needed - creates its own fullscreen container.

---

#### Additional Methods

##### `show(imageSrc, hiResImageSrc?)`

Display image in fullscreen mode.

```typescript
viewer.show('preview.jpg', 'full-resolution.jpg');
```

---

##### `hide()`

Close the fullscreen viewer.

```typescript
viewer.hide();
```

---

## 🎨 Progressive Image Loading

Improve perceived performance by showing a low-res preview while the high-res version loads in the background.

### Container Mode

```typescript
viewer.load('preview-small.jpg', 'full-resolution.jpg');
```

### FullScreen Mode

```typescript
viewer.show('preview-small.jpg', 'full-resolution.jpg');
```

### Image Mode

```html
<img src="preview-small.jpg" data-high-res-src="full-resolution.jpg" />
```

The viewer will:

1. Display the low-res image immediately
2. Start loading the high-res image in the background
3. Progressively update the display as the high-res image loads
4. Swap to high-res seamlessly when complete

---

## 🎮 Gesture Controls

### Mouse Controls

- **Drag**: Click and drag to pan
- **Wheel**: Scroll to zoom in/out
- **Double-click**: Toggle between min and max zoom

### Touch Controls

- **Swipe**: Pan the image
- **Pinch**: Pinch in/out to zoom
- **Double-tap**: Toggle between min and max zoom

### Keyboard Controls

- Use zoom buttons or programmatic API

---

## 📱 Responsive Design

The viewer automatically adapts to container size changes:

```typescript
// Auto-refresh enabled by default
const viewer = new ImageViewer(container, {
  refreshOnResize: true,
});

// Manual refresh if needed
viewer.refresh();
```

---

## 🎯 Common Use Cases

### Photo Gallery with Thumbnails

```typescript
const viewer = new FullScreenViewer();

document.querySelectorAll('.thumbnail').forEach((thumb) => {
  thumb.addEventListener('click', () => {
    const fullSrc = thumb.dataset.full;
    viewer.show(thumb.src, fullSrc);
  });
});
```

---

### Product Image Zoom

```html
<img
  class="product-image"
  src="product-400w.jpg"
  data-high-res-src="product-2000w.jpg"
  alt="Product photo"
/>
```

```typescript
document.querySelectorAll('.product-image').forEach((img) => {
  new ImageViewer(img, {
    zoomValue: 100,
    maxZoom: 300,
    snapView: false, // Hide mini-map for products
  });
});
```

---

### Image Editor Integration

```typescript
const viewer = new ImageViewer('#editor-canvas', {
  listeners: {
    onZoomChange(data) {
      updateZoomIndicator(data.zoomValue);
      toggleZoomButtons(data.reachedMin, data.reachedMax);
    },
  },
});

// External controls
zoomInBtn.onclick = () => viewer.zoom(viewer._state.zoomValue + 50);
zoomOutBtn.onclick = () => viewer.zoom(viewer._state.zoomValue - 50);
resetBtn.onclick = () => viewer.resetZoom();
```

---

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (requires polyfills)

---

## 📦 Bundle Formats

```typescript
// ESM (recommended)
import ImageViewer from 'iv-viewer-ts';

// CommonJS
const ImageViewer = require('iv-viewer-ts').default;

// UMD (browser global)
<script src="node_modules/iv-viewer-ts/dist/iv-viewer-ts.umd.js"></script>
<script>
  const viewer = new window.ImageViewer('#container');
</script>
```

---

## 🔍 TypeScript Support

Full TypeScript definitions included:

```typescript
import ImageViewer, { FullScreenViewer, ImageViewerOptions } from 'iv-viewer-ts';

const options: ImageViewerOptions = {
  zoomValue: 150,
  maxZoom: 500,
  listeners: {
    onZoomChange: (data) => {
      // Fully typed callback data
      console.log(data.zoomValue);
    },
  },
};

const viewer: ImageViewer = new ImageViewer('#container', options);
```

---

## 🎨 Styling & Customization

### Custom CSS

Override default styles with CSS:

```css
/* Custom zoom button colors */
.iv-button-zoom--in,
.iv-button-zoom--out {
  background: #007bff;
  color: white;
}

/* Custom snap view styling */
.iv-snap-view {
  border: 2px solid #007bff;
  border-radius: 8px;
}

/* Custom zoom handle */
.iv-zoom-handle {
  background: #007bff;
}
```

### SCSS Variables

For advanced customization, modify SCSS variables:

```scss
$color-1: #222; // Primary color
$color-2: #ccc; // Secondary color
$color-3: #888; // Tertiary color
$color-4: #fff; // Background color
$snap-view-width: 150px; // Mini-map width
$snap-view-height: 150px; // Mini-map height
```

Then rebuild from source:

```bash
npm run build-css
```

---

## 🤝 Contributing

Contributions are welcome! Please see our [code review guidelines](./CODE_REVIEW.md) for development standards.

### Development Setup

```bash
# Clone repository
git clone https://github.com/bearholmes/iv-viewer-ts.git
cd iv-viewer-ts

# Install dependencies
npm install

# Build
npm run build

# Open examples
open example/index.html
```

### Build Commands

```bash
npm run build      # Build all formats + types
npm run build-cjs  # Build CommonJS bundle
npm run build-css  # Build CSS from SCSS
```

---

## 📄 License

MIT © [bearholmes](https://github.com/bearholmes)

Original library: [iv-viewer](https://github.com/s-yadav/iv-viewer) by [s-yadav](https://github.com/s-yadav)

---

## 🙏 Credits

This project is a TypeScript fork of the excellent [iv-viewer](https://github.com/s-yadav/iv-viewer) library by [@s-yadav](https://github.com/s-yadav).

**Improvements in this fork:**

- ✅ Full TypeScript rewrite with strict types
- ✅ Modern build system (Vite + Rollup)
- ✅ ESM + CommonJS + UMD support
- ✅ Improved event system with error handling
- ✅ Better documentation and examples
- ✅ Active maintenance and updates

---

## 📚 Resources

- [📖 API Documentation](#-api-reference)
- [🎮 Live Demo](https://bearholmes.github.io/iv-viewer-ts/)
- [🐛 Issue Tracker](https://github.com/bearholmes/iv-viewer-ts/issues)
- [💬 Discussions](https://github.com/bearholmes/iv-viewer-ts/discussions)
- [📦 npm Package](https://www.npmjs.com/package/iv-viewer-ts)

---

<div align="center">

**Made with ❤️ by [bearholmes](https://github.com/bearholmes)**

⭐ Star this repo if you find it useful!

</div>

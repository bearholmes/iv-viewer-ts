import ImageViewer from './ImageViewer';

export default ImageViewer;
export { ImageViewer };
export { default as FullScreenViewer } from './FullScreen';

// Export TypeScript types for library consumers
export type {
  ImageViewerOptions,
  ImageViewerListeners,
  CallbackData,
  ViewerElements,
  ViewerState,
  Dimensions,
  Position,
  Movement,
  ImageInfo,
  SliderCallbacks,
  CreateElementOptions,
  CSSStyles,
} from './types';

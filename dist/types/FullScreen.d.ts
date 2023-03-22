import ImageViewer from './ImageViewer';
declare class FullScreenViewer extends ImageViewer {
    constructor(options?: {});
    _initFullScreenEvents(): void;
    show(imageSrc: string, hiResImageSrc: string): void;
    hide: () => void;
    destroy(): void;
}
export default FullScreenViewer;

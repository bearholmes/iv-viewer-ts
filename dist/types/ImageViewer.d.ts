import FullScreenViewer from "./FullScreen";
declare class ImageViewer {
    protected _elements: any;
    private _options;
    private _listeners;
    protected _events: {
        pinchStart?: () => void;
        zoomOutClick?: () => void;
        zoomInClick?: () => void;
        mouseLeaveSnapView?: () => void;
        mouseEnterSnapView?: () => void;
        imageLoad?: () => void;
        hiResImageLoad?: () => void;
        snapViewOnMouseMove?: () => void;
        onWindowResize?: () => void;
        onCloseBtnClick?: () => void;
        pinchMove?: () => void;
        pinchEnd?: () => void;
    };
    private _state;
    private _sliders;
    private _frames;
    private _images;
    static defaults: any;
    static FullScreenViewer: typeof FullScreenViewer;
    _ev: any;
    get zoomInButton(): "<div class=\"iv-button-zoom--in\" role=\"button\"></div>" | "";
    get zoomOutButton(): "" | "<div class=\"iv-button-zoom--out\" role=\"button\"></div>";
    get imageViewHtml(): string;
    constructor(element: any, options?: {});
    _findContainerAndImageSrc(element: any): {
        container: any;
        domElement: any;
        imageSrc: any;
        hiResImageSrc: any;
    };
    _init(): void;
    _initDom(): void;
    _initImageSlider(): void;
    _initSnapSlider(): void;
    _initZoomSlider(): void;
    _initEvents(): void;
    _snapViewEvents(): void;
    _pinchAndZoom(): void;
    _scrollZoom(): void;
    _doubleTapToZoom(): void;
    _getImageCurrentDim(): {
        w: number;
        h: number;
    };
    _loadImages(): void;
    _loadHighResImage(hiResImageSrc: string): void;
    _calculateDimensions(): void;
    resetZoom(animate?: boolean): void;
    zoom: (perc: number, point?: any) => void;
    _clearFrames: () => void;
    _resizeSnapHandle: (imgWidth: number, imgHeight: number, imgLeft: number, imgTop: number) => void;
    showSnapView: (noTimeout?: boolean) => void;
    hideSnapView: () => void;
    refresh: () => void;
    load(imageSrc: string, hiResImageSrc: string): void;
    destroy(): void;
    /**
     * Data will be passed to the callback registered with each new instance
     */
    get _callbackData(): {
        container: HTMLElement;
        snapView: HTMLElement;
        zoomValue: number;
        reachedMin: boolean;
        reachedMax: boolean;
        instance: ImageViewer;
    };
}
export default ImageViewer;

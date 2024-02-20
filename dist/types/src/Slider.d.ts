declare class Slider {
    private onStart;
    private onMove;
    private onEnd;
    private isSliderEnabled;
    private container;
    private touchMoveEvent;
    private touchEndEvent;
    private sx;
    private sy;
    constructor(container: any, { onStart, onMove, onEnd, isSliderEnabled, }: {
        onStart?: (x: any, y: {
            x: number;
            y: number;
        }) => void;
        onMove?: (x: any, y: {
            dx: number;
            dy: number;
            mx: number;
            my: number;
        }) => void;
        onEnd?: () => void;
        isSliderEnabled?: any;
    });
    startHandler: (eStart: Event) => void;
    moveHandler: (eMove: Event) => void;
    endHandler: () => void;
    removeListeners(): void;
    init(): void;
    destroy(): void;
}
export default Slider;

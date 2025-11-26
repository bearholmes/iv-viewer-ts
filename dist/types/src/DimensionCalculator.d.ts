import { Dimensions } from './types';
export interface DimensionCalculationParams {
    /** Container dimensions */
    containerDim: Dimensions;
    /** Natural width of the image */
    naturalWidth: number;
    /** Natural height of the image */
    naturalHeight: number;
    /** Snap view dimensions */
    snapViewDim: Dimensions;
}
export interface CalculatedDimensions {
    /** Fitted image dimensions */
    imageDim: Dimensions;
    /** Snap image dimensions */
    snapImageDim: Dimensions;
}
/**
 * DimensionCalculator class
 * Responsible for calculating fitted image and snap image dimensions
 */
export declare class DimensionCalculator {
    /**
     * Calculate fitted image dimensions that fit within container while maintaining aspect ratio
     * @param containerDim - Container dimensions
     * @param naturalWidth - Natural width of the image
     * @param naturalHeight - Natural height of the image
     * @returns Calculated image dimensions that fit within container
     */
    static calculateFittedImageDimensions(containerDim: Dimensions, naturalWidth: number, naturalHeight: number): Dimensions;
    /**
     * Calculate snap image dimensions that fit within snap view while maintaining aspect ratio
     * @param imageDim - Full image dimensions
     * @param snapViewDim - Snap view container dimensions
     * @returns Calculated snap image dimensions
     */
    static calculateSnapImageDimensions(imageDim: Dimensions, snapViewDim: Dimensions): Dimensions;
    /**
     * Calculate all dimensions needed for the image viewer
     * @param params - Calculation parameters
     * @returns Calculated dimensions for image and snap image
     */
    static calculateAllDimensions(params: DimensionCalculationParams): CalculatedDimensions;
    /**
     * Calculate snap handle dimensions based on container and image dimensions
     * @param containerDim - Container dimensions
     * @param imageDim - Current image dimensions (may be zoomed)
     * @param snapImageDim - Snap image dimensions
     * @returns Snap handle dimensions
     */
    static calculateSnapHandleDimensions(containerDim: Dimensions, imageDim: Dimensions, snapImageDim: Dimensions): Dimensions;
}

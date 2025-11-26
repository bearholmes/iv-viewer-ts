/**
 * DimensionCalculator
 * Handles all dimension calculations for the image viewer
 * Extracted from ImageViewer to improve Single Responsibility Principle (Issue C3.1)
 */

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
export class DimensionCalculator {
  /**
   * Calculate fitted image dimensions that fit within container while maintaining aspect ratio
   * @param containerDim - Container dimensions
   * @param naturalWidth - Natural width of the image
   * @param naturalHeight - Natural height of the image
   * @returns Calculated image dimensions that fit within container
   */
  static calculateFittedImageDimensions(
    containerDim: Dimensions,
    naturalWidth: number,
    naturalHeight: number,
  ): Dimensions {
    const ratio = naturalWidth / naturalHeight;

    // Determine optimal width based on container orientation and aspect ratio
    const imgWidth =
      (naturalWidth > naturalHeight && containerDim.h >= containerDim.w) ||
      ratio * containerDim.h > containerDim.w
        ? containerDim.w
        : ratio * containerDim.h;

    return {
      w: imgWidth,
      h: imgWidth / ratio,
    };
  }

  /**
   * Calculate snap image dimensions that fit within snap view while maintaining aspect ratio
   * @param imageDim - Full image dimensions
   * @param snapViewDim - Snap view container dimensions
   * @returns Calculated snap image dimensions
   */
  static calculateSnapImageDimensions(imageDim: Dimensions, snapViewDim: Dimensions): Dimensions {
    // Scale image to fit snap view based on orientation
    const snapWidth =
      imageDim.w > imageDim.h ? snapViewDim.w : (imageDim.w * snapViewDim.h) / imageDim.h;

    const snapHeight =
      imageDim.h > imageDim.w ? snapViewDim.h : (imageDim.h * snapViewDim.w) / imageDim.w;

    return {
      w: snapWidth,
      h: snapHeight,
    };
  }

  /**
   * Calculate all dimensions needed for the image viewer
   * @param params - Calculation parameters
   * @returns Calculated dimensions for image and snap image
   */
  static calculateAllDimensions(params: DimensionCalculationParams): CalculatedDimensions {
    const { containerDim, naturalWidth, naturalHeight, snapViewDim } = params;

    // Calculate fitted image dimensions
    const imageDim = this.calculateFittedImageDimensions(containerDim, naturalWidth, naturalHeight);

    // Calculate snap image dimensions
    const snapImageDim = this.calculateSnapImageDimensions(imageDim, snapViewDim);

    return {
      imageDim,
      snapImageDim,
    };
  }

  /**
   * Calculate snap handle dimensions based on container and image dimensions
   * @param containerDim - Container dimensions
   * @param imageDim - Current image dimensions (may be zoomed)
   * @param snapImageDim - Snap image dimensions
   * @returns Snap handle dimensions
   */
  static calculateSnapHandleDimensions(
    containerDim: Dimensions,
    imageDim: Dimensions,
    snapImageDim: Dimensions,
  ): Dimensions {
    // Snap handle represents the visible viewport area relative to the full image
    const handleWidth =
      imageDim.w !== 0 ? (snapImageDim.w * containerDim.w) / imageDim.w : containerDim.w;
    const handleHeight =
      imageDim.h !== 0 ? (snapImageDim.h * containerDim.h) / imageDim.h : containerDim.h;

    return {
      w: handleWidth,
      h: handleHeight,
    };
  }
}

/**
 * MomentumCalculator
 * Handles momentum calculation and threshold detection for slider animations
 * Extracted from ImageViewer to improve Single Responsibility Principle (Issue C3.1/A1.3)
 */

import { easeOutQuart } from './util';

export interface MomentumConfig {
  /** Threshold in pixels for momentum to be applied */
  thresholdPx: number;
  /** Velocity multiplication factor for momentum */
  velocityFactor: number;
  /** Number of animation frames for momentum */
  animationFrames: number;
}

export interface MomentumDelta {
  xDiff: number;
  yDiff: number;
}

export interface MomentumFrame {
  /** Calculated X position for this frame */
  positionX: number;
  /** Calculated Y position for this frame */
  positionY: number;
  /** Whether animation should continue */
  shouldContinue: boolean;
}

/**
 * MomentumCalculator class
 * Provides momentum calculation utilities for smooth pan animations
 */
export class MomentumCalculator {
  /**
   * Calculate momentum delta from position samples
   * @param positions - Array of position samples [oldest, newest]
   * @returns Delta between positions
   */
  static calculateDelta(positions: Array<{ x: number; y: number }>): MomentumDelta {
    if (positions.length < 2) {
      return { xDiff: 0, yDiff: 0 };
    }

    return {
      xDiff: positions[1].x - positions[0].x,
      yDiff: positions[1].y - positions[0].y,
    };
  }

  /**
   * Check if momentum threshold is exceeded
   * @param xDiff - X axis movement delta
   * @param yDiff - Y axis movement delta
   * @param thresholdPx - Threshold in pixels
   * @returns True if momentum should be applied
   */
  static shouldApplyMomentum(xDiff: number, yDiff: number, thresholdPx: number): boolean {
    return Math.abs(xDiff) > thresholdPx || Math.abs(yDiff) > thresholdPx;
  }

  /**
   * Calculate position for a momentum animation frame
   * @param step - Current animation step (1-based)
   * @param startPos - Starting position {dx, dy}
   * @param delta - Momentum delta {xDiff, yDiff}
   * @param config - Momentum configuration
   * @returns Calculated frame data
   */
  static calculateMomentumFrame(
    step: number,
    startPos: { dx: number; dy: number },
    delta: MomentumDelta,
    config: MomentumConfig,
  ): MomentumFrame {
    const { xDiff, yDiff } = delta;
    const { velocityFactor, animationFrames } = config;

    // Calculate position using easing function
    const xOffset = easeOutQuart(
      step,
      xDiff * velocityFactor,
      -xDiff * velocityFactor,
      animationFrames,
    );

    const yOffset = easeOutQuart(
      step,
      yDiff * velocityFactor,
      -yDiff * velocityFactor,
      animationFrames,
    );

    return {
      positionX: startPos.dx + xOffset,
      positionY: startPos.dy + yOffset,
      shouldContinue: step < animationFrames,
    };
  }

  /**
   * Convert image position to snap slider coordinates
   * @param position - Image position {x, y}
   * @param imageDim - Image dimensions
   * @param snapImageDim - Snap image dimensions
   * @returns Snap slider coordinates
   */
  static convertToSnapCoordinates(
    position: { x: number; y: number },
    imageDim: { w: number; h: number },
    snapImageDim: { w: number; h: number },
  ): { dx: number; dy: number } {
    // Prevent division by zero
    const dx = imageDim.w !== 0 ? -(position.x * snapImageDim.w) / imageDim.w : 0;
    const dy = imageDim.h !== 0 ? -(position.y * snapImageDim.h) / imageDim.h : 0;

    return { dx, dy };
  }
}

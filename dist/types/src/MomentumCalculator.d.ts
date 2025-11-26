/**
 * MomentumCalculator
 * Handles momentum calculation and threshold detection for slider animations
 * Extracted from ImageViewer to improve Single Responsibility Principle (Issue C3.1/A1.3)
 */
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
export declare class MomentumCalculator {
    /**
     * Calculate momentum delta from position samples
     * @param positions - Array of position samples [oldest, newest]
     * @returns Delta between positions
     */
    static calculateDelta(positions: Array<{
        x: number;
        y: number;
    }>): MomentumDelta;
    /**
     * Check if momentum threshold is exceeded
     * @param xDiff - X axis movement delta
     * @param yDiff - Y axis movement delta
     * @param thresholdPx - Threshold in pixels
     * @returns True if momentum should be applied
     */
    static shouldApplyMomentum(xDiff: number, yDiff: number, thresholdPx: number): boolean;
    /**
     * Calculate position for a momentum animation frame
     * @param step - Current animation step (1-based)
     * @param startPos - Starting position {dx, dy}
     * @param delta - Momentum delta {xDiff, yDiff}
     * @param config - Momentum configuration
     * @returns Calculated frame data
     */
    static calculateMomentumFrame(step: number, startPos: {
        dx: number;
        dy: number;
    }, delta: MomentumDelta, config: MomentumConfig): MomentumFrame;
    /**
     * Convert image position to snap slider coordinates
     * @param position - Image position {x, y}
     * @param imageDim - Image dimensions
     * @param snapImageDim - Snap image dimensions
     * @returns Snap slider coordinates
     */
    static convertToSnapCoordinates(position: {
        x: number;
        y: number;
    }, imageDim: {
        w: number;
        h: number;
    }, snapImageDim: {
        w: number;
        h: number;
    }): {
        dx: number;
        dy: number;
    };
}

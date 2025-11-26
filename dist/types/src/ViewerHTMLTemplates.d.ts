/**
 * ViewerHTMLTemplates - HTML template generation for ImageViewer
 * REFACTOR: Extract HTML template generation from ImageViewer (Issue C3.1)
 *
 * Centralizes all HTML template generation with static methods
 * Improves testability and maintainability of template strings
 *
 * @example
 * ```typescript
 * const html = ViewerHTMLTemplates.createViewerHTML(true);
 * const zoomIn = ViewerHTMLTemplates.createZoomInButton();
 * ```
 */
export declare class ViewerHTMLTemplates {
    /**
     * Creates the zoom-in button HTML
     * Only generated if hasZoomButtons option is true
     *
     * @param hasZoomButtons - Whether to create the button
     * @returns HTML string for zoom-in button or empty string
     *
     * @example
     * ```typescript
     * const btn = ViewerHTMLTemplates.createZoomInButton(true);
     * // '<div class="iv-button-zoom--in" role="button"></div>'
     * ```
     */
    static createZoomInButton(hasZoomButtons: boolean): string;
    /**
     * Creates the zoom-out button HTML
     * Only generated if hasZoomButtons option is true
     *
     * @param hasZoomButtons - Whether to create the button
     * @returns HTML string for zoom-out button or empty string
     *
     * @example
     * ```typescript
     * const btn = ViewerHTMLTemplates.createZoomOutButton(true);
     * // '<div class="iv-button-zoom--out" role="button"></div>'
     * ```
     */
    static createZoomOutButton(hasZoomButtons: boolean): string;
    /**
     * Creates the complete image viewer HTML structure
     * Includes loader, snap view, zoom controls, and image container
     *
     * @param hasZoomButtons - Whether to include zoom in/out buttons
     * @returns Complete HTML string for the viewer
     *
     * @example
     * ```typescript
     * const html = ViewerHTMLTemplates.createViewerHTML(true);
     * container.innerHTML = html;
     * ```
     */
    static createViewerHTML(hasZoomButtons: boolean): string;
}

export namespace imagePlugin {
    let id: string;
    let name: string;
    let type: string;
    let _imageElement: any;
    let _context: any;
    /**
     * Initialize the plugin
     */
    function init(context: any): Promise<void>;
    /**
     * Load an image from a file or URL
     * @param {Object} config
     * @param {string} config.sourceUrl - URL or path to image file
     * @param {number} [config.sourceWidth] - Desired image width
     * @param {number} [config.sourceHeight] - Desired image height
     * @param {number} [config.displayWidth] - Display width
     * @param {number} [config.displayHeight] - Display height
     * @param {Object} context - Engine context
     * @returns {Promise<Object>} Frame source with element
     */
    function capture(config: {
        sourceUrl: string;
        sourceWidth?: number;
        sourceHeight?: number;
        displayWidth?: number;
        displayHeight?: number;
    }, context: any): Promise<any>;
    /**
     * Dispose the plugin and clean up resources
     */
    function dispose(): Promise<void>;
}
//# sourceMappingURL=image.d.ts.map
export namespace webcamPlugin {
    let id: string;
    let name: string;
    let type: string;
    let _videoElement: any;
    let _stream: any;
    let _context: any;
    /**
     * Initialize the plugin
     */
    function init(context: any): Promise<void>;
    /**
     * Capture video from webcam
     * @param {Object} config
     * @param {string} [config.deviceId] - Specific camera device ID
     * @param {number} [config.sourceWidth] - Desired video width
     * @param {number} [config.sourceHeight] - Desired video height
     * @param {number} [config.displayWidth] - Display width
     * @param {number} [config.displayHeight] - Display height
     * @param {Object} context - Engine context
     * @returns {Promise<Object>} Frame source with element and stream
     */
    function capture(config: {
        deviceId?: string;
        sourceWidth?: number;
        sourceHeight?: number;
        displayWidth?: number;
        displayHeight?: number;
    }, context: any): Promise<any>;
    /**
     * Dispose the plugin and clean up resources
     */
    function dispose(): Promise<void>;
    /**
     * Check if mobile torch is available
     * @returns {boolean}
     */
    function hasMobileTorch(): boolean;
    /**
     * Toggle mobile torch on/off
     * @param {boolean} [enabled] - Force enable/disable, or toggle if not provided
     * @returns {Promise<boolean>} New torch state
     */
    function toggleMobileTorch(enabled?: boolean): Promise<boolean>;
}
//# sourceMappingURL=webcam.d.ts.map
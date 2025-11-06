export namespace videoPlugin {
    let id: string;
    let name: string;
    let type: string;
    let _videoElement: any;
    let _context: any;
    /**
     * Initialize the plugin
     */
    function init(context: any): Promise<void>;
    /**
     * Capture video from a file or URL
     * @param {Object} config
     * @param {string} config.sourceUrl - URL or path to video file
     * @param {number} [config.sourceWidth] - Desired video width
     * @param {number} [config.sourceHeight] - Desired video height
     * @param {number} [config.displayWidth] - Display width
     * @param {number} [config.displayHeight] - Display height
     * @param {boolean} [config.loop] - Whether to loop the video
     * @param {boolean} [config.muted] - Whether to mute the video
     * @param {Object} context - Engine context
     * @returns {Promise<Object>} Frame source with element
     */
    function capture(config: {
        sourceUrl: string;
        sourceWidth?: number;
        sourceHeight?: number;
        displayWidth?: number;
        displayHeight?: number;
        loop?: boolean;
        muted?: boolean;
    }, context: any): Promise<any>;
    /**
     * Dispose the plugin and clean up resources
     */
    function dispose(): Promise<void>;
}
//# sourceMappingURL=video.d.ts.map
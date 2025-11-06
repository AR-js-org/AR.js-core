export class CaptureSystem {
    /**
     * Initialize capture system with configuration
     * @param {Object} config
     * @param {string} config.sourceType - Type of source (webcam, video, image)
     * @param {string} [config.sourceUrl] - URL for video/image sources
     * @param {string} [config.deviceId] - Specific camera device ID
     * @param {number} [config.sourceWidth] - Desired source width
     * @param {number} [config.sourceHeight] - Desired source height
     */
    static initialize(config: {
        sourceType: string;
        sourceUrl?: string;
        deviceId?: string;
        sourceWidth?: number;
        sourceHeight?: number;
    }, context: any): Promise<any>;
    /**
     * Dispose the capture system and clean up resources
     */
    static dispose(context: any): Promise<void>;
    /**
     * Get the current capture state
     */
    static getState(context: any): any;
    /**
     * Get the current frame source
     */
    static getFrameSource(context: any): any;
}
//# sourceMappingURL=capture-system.d.ts.map
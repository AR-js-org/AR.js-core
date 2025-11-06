export namespace defaultProfilePlugin {
    let id: string;
    let name: string;
    let type: string;
    /**
     * Initialize the plugin: compute auto profile and publish it
     */
    function init(context: any): Promise<void>;
    /**
     * Preferred: detect a structured capability-based profile
     */
    function detectProfile(): Promise<{
        qualityTier: string;
        score: number;
        caps: {
            userAgentHint: any;
            cores: number;
            memoryGB: number;
            webgl2: boolean;
            wasmSIMD: boolean;
            screenLongSide: number;
            camera: {
                torch: boolean;
                focusMode: string;
            };
        };
        capture: {
            sourceWidth: number;
            sourceHeight: number;
            displayWidth: number;
            displayHeight: number;
            fpsHint: number;
        };
        processing: {
            budgetMsPerFrame: number;
            complexity: string;
        };
        label: string;
        sourceWidth: number;
        sourceHeight: number;
        displayWidth: number;
        displayHeight: number;
        canvasWidth: number;
        canvasHeight: number;
        maxDetectionRate: number;
    }>;
    /**
     * Compute a capability-based profile
     * Returns a structured profile with backward-compatible fields.
     */
    function _computeAutoProfile(): Promise<{
        qualityTier: string;
        score: number;
        caps: {
            userAgentHint: any;
            cores: number;
            memoryGB: number;
            webgl2: boolean;
            wasmSIMD: boolean;
            screenLongSide: number;
            camera: {
                torch: boolean;
                focusMode: string;
            };
        };
        capture: {
            sourceWidth: number;
            sourceHeight: number;
            displayWidth: number;
            displayHeight: number;
            fpsHint: number;
        };
        processing: {
            budgetMsPerFrame: number;
            complexity: string;
        };
        label: string;
        sourceWidth: number;
        sourceHeight: number;
        displayWidth: number;
        displayHeight: number;
        canvasWidth: number;
        canvasHeight: number;
        maxDetectionRate: number;
    }>;
    /**
     * Get device capability signals (defensive checks for non-browser envs)
     */
    function _getCaps(): {
        userAgentHint: any;
        cores: number;
        memoryGB: number;
        webgl2: boolean;
        wasmSIMD: boolean;
        screenLongSide: number;
        camera: {
            torch: boolean;
            focusMode: string;
        };
    };
    /**
     * Very small CPU probe to approximate budget
     */
    function _microBenchmark(msTarget?: number): Promise<number>;
    /**
     * Convert caps + bench signal into a 0..100 score
     */
    function _scoreCaps(caps: any, benchSignal: any): number;
    /**
     * Map score to a quality tier and capture/budget hints
     */
    function _pickTier(score: any): {
        tier: string;
        capture: number[];
        budget: number;
        complexity: string;
    };
    /**
     * Legacy mapping: return a minimal legacy profile by label
     */
    function getProfile(label: any): {
        label: string;
        canvasWidth: number;
        canvasHeight: number;
        maxDetectionRate: number;
        sourceWidth: number;
        sourceHeight: number;
    };
    /**
     * Keep legacy setter: If a legacy label is passed, set that profile.
     */
    function setProfile(label: any, context: any): void;
    /**
     * Read currently applied profile
     */
    function getCurrentProfile(context: any): any;
    /**
     * Legacy mobile detection retained (unused by default)
     * Enhanced to cover additional mobile devices and tablets
     * @private
     */
    function _isMobileDevice(): boolean;
    /**
     * Dispose hook
     */
    function dispose(): Promise<void>;
}
//# sourceMappingURL=default-policy.d.ts.map
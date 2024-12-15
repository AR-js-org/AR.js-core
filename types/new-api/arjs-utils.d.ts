export class Utils {
    /**
     * Create a default rendering camera for this trackingBackend. They may be modified later. to fit physical camera parameters
     *
     * @param {string} trackingBackend - the tracking to user
     * @return {THREE.Camera} the created camera
     */
    static createDefaultCamera(trackingMethod: any): THREE.Camera;
    /**
     * parse tracking method
     *
     * @param {String} trackingMethod - the tracking method to parse
     * @return {Object} - various field of the tracking method
     */
    static parseTrackingMethod(trackingMethod: string): any;
}
//# sourceMappingURL=arjs-utils.d.ts.map
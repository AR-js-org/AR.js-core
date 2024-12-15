export default class Context {
    static baseUrl: string;
    static REVISION: string;
    constructor(parameters: any);
    className: string;
    _updatedAt: number;
    listeners: {};
    parameters: {
        trackingBackend: string;
        debug: boolean;
        detectionMode: string;
        matrixCodeType: string;
        cameraParametersUrl: string;
        maxDetectionRate: number;
        canvasWidth: number;
        canvasHeight: number;
        patternRatio: number;
        labelingMode: string;
        imageSmoothingEnabled: boolean;
    };
    arController: any;
    initialized: boolean;
    _arMarkersControls: any[];
    _artoolkitProjectionAxisTransformMatrix: any;
    dispatchEvent(event: any): void;
    /**
     * Init the artoolkit backend. This is one of the first steps in your app.
     * @param {Function} onCompleted
     * @returns {void}
     */
    init(onCompleted: Function): void;
    /**
     * update is where the data from an image or video stream is processed.
     * This is mandatory otherwise the marker can not be detected.
     * @param {HTMLImageElement | HTMLVideoElement} srcElement
     * @returns {boolean}
     */
    update(srcElement: HTMLImageElement | HTMLVideoElement): boolean;
    /**
     * Add a marker to be detected.
     * @param {ArMarkerControls} arMarkerControls
     * @returns {void}
     */
    addMarker(arMarkerControls: ArMarkerControls): void;
    /**
     * Remove a marker from the class.
     * @param {ArMarkerControls} arMarkerControls
     * @returns {void}
     */
    removeMarker(arMarkerControls: ArMarkerControls): void;
    /**
     * getProjectionMatrix return the Camera Projection Matrix from the ARController camera.
     * @returns {mat4}
     */
    getProjectionMatrix(): mat4;
    #private;
}
import { mat4 } from "gl-matrix";
//# sourceMappingURL=arjs-context.d.ts.map
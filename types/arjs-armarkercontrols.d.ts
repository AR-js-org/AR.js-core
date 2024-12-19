export default class MarkerControls extends ArBaseControls {
    /**
     * ArMarkerControls constructor, needs context, object3d and a bunch of parameters.
     * @typedef {Object} IArToolkitContext
     * @property {ARController} arController - The AR controller.
     * @typedef {Object} Object3D
     * @property {boolean} matrixAutoUpdate - Whether the matrix should auto update.
     * @property {boolean} visible - Whether the object is visible.
     * @typedef {Object} IArMarkerControlsParameters
     * @property {number} size - Size of the marker in meters.
     * @property {string} type - Type of marker ('pattern', 'barcode', 'nft', 'unknown').
     * @property {string|null} patternUrl - URL of the pattern (if type is 'pattern').
     * @property {number|null} barcodeValue - Value of the barcode (if type is 'barcode').
     * @property {string|null} descriptorsUrl - URL of the descriptors (if type is 'nft').
     * @property {string} changeMatrixMode - Change matrix mode ('modelViewMatrix', 'cameraTransformMatrix').
     * @property {number} minConfidence - Minimal confidence in the marker recognition.
     * @property {boolean} smooth - Turn on/off camera smoothing.
     * @property {number} smoothCount - Number of matrices to smooth tracking over.
     * @property {number} smoothTolerance - Distance tolerance for smoothing.
     * @property {number} smoothThreshold - Threshold for smoothing.
     * @constructor
     * @param {IArToolkitContext} context
     * @param {Object3D} object3d
     * @param {IArMarkerControlsParameters} parameters
     */
    constructor(context: {
        /**
         * - The AR controller.
         */
        arController: typeof jsartoolkit.ARController;
    }, object3d: {
        /**
         * - Whether the matrix should auto update.
         */
        matrixAutoUpdate: boolean;
        /**
         * - Whether the object is visible.
         */
        visible: boolean;
    }, parameters: {
        /**
         * - Size of the marker in meters.
         */
        size: number;
        /**
         * - Type of marker ('pattern', 'barcode', 'nft', 'unknown').
         */
        type: string;
        /**
         * - URL of the pattern (if type is 'pattern').
         */
        patternUrl: string | null;
        /**
         * - Value of the barcode (if type is 'barcode').
         */
        barcodeValue: number | null;
        /**
         * - URL of the descriptors (if type is 'nft').
         */
        descriptorsUrl: string | null;
        /**
         * - Change matrix mode ('modelViewMatrix', 'cameraTransformMatrix').
         */
        changeMatrixMode: string;
        /**
         * - Minimal confidence in the marker recognition.
         */
        minConfidence: number;
        /**
         * - Turn on/off camera smoothing.
         */
        smooth: boolean;
        /**
         * - Number of matrices to smooth tracking over.
         */
        smoothCount: number;
        /**
         * - Distance tolerance for smoothing.
         */
        smoothTolerance: number;
        /**
         * - Threshold for smoothing.
         */
        smoothThreshold: number;
    });
    context: {
        /**
         * - The AR controller.
         */
        arController: typeof jsartoolkit.ARController;
    };
    parameters: {
        size: number;
        type: string;
        patternUrl: any;
        barcodeValue: any;
        descriptorsUrl: any;
        changeMatrixMode: string;
        minConfidence: number;
        smooth: boolean;
        smoothCount: number;
        smoothTolerance: number;
        smoothThreshold: number;
    };
    object3d: {
        /**
         * - Whether the matrix should auto update.
         */
        matrixAutoUpdate: boolean;
        /**
         * - Whether the object is visible.
         */
        visible: boolean;
    };
    smoothMatrices: any[];
    /**
     * dispose is used to dispose the marker and all objects associated.
     * @returns {void} void
     */
    dispose(): void;
    /**
     * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
     * of things. it is done here.
     * @param {mat4} modelViewMatrix
     * @returns {boolean} renderReqd
     */
    updateWithModelViewMatrix(modelViewMatrix: mat4): boolean;
    /**
     * Method to get the name of the marker.
     * @returns {string}
     */
    name(): string;
    #private;
}
import ArBaseControls from "./threex-arbasecontrols";
import jsartoolkit from "@ar-js-org/artoolkit5-js";
import { mat4 } from "gl-matrix";
//# sourceMappingURL=arjs-armarkercontrols.d.ts.map
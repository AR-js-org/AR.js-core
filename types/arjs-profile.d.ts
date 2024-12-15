/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
export default class Profile {
    /**
     * reset all parameters
     */
    reset(): this;
    sourceParameters: {
        sourceType: string;
    };
    contextParameters: {
        cameraParametersUrl: string;
        detectionMode: string;
    };
    defaultMarkerParameters: {
        type: string;
        patternUrl: string;
        changeMatrixMode: string;
    };
    performance(label: any): this;
    defaultMarker(trackingBackend: any): this;
    sourceWebcam(): this;
    sourceVideo(url: any): this;
    sourceImage(url: any): this;
    trackingBackend(trackingBackend: any): this;
    changeMatrixMode(changeMatrixMode: any): this;
    trackingMethod(trackingMethod: any): this;
    /**
     * check if the profile is valid. Throw an exception is not valid
     */
    checkIfValid(): this;
    #private;
}
//# sourceMappingURL=arjs-profile.d.ts.map
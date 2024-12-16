import ArMarkerControls from "../arjs-armarkercontrols"; // Alias for dynamic importing
import ArSmoothedControls from "../threex-arsmoothedcontrols";

export default class Anchor {
    constructor(arSession, markerParameters) {

        const smoothedControls = new ArSmoothedControls(smoothedRoot);

        let parent3D;
        let controlledObject;
        const _this = this;
        let arContext = arSession.arContext;
        const scene = arSession.parameters.scene;
        const camera = arSession.parameters.camera;

        this.arSession = arSession;
        this.parameters = markerParameters;

        // log to debug
        console.log(
            "ARjs.Anchor -",
            "changeMatrixMode:",
            this.parameters.changeMatrixMode,
            "/ markersAreaEnabled:",
            markerParameters.markersAreaEnabled
        );

        const markerRoot = new THREE.Group();
        scene.add(markerRoot);

        // set controlledObject depending on changeMatrixMode
        if (markerParameters.changeMatrixMode === "modelViewMatrix") {
            controlledObject = markerRoot;
        } else if (markerParameters.changeMatrixMode === "cameraTransformMatrix") {
            controlledObject = camera;
        } else console.assert(false);

        if (markerParameters.markersAreaEnabled === false) {
            const markerControls = new ArMarkerControls(
                arContext,
                controlledObject,
                markerParameters
            );
            this.controls = markerControls;
        } else {
            // sanity check - MUST be a trackingBackend with markers
            console.assert(arContext.parameters.trackingBackend === "artoolkit");

            // honor markers-page-resolution for https://webxr.io/augmented-website
            if (
                location.hash.substring(1).startsWith("markers-page-resolution=") === true
            ) {
                // get resolutionW/resolutionH from url
                const markerPageResolution = location.hash.substring(1);
                const matches = markerPageResolution.match(
                    /markers-page-resolution=(\d+)x(\d+)/
                );
                console.assert(matches.length === 3);
                const resolutionW = parseInt(matches[1]);
                const resolutionH = parseInt(matches[2]);
                arContext = arSession.arContext;
            }

            // set controlledObject depending on changeMatrixMode
            if (markerParameters.changeMatrixMode === "modelViewMatrix") {
                parent3D = scene;
            } else if (markerParameters.changeMatrixMode === "cameraTransformMatrix") {
                parent3D = camera;
            } else console.assert(false);
            this.controls = multiMarkerControls;

            this.object3d = new THREE.Group();

            //////////////////////////////////////////////////////////////////////////////
            //		THREEx.ArSmoothedControls
            //////////////////////////////////////////////////////////////////////////////

            const shouldBeSmoothed = true;

            if (shouldBeSmoothed === true) {
                // build a smoothedControls
                const smoothedRoot = new THREE.Group();
                scene.add(smoothedRoot);
                smoothedRoot.add(this.object3d);
            } else {
                markerRoot.add(this.object3d);
            }

            //////////////////////////////////////////////////////////////////////////////
            //		Code Separator
            //////////////////////////////////////////////////////////////////////////////
            this.update = function () {
                // update _this.object3d.visible
                _this.object3d.visible = _this.object3d.parent.visible;

                // console.log('controlledObject.visible', _this.object3d.parent.visible)
                if (smoothedControls !== undefined) {
                    // update smoothedControls
                    smoothedControls.update(markerRoot);
                }
            };
        }

    };
}

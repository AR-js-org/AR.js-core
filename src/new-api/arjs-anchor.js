import ArMarkerControls from '../arjs-markercontrols'; // Alias for dynamic importing
import ArSmoothedControls from '../threex-arsmoothedcontrols';

export default class Anchor {
  constructor(arSession, markerParameters) {
    //let parent3D;
    //let controlledObject;
    var markerControls;
    //const _this = this;
    var arContext = arSession.arContext;
    var scene = arSession.parameters.scene;
    var camera = arSession.parameters.camera;

    this.arSession = arSession;
    this.parameters = markerParameters;
    //this.smoothedControls;

    // log to debug
    console.log(
      'ARjs.Anchor -',
      'changeMatrixMode:',
      this.parameters.changeMatrixMode,
      '/ markersAreaEnabled:',
      markerParameters.markersAreaEnabled,
    );

    this.markerRoot = new THREE.Group();
    scene.add(this.markerRoot);
    var controlledObject;

    // set controlledObject depending on changeMatrixMode
    if (markerParameters.changeMatrixMode === 'modelViewMatrix') {
      controlledObject = this.markerRoot;
    } else if (markerParameters.changeMatrixMode === 'cameraTransformMatrix') {
      controlledObject = camera;
    } else console.assert(false);

    if (markerParameters.markersAreaEnabled === false) {
      markerControls = new ArMarkerControls(arContext, controlledObject, markerParameters);
      this.controls = markerControls;
    } else {
      // sanity check - MUST be a trackingBackend with markers
      console.assert(arContext.parameters.trackingBackend === 'artoolkit');

      // honor markers-page-resolution for https://webxr.io/augmented-website
      if (location.hash.substring(1).startsWith('markers-page-resolution=') === true) {
        // get resolutionW/resolutionH from url
        var markerPageResolution = location.hash.substring(1);
        var matches = markerPageResolution.match(/markers-page-resolution=(\d+)x(\d+)/);
        console.assert(matches.length === 3);
        //const resolutionW = parseInt(matches[1]);
        //const resolutionH = parseInt(matches[2]);
        arContext = arSession.arContext;
      }
      var parent3D;
      // set controlledObject depending on changeMatrixMode
      if (markerParameters.changeMatrixMode === 'modelViewMatrix') {
        parent3D = scene;
      } else if (markerParameters.changeMatrixMode === 'cameraTransformMatrix') {
        parent3D = camera;
      } else console.assert(false);
      //this.controls = multiMarkerControls;

      var markerControls = new ArMarkerControls(arContext, parent3D, markerParameters);
      this.controls = markerControls;
    }
    this.object3d = new THREE.Group();

    //////////////////////////////////////////////////////////////////////////////
    //		THREEx.ArSmoothedControls
    //////////////////////////////////////////////////////////////////////////////

    const shouldBeSmoothed = true;
    const smoothedRoot = new THREE.Group();

    if (shouldBeSmoothed === true) {
      // build a smoothedControls
      //const smoothedRoot = new THREE.Group();
      scene.add(smoothedRoot);
      this.smoothedControls = new ArSmoothedControls(smoothedRoot);
      smoothedRoot.add(this.object3d);
    } else {
      markerRoot.add(this.object3d);
    }

    //////////////////////////////////////////////////////////////////////////////
    //		Code Separator
    //////////////////////////////////////////////////////////////////////////////
    /*this.update() {
        // update _this.object3d.visible
        _this.object3d.visible = _this.object3d.parent.visible;

        // console.log('controlledObject.visible', _this.object3d.parent.visible)
        if (smoothedControls !== undefined) {
          // update smoothedControls parameters depending on how many markers are visible in multiMarkerControls
          if (multiMarkerControls !== undefined) {
            multiMarkerControls.updateSmoothedControls(smoothedControls);
          }

          // update smoothedControls
          smoothedControls.update(markerRoot);
        }
      };*/
    //}
  }
  update() {
    // update _this.object3d.visible
    //console.log("controlledObject.visible", this.object3d);
    this.object3d.visible = this.object3d.parent.visible;

    if (this.smoothedControls !== undefined) {
      // update smoothedControls
      this.smoothedControls.update(this.markerRoot);
    }
  }
}

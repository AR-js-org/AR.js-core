import ArBaseControls from "./threex-arbasecontrols";
import Worker from "./arjs-markercontrols-nft.worker.js";
import jsartoolkit from "@ar-js-org/artoolkit5-js"; // TODO comment explanation
const { ARController } = jsartoolkit;
import { setParameters } from "./functions/utils";
import { mat4 } from "gl-matrix";

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
  constructor(context, object3d, parameters) {
    super(object3d);
    this.context = context;
    // handle default parameters
    this.parameters = {
      // size of the marker in meter
      size: 1,
      // type of marker - ['pattern', 'barcode', 'nft', 'unknown' ]
      type: "unknown",
      // url of the pattern - IIF type='pattern'
      patternUrl: null,
      // value of the barcode - IIF type='barcode'
      barcodeValue: null,
      // url of the descriptors of image - IIF type='nft'
      descriptorsUrl: null,
      // change matrix mode - [modelViewMatrix, cameraTransformMatrix]
      changeMatrixMode: "modelViewMatrix",
      // minimal confidence in the marke recognition - between [0, 1] - default to 1
      minConfidence: 0.6,
      // turn on/off camera smoothing
      smooth: false,
      // number of matrices to smooth tracking over, more = smoother but slower follow
      smoothCount: 5,
      // distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
      smoothTolerance: 0.01,
      // threshold for smoothing, will keep still unless enough matrices are over tolerance
      smoothThreshold: 2,
    };

    // sanity check
    let possibleValues = ["pattern", "barcode", "nft", "unknown"];
    console.assert(
      possibleValues.indexOf(this.parameters.type) !== -1,
      "illegal value",
      this.parameters.type,
    );
    possibleValues = ["modelViewMatrix", "cameraTransformMatrix"];
    console.assert(
      possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1,
      "illegal value",
      this.parameters.changeMatrixMode,
    );

    // create the marker Root
    this.object3d = object3d;
    this.object3d.matrixAutoUpdate = false;
    this.object3d.visible = false;

    setParameters(parameters, this);

    if (this.parameters.smooth) {
      this.smoothMatrices = []; // last DEBOUNCE_COUNT modelViewMatrix
    }

    //////////////////////////////////////////////////////////////////////////////
    //		Code Separator
    //////////////////////////////////////////////////////////////////////////////
    // add this marker to artoolkitsystem
    // TODO rename that .addMarkerControls
    context.addMarker(this);

    if (_this.context.parameters.trackingBackend === "artoolkit") {
      this.#initArtoolkit();
    } else console.assert(false);
  }

  //////////////////////////////////////////////////////////////////////////////
  //		dispose instance
  //////////////////////////////////////////////////////////////////////////////
  /**
   * dispose is used to dispose the marker and all objects associated.
   * @returns {void} void
   */
  dispose() {
    if (this.context && this.context.arController) {
      this.context.arController.removeEventListener(
        "getMarker",
        this.onGetMarker,
      );
    }

    this.context.removeMarker(this);

    this.object3d = null;
    this.smoothMatrices = [];
  }

  //////////////////////////////////////////////////////////////////////////////
  //		update controls with new modelViewMatrix
  //////////////////////////////////////////////////////////////////////////////

  /**
   * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
   * of things. it is done here.
   * @param {mat4} modelViewMatrix
   * @returns {boolean} renderReqd
   */
  updateWithModelViewMatrix(modelViewMatrix) {
    const markerObject3D = this.object3d;

    // mark object as visible
    markerObject3D.visible = true;

    if (this.context.parameters.trackingBackend === "artoolkit") {
      // apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
      const tmpMatrix = mat4.clone(
        this.context._artoolkitProjectionAxisTransformMatrix,
      );
      mat4.multiply(tmpMatrix, tmpMatrix, modelViewMatrix);

      mat4.copy(modelViewMatrix, tmpMatrix);
    } else {
      console.assert(false);
    }

    // change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
    const markerAxisTransformMatrix = mat4.create();
    mat4.rotateX(
      markerAxisTransformMatrix,
      markerAxisTransformMatrix,
      Math.PI / 2,
    );
    mat4.multiply(modelViewMatrix, modelViewMatrix, markerAxisTransformMatrix);

    let renderReqd = false;

    // change markerObject3D.matrix based on parameters.changeMatrixMode
    if (this.parameters.changeMatrixMode === "modelViewMatrix") {
      if (this.parameters.smooth) {
        let sum,
          i,
          j,
          averages, // average values for matrix over last smoothCount
          exceedsAverageTolerance = 0;

        this.smoothMatrices.push(Array.from(modelViewMatrix)); // add latest

        if (this.smoothMatrices.length < this.parameters.smoothCount + 1) {
          mat4.copy(markerObject3D.matrix, modelViewMatrix); // not enough for average
        } else {
          this.smoothMatrices.shift(); // remove oldest entry
          averages = [];

          for (i = 0; i < modelViewMatrix.length; i++) {
            // loop over entries in matrix
            sum = 0;
            for (j = 0; j < this.smoothMatrices.length; j++) {
              // calculate average for this entry
              sum += this.smoothMatrices[j][i];
            }
            averages[i] = sum / this.parameters.smoothCount;
            // check how many elements vary from the average by at least AVERAGE_MATRIX_TOLERANCE
            if (
              Math.abs(averages[i] - modelViewMatrix[i]) >=
              this.parameters.smoothTolerance
            ) {
              exceedsAverageTolerance++;
            }
          }

          // if moving (i.e. at least AVERAGE_MATRIX_THRESHOLD entries are over AVERAGE_MATRIX_TOLERANCE)
          if (exceedsAverageTolerance >= this.parameters.smoothThreshold) {
            // then update matrix values to average, otherwise, don't render to minimize jitter
            for (i = 0; i < modelViewMatrix.length; i++) {
              modelViewMatrix[i] = averages[i];
            }
            mat4.copy(markerObject3D.matrix, modelViewMatrix);
            renderReqd = true; // render required in animation loop
          }
        }
      } else {
        mat4.copy(markerObject3D.matrix, modelViewMatrix);
      }
    } else if (this.parameters.changeMatrixMode === "cameraTransformMatrix") {
      mat4.invert(markerObject3D.matrix, modelViewMatrix);
    } else {
      console.assert(false);
    }

    // decompose - the matrix into .position, .quaternion, .scale

    const position = vec3.create();
    const quaternion = quat.create();
    const scale = vec3.create();
    mat4.getTranslation(position, markerObject3D.matrix);
    mat4.getRotation(quaternion, markerObject3D.matrix);
    mat4.getScaling(scale, markerObject3D.matrix);

    markerObject3D.position.set(position[0], position[1], position[2]);
    markerObject3D.quaternion.set(
      quaternion[0],
      quaternion[1],
      quaternion[2],
      quaternion[3],
    );
    markerObject3D.scale.set(scale[0], scale[1], scale[2]);
    // dispatchEvent
    this.dispatchEvent({ type: "markerFound" });

    return renderReqd;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		utility functions
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Method to get the name of the marker.
   * @returns {string}
   */
  name() {
    let basename;
    let url;
    let name = "";
    name += this.parameters.type;

    if (this.parameters.type === "pattern") {
      url = this.parameters.patternUrl;
      basename = url.replace(/^.*\//g, "");
      name += " - " + basename;
    } else if (this.parameters.type === "barcode") {
      name += " - " + this.parameters.barcodeValue;
    } else if (this.parameters.type === "nft") {
      url = this.parameters.descriptorsUrl;
      basename = url.replace(/^.*\//g, "");
      name += " - " + basename;
    } else {
      console.assert(false, "no .name() implemented for this marker controls");
    }

    return name;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		init for Artoolkit
  //////////////////////////////////////////////////////////////////////////////
  #initArtoolkit() {
    const _this = this;

    let artoolkitMarkerId = null;

    let delayedInitTimerId = setInterval(() => {
      // check if arController is init
      const arController = _this.context.arController;
      if (arController === null) return;
      // stop looping if it is init
      clearInterval(delayedInitTimerId);
      delayedInitTimerId = null;
      // launch the _postInitArtoolkit
      postInit();
    }, 1000 / 50);

    return;

    function postInit() {
      // check if arController is init
      const arController = _this.context.arController;
      console.assert(arController !== null);

      // start tracking this pattern
      if (_this.parameters.type === "pattern") {
        arController
          .loadMarker(_this.parameters.patternUrl)
          .then(function (markerId) {
            artoolkitMarkerId = markerId;
            arController.trackPatternMarkerId(
              artoolkitMarkerId,
              _this.parameters.size,
            );
          });
      } else if (_this.parameters.type === "barcode") {
        artoolkitMarkerId = _this.parameters.barcodeValue;
        arController.trackBarcodeMarkerId(
          artoolkitMarkerId,
          _this.parameters.size,
        );
      } else if (_this.parameters.type === "nft") {
        // use workers as default
        handleNFT(_this.parameters.descriptorsUrl, arController);
      } else if (_this.parameters.type === "unknown") {
        artoolkitMarkerId = null;
      } else {
        console.log(false, "invalid marker type", _this.parameters.type);
      }

      // listen to the event
      arController.addEventListener("getMarker", function (event) {
        if (
          event.data.type === ARToolkit.PATTERN_MARKER &&
          _this.parameters.type === "pattern"
        ) {
          if (artoolkitMarkerId === null) return;
          if (event.data.marker.idPatt === artoolkitMarkerId)
            onMarkerFound(event);
        } else if (
          event.data.type === ARToolkit.BARCODE_MARKER &&
          _this.parameters.type === "barcode"
        ) {
          if (artoolkitMarkerId === null) return;
          if (event.data.marker.idMatrix === artoolkitMarkerId)
            onMarkerFound(event);
        } else if (
          event.data.type === ARToolkit.UNKNOWN_MARKER &&
          _this.parameters.type === "unknown"
        ) {
          onMarkerFound(event);
        }
      });
    }
    function setMatrix(matrix, value) {
      const array = [];
      for (const key in value) {
        array[key] = value[key];
      }
      if (matrix instanceof Float32Array) {
        matrix.set(array);
      } else {
        matrix = Float32Array.from(array);
      }
    }

    function handleNFT(descriptorsUrl, arController) {
      const worker = new Worker();

      window.addEventListener("arjs-video-loaded", function (ev) {
        const video = ev.detail.component;
        const vw = video.clientWidth;
        const vh = video.clientHeight;

        const pscale = 320 / Math.max(vw, (vh / 3) * 4);

        const w = vw * pscale;
        const h = vh * pscale;
        const pw = Math.max(w, (h / 3) * 4);
        const ph = Math.max(h, (w / 4) * 3);
        const ox = (pw - w) / 2;
        const oy = (ph - h) / 2;

        arController.canvas.style.clientWidth = pw + "px";
        arController.canvas.style.clientHeight = ph + "px";
        arController.canvas.width = pw;
        arController.canvas.height = ph;

        const context_process = arController.canvas.getContext("2d");

        function process() {
          context_process.fillStyle = "black";
          context_process.fillRect(0, 0, pw, ph);
          context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

          const imageData = context_process.getImageData(0, 0, pw, ph);
          worker.postMessage({ type: "process", imagedata: imageData }, [
            imageData.data.buffer,
          ]);
        }

        // initialize the worker
        worker.postMessage({
          type: "init",
          pw: pw,
          ph: ph,
          marker: descriptorsUrl,
          param: arController.cameraParam,
        });

        worker.onmessage = function (ev) {
          if (ev && ev.data && ev.data.type === "endLoading") {
            const loader = document.querySelector(".arjs-loader");
            if (loader) {
              loader.remove();
            }
            const endLoadingEvent = new Event("arjs-nft-loaded");
            window.dispatchEvent(endLoadingEvent);
          }

          if (ev && ev.data && ev.data.type === "loaded") {
            const proj = JSON.parse(ev.data.proj);
            const ratioW = pw / w;
            const ratioH = ph / h;
            proj[0] *= ratioW;
            proj[4] *= ratioW;
            proj[8] *= ratioW;
            proj[12] *= ratioW;
            proj[1] *= ratioH;
            proj[5] *= ratioH;
            proj[9] *= ratioH;
            proj[13] *= ratioH;

            setMatrix(_this.object3d.matrix, proj);
          }

          if (ev && ev.data && ev.data.type === "markerInfos") {
            const nft = JSON.parse(ev.data.marker);
            const nftEvent = new CustomEvent("arjs-nft-init-data", {
              detail: { dpi: nft.dpi, width: nft.width, height: nft.height },
            });
            window.dispatchEvent(nftEvent);
          }

          if (ev && ev.data && ev.data.type === "found") {
            const matrix = JSON.parse(ev.data.matrix);

            onMarkerFound({
              data: {
                type: ARToolkit.NFT_MARKER,
                matrix: matrix,
                msg: ev.data.type,
              },
            });

            _this.context.arController.showObject = true;
          } else {
            _this.context.arController.showObject = false;
          }

          process();
        };
      });
    }

    function onMarkerFound(event) {
      if (
        event.data.type === ARToolkit.PATTERN_MARKER &&
        event.data.marker.cfPatt < _this.parameters.minConfidence
      )
        return;
      if (
        event.data.type === ARToolkit.BARCODE_MARKER &&
        event.data.marker.cfMatrix < _this.parameters.minConfidence
      )
        return;

      const modelViewMatrix = mat4.create();
      mat4.set(modelViewMatrix, ...event.data.matrix);
      _this.updateWithModelViewMatrix(modelViewMatrix);
    }
  }
}

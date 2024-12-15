import { Utils } from "./new-api/arjs-utils";
//ArToolkitContext imported only for baseUrl
import ArToolkitContext from "./arjs-context"; // TODO context build-dependent

/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
export default class Profile {
  constructor() {
    this.reset();

    this.performance("default");
  }

  #guessPerformanceLabel() {
    const isMobile =
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
        ? true
        : false;
    if (isMobile === true) {
      return "phone-normal";
    }
    return "desktop-normal";
  }

  //////////////////////////////////////////////////////////////////////////////
  //		Code Separator
  //////////////////////////////////////////////////////////////////////////////

  /**
   * reset all parameters
   */

  reset() {
    this.sourceParameters = {
      // to read from the webcam
      sourceType: "webcam",
    };

    this.contextParameters = {
      cameraParametersUrl:
        ArToolkitContext.baseURL + "../data/data/camera_para.dat", // TODO dependent of build?
      detectionMode: "mono",
    };
    this.defaultMarkerParameters = {
      type: "pattern",
      patternUrl: ArToolkitContext.baseURL + "../data/data/patt.hiro", // TODO dependent of build?
      changeMatrixMode: "modelViewMatrix",
    };
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		Performance
  //////////////////////////////////////////////////////////////////////////////

  performance(label) {
    if (label === "default") {
      label = this.#guessPerformanceLabel();
    }

    if (label === "desktop-fast") {
      this.contextParameters.canvasWidth = 640 * 3;
      this.contextParameters.canvasHeight = 480 * 3;

      this.contextParameters.maxDetectionRate = 30;
    } else if (label === "desktop-normal") {
      this.contextParameters.canvasWidth = 640;
      this.contextParameters.canvasHeight = 480;

      this.contextParameters.maxDetectionRate = 60;
    } else if (label === "phone-normal") {
      this.contextParameters.canvasWidth = 80 * 4;
      this.contextParameters.canvasHeight = 60 * 4;

      this.contextParameters.maxDetectionRate = 30;
    } else if (label === "phone-slow") {
      this.contextParameters.canvasWidth = 80 * 3;
      this.contextParameters.canvasHeight = 60 * 3;

      this.contextParameters.maxDetectionRate = 30;
    } else {
      console.assert(false, "unknonwn label " + label);
    }
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		Marker
  //////////////////////////////////////////////////////////////////////////////

  defaultMarker(trackingBackend) {
    trackingBackend = trackingBackend || this.contextParameters.trackingBackend;

    if (trackingBackend === "artoolkit") {
      this.contextParameters.detectionMode = "mono";
      this.defaultMarkerParameters.type = "pattern";
      this.defaultMarkerParameters.patternUrl =
        ArToolkitContext.baseURL + "../data/data/patt.hiro"; // TODO dependent of build?
    } else console.assert(false);

    return this;
  }
  //////////////////////////////////////////////////////////////////////////////
  //		Source
  //////////////////////////////////////////////////////////////////////////////
  sourceWebcam() {
    this.sourceParameters.sourceType = "webcam";
    delete this.sourceParameters.sourceUrl;
    return this;
  }

  sourceVideo(url) {
    this.sourceParameters.sourceType = "video";
    this.sourceParameters.sourceUrl = url;
    return this;
  }

  sourceImage(url) {
    this.sourceParameters.sourceType = "image";
    this.sourceParameters.sourceUrl = url;
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		trackingBackend
  //////////////////////////////////////////////////////////////////////////////
  trackingBackend(trackingBackend) {
    console.warn(
      "stop profile.trackingBackend() obsolete function. use .trackingMethod instead",
    );
    this.contextParameters.trackingBackend = trackingBackend;
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		trackingBackend
  //////////////////////////////////////////////////////////////////////////////
  changeMatrixMode(changeMatrixMode) {
    this.defaultMarkerParameters.changeMatrixMode = changeMatrixMode;
    return this;
  }

  //////////////////////////////////////////////////////////////////////////////
  //		trackingBackend
  //////////////////////////////////////////////////////////////////////////////
  trackingMethod(trackingMethod) {
    const data = Utils.parseTrackingMethod(trackingMethod);
    this.defaultMarkerParameters.markersAreaEnabled = data.markersAreaEnabled;
    this.contextParameters.trackingBackend = data.trackingBackend;
    return this;
  }

  /**
   * check if the profile is valid. Throw an exception is not valid
   */
  checkIfValid() {
    return this;
  }
}

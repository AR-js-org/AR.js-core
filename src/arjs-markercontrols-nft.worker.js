/* eslint-env worker */
import jsartoolkit from "@ar-js-org/artoolkit5-js";
const { ARController } = jsartoolkit;

let next;
onmessage = function (e) {
  const msg = e.data;
  switch (msg.type) {
    case "init": {
      load(msg);
      return;
    }
    case "process": {
      next = msg.imagedata;
      process();
      return;
    }
  }
};

next = null;

let ar = null;
let markerResult = null;

function load(msg) {
  let camUrl, nftMarkerUrl;
  const basePath = self.origin;
  console.log("base path:", basePath);
  // test if the msg.param (the incoming url) is an http or https path
  const regexC =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/gim;
  const reC = regexC.test(msg.param);
  if (reC === true) {
    camUrl = msg.param;
  } else if (reC === false) {
    camUrl = basePath + "/" + msg.param;
  }
  var onLoad = function (arController) {
    ar = arController;
    const cameraMatrix = ar.getCameraMatrix();

    // after the ARController is set up, we load the NFT Marker
    const regexM =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/gim;
    const reM = regexM.test(msg.marker);
    if (reM === true) {
      nftMarkerUrl = msg.marker;
    } else if (reM === false) {
      nftMarkerUrl = basePath + "/" + msg.marker;
    }
    ar.loadNFTMarker(nftMarkerUrl)
      .then(function (markerId) {
        ar.trackNFTMarkerId(markerId);
        let marker = ar.getNFTData(ar.id, 0);
        console.log("nftMarker data: ", marker);
        postMessage({ type: "markerInfos", marker: JSON.stringify(marker) });
        postMessage({ type: "endLoading" });
      })
      .catch(function (err) {
        console.log("Error in loading marker on Worker", err);
      });

    // ...and we listen for event when marker has been found from camera
    ar.addEventListener("getNFTMarker", function (ev) {
      // let AR.js know that a NFT marker has been found, with its matrix for positioning
      markerResult = {
        type: "found",
        matrix: JSON.stringify(ev.data.matrix),
      };
    });

    postMessage({ type: "loaded", proj: JSON.stringify(cameraMatrix) });
  };

  const onError = function (error) {
    console.error("Error while intizalizing arController", error);
  };

  ARController.initWithDimensions(msg.pw, msg.ph, camUrl)
    .then(onLoad)
    .catch(onError);
}

function process() {
  markerResult = null;

  if (ar && ar.process) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({
      type: "not found",
    });
  }
  next = null;
}

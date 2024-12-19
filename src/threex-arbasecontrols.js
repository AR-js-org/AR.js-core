export default class ArBaseControls {
  constructor(object3d) {
    if (new.target === ArBaseControls) {
      throw new TypeError("Cannot construct ArBaseControls instances directly");
    }
    this.id = ArBaseControls._id++;
    this.object3d = object3d;
    this.object3d.matrixAutoUpdate = false;
    this.object3d.visible = false;
  }

  /**
   * Method to get the name of the marker.
   * @returns {string}
   */
  update() {
    throw new Error("You have to implement the method update!");
  }

  name() {
    throw new Error("You have to implement the method name!");
  }
}

ArBaseControls._id = 0;

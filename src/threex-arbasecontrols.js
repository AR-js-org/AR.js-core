export default class ArBaseControls extends THREE.EventDispatcher {
  constructor(object3d) {
    super();
    if (new.target === ArBaseControls) {
      throw new TypeError('Cannot construct ArBaseControls instances directly');
    }
    this.id = ArBaseControls._id++;
    this.object3d = object3d;
    this.object3d.matrixAutoUpdate = false;
    this.object3d.visible = false;
  }

  /**
   * a virtual update method to implement in the derived class.
   * @return {void}
   */
  update(object3d) {
    throw new Error('You have to implement the method update!');
  }

  /**
   * a virtual name method to implement in the derived class.
   * Method to get the name of the marker.
   * @returns {string}
   */
  name() {
    throw new Error('You have to implement the method name!');
  }
}

ArBaseControls._id = 0;

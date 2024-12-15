/**
 *  * define a Session
 *
 * @param {Object} parameters - parameters for this session
 */
export default class Session {
    constructor(parameters: any);
    parameters: {
        renderer: any;
        camera: any;
        scene: any;
        sourceParameters: {};
        contextParameters: {};
    };
    arSource: Source;
    arContext: Context;
    update: () => void;
    onResize(): void;
}
import Source from "../arjs-source";
import Context from "../arjs-context";
//# sourceMappingURL=arjs-session.d.ts.map
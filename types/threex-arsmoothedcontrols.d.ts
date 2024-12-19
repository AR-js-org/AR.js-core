export default class ArSmoothedControls extends ArBaseControls {
    constructor(object3d: any, parameters: any);
    _lastLerpStepAt: number;
    _visibleStartedAt: number;
    _unvisibleStartedAt: number;
    parameters: {
        lerpPosition: number;
        lerpQuaternion: number;
        lerpScale: number;
        lerpStepDelay: number;
        minVisibleDelay: number;
        minUnvisibleDelay: number;
    };
    update(targetObject3d: any): void;
    name(): string;
}
import ArBaseControls from "./threex-arbasecontrols";
//# sourceMappingURL=threex-arsmoothedcontrols.d.ts.map
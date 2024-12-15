/**
 * Create a debug UI for an ARjs.Anchor
 *
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
export class SessionDebugUI {
    /**
     * Url of augmented-website service - if === '' then don't include augmented-website link
     * @type {String}
     */
    static AugmentedWebsiteURL: string;
    constructor(arSession: any);
    domElement: HTMLDivElement;
    #private;
}
/**
 * Create an debug UI for an ARjs.Anchor
 *
 * @param {ARjs.Anchor} arAnchor - the anchor to user
 */
export class AnchorDebugUI {
    /**
     * url for the markers-area learner. if not set, take the default one
     * @type {String}
     */
    static MarkersAreaLearnerURL: string;
    constructor(arAnchor: any);
    domElement: HTMLDivElement;
    #private;
}
//# sourceMappingURL=arjs-debugui.d.ts.map
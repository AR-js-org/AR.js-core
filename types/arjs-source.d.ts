export default class Source {
    constructor(parameters: any);
    ready: boolean;
    domElement: HTMLImageElement | HTMLVideoElement;
    parameters: {
        sourceType: string;
        sourceUrl: any;
        deviceId: any;
        sourceWidth: number;
        sourceHeight: number;
        displayWidth: number;
        displayHeight: number;
    };
    onInitialClick: () => void;
    init(onReady: any, onError: any): this;
    dispose(): void;
    hasMobileTorch(): boolean;
    _currentTorchStatus: any;
    /**
     * toggle the flash/torch of the mobile fun if applicable.
     * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
     */
    toggleMobileTorch(): void;
    domElementWidth(): number;
    domElementHeight(): number;
    onResizeElement(...args: any[]): void;
    copyElementSizeTo(otherElement: any): void;
    copySizeTo(...args: any[]): void;
    onResize(arToolkitContext: any, renderer: any, camera: any, ...args: any[]): any;
    #private;
}
//# sourceMappingURL=arjs-source.d.ts.map
declare module 'canvas-sketch' {
  type DimensionPresets =
    | '2a0'
    | '2r'
    | '3r'
    | '4a0'
    | '4r'
    | '5r'
    | '6r'
    | '8r'
    | '10r'
    | '11r'
    | '12r'
    | 'a0'
    | 'a1'
    | 'a2'
    | 'a3'
    | 'a4'
    | 'a5'
    | 'a6'
    | 'a7'
    | 'a8'
    | 'a9'
    | 'a10'
    | 'ansi-a'
    | 'ansi-b'
    | 'ansi-c'
    | 'ansi-d'
    | 'ansi-e'
    | 'arch-a'
    | 'arch-b'
    | 'arch-c'
    | 'arch-d'
    | 'arch-e'
    | 'arch-e1'
    | 'arch-e2'
    | 'arch-e3'
    | 'b0'
    | 'b1'
    | 'b1+'
    | 'b2'
    | 'b2+'
    | 'b3'
    | 'b4'
    | 'b5'
    | 'b6'
    | 'b7'
    | 'b8'
    | 'b9'
    | 'b10'
    | 'b11'
    | 'b12'
    | 'business-card'
    | 'c0'
    | 'c1'
    | 'c2'
    | 'c3'
    | 'c4'
    | 'c5'
    | 'c6'
    | 'c7'
    | 'c8'
    | 'c9'
    | 'c10'
    | 'c11'
    | 'c12'
    | 'half-letter'
    | 'junior-legal'
    | 'ledger'
    | 'legal'
    | 'letter'
    | 'postcard'
    | 'poster'
    | 'poster-small'
    | 'poster-large'
    | 'tabloid';

    type ExportFrameOptions = {
      commit?: boolean;
      save?: boolean;
    };

  type Orientation = 'initial' | 'landscape' | 'portrait';

  type PaperSize = {
    dimensions: number[];
    units: Units;
  };

  type PlaybackRate = 'fixed' | 'throttle';
  
  type Units = 'cm' | 'ft' | 'in' | 'm' | 'mm' | 'pc' | 'px';

  export type SettingsObject = {
    animate?: boolean;
    attributes?: object;
    bleed?: number;
    canvas?: HTMLCanvasElement;
    context?: CanvasRenderingContext2D | 'webgl' | '2d';
    data?: any;
    dimensions?: number[] | DimensionPresets;
    duration?: number;
    id?: string;
    encoding?: string;
    encodingQuality?: number;
    exportPixelRatio?: number;
    file?: string;
    flush?: boolean;
    fps?: number;
    frame?: number;
    hotkeys?: boolean;
    loop?: boolean;
    maxPixelRatio?: number;
    name?: string;
    orientation?: Orientation;
    p5?: boolean | object;
    parent?: HTMLElement | false;
    pixelated?: boolean;
    pixelsPerInch?: number;
    pixelRatio?: number;
    playbackRate?: PlaybackRate;
    playing?: boolean;
    prefix?: string;
    resizeCanvas?: boolean;
    scaleContext?: boolean;
    scaleToFit?: boolean;
    scaleToFitPadding?: number;
    scaleToView?: boolean;
    styleCanvas?: boolean;
    suffix?: string;
    time?: number;
    timeScale?: number;
    totalFrames?: number;
    units?: Units;
  };

  export type Props = {
    canvas: HTMLCanvasElement;
    canvasWidth: number;
    canvasHeight: number;
    context: CanvasRenderingContext2D;
    deltaTime: number;
    duration: number;
    exportFrame: (ExportFrameOptions) => void;
    exporting: boolean;
    fps: number;
    frame: number;
    height: number;
    pause: () => void;
    pixelRatio: number;
    pixelsPerInch: number;
    play: () => void;
    playhead: number;
    playing: boolean;
    recording: boolean;
    render: () => void;
    scaleX: number;
    scaleY: number;
    settings: SettingsObject;
    stop: () => void;
    styleHeight: number;
    styleWidth: number;
    time: number;
    togglePlay: () => void;
    totalFrames: number;
    units: Units;
    update: (settings: SettingsObject) => void;
    width: number;
  };

  export type SketchFunction = (props: Props) => (props: Props) => void;

  export const PaperSizes: { [key in DimensionPresets]: PaperSize };

  export default function (sketch: SketchFunction, settings: SettingsObject): void;
}

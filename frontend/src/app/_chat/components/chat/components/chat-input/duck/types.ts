import { RefObject } from "react";

export interface AudioVisualizerRef {
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    destroy: () => void;
    isRecording: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
}

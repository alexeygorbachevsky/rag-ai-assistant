"use client";

import { useEffect, RefObject, useImperativeHandle } from "react";

import { useAudioVisualizer } from "./duck/hooks";
import { AudioVisualizerRef } from "../../duck/types";

interface AudioVisualizerProps {
    isRecording?: boolean;
    onError?: (error: Error) => void;
    ref?: RefObject<AudioVisualizerRef | null>;
}

const AudioVisualizer = ({ isRecording = false, onError, ref }: AudioVisualizerProps) => {
    const {
        containerRef,
        startRecording,
        stopRecording,
        destroy,
        isRecording: isRecordingState,
    } = useAudioVisualizer(onError);

    useImperativeHandle(ref, () => ({
        startRecording,
        stopRecording,
        destroy,
        get isRecording() {
            return isRecordingState;
        },
        containerRef,
    }));

    useEffect(() => {
        if (isRecording) {
            startRecording();

            return;
        }

        stopRecording();
    }, [isRecording]);

    return <div ref={containerRef} />;
};

export default AudioVisualizer;

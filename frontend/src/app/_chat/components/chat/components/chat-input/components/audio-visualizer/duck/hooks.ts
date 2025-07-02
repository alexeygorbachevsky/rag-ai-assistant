import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";

import { AudioVisualizerRef } from "../../../duck/types";

export const useAudioVisualizer = (onError?: (error: Error) => void): AudioVisualizerRef => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const recordRef = useRef<RecordPlugin | null>(null);
    const isRecordingRef = useRef<boolean>(false);

    const setupWavesurfer = () => {
        if (!containerRef.current) {
            return;
        }

        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#ffffff",
            progressColor: "#ffffff",
            cursorWidth: 0,
            height: 36,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
        });

        containerRef.current.style.width = "calc(100% - 120px)";
        containerRef.current.style.height = "36px";
        containerRef.current.style.overflow = "hidden";
        containerRef.current.style.borderRadius = "4px";

        const record = ws.registerPlugin(
            RecordPlugin.create({
                renderRecordedAudio: false,
                scrollingWaveform: true,
            }),
        );

        record.on("record-start", () => {
            isRecordingRef.current = true;
        });

        record.on("record-end", () => {
            isRecordingRef.current = false;
        });

        wavesurferRef.current = ws;
        recordRef.current = record;
    };

    const startRecording = async () => {
        try {
            setupWavesurfer();

            if (recordRef.current) {
                await recordRef.current.startRecording();
            }
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    };

    const stopRecording = () => {
        try {
            recordRef.current?.stopRecording();
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    };

    const destroy = () => {
        try {
            recordRef.current?.stopRecording();
            wavesurferRef.current?.destroy();
            wavesurferRef.current = null;
            recordRef.current = null;
            isRecordingRef.current = false;
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        } catch {
            //
        }
    };

    useEffect(
        () => () => {
            destroy();
        },
        [],
    );

    return {
        startRecording,
        stopRecording,
        destroy,
        get isRecording() {
            return isRecordingRef.current;
        },
        containerRef,
    };
};

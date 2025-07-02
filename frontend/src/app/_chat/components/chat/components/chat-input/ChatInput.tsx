"use client";

import { useRef, useState } from "react";

import ArrowUpIcon from "icons/arrow-up.svg";
import DictateIcon from "icons/dictate.svg";
import CrossIcon from "icons/cross.svg";
import CheckmarkIcon from "icons/checkmark.svg";
import StopIcon from "icons/stop.svg";

import { useChatContext } from "contexts/ChatContext";

import { TextArea } from "components/input";

import AudioVisualizer from "./components/audio-visualizer";

import { AudioVisualizerRef } from "./duck/types";
import { useSpeechRecognition } from "./duck/hooks";

import styles from "./styles/styles.module.scss";

const ChatInput = () => {
    const { input, setInput, onSubmit, onStop, status } = useChatContext();
    const [isDictating, setIsDictating] = useState(false);

    const audioVisualizerRef = useRef<AudioVisualizerRef>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const recognitionRef = useSpeechRecognition({ setIsDictating, input, onSubmit, setInput, isDictating });

    const isGenerating = status === "submitted" || status === "streaming";

    const toggleRecording = async () => {
        if (isDictating) {
            audioVisualizerRef.current?.stopRecording();
            recognitionRef.current?.stop();
            setIsDictating(false);
            return;
        }

        try {
            await audioVisualizerRef.current?.startRecording();
            recognitionRef.current?.start();
            setIsDictating(true);
        } catch (err) {
            console.error("Microphone error", err);
        }
    };

    const handleRecordingError = () => {
        setIsDictating(false);
    };

    return (
        <form className={styles.form}>
            <div className={styles.chatInput}>
                <TextArea
                    ref={textareaRef}
                    textareaId="chat-input"
                    name="chat-input"
                    placeholder="Ask anything"
                    className={styles.textInput}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();

                            if (!input || isGenerating) {
                                return;
                            }

                            if (isDictating) {
                                toggleRecording();
                            }

                            onSubmit();
                        }
                    }}
                    after={
                        <div className={styles.inputButtons}>
                            <AudioVisualizer
                                ref={audioVisualizerRef}
                                isRecording={isDictating}
                                onError={handleRecordingError}
                            />

                            {isDictating ? (
                                <>
                                    <button type="button" className={styles.audioButton} onClick={toggleRecording}>
                                        <CrossIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.audioButton}
                                        onClick={() => {
                                            toggleRecording();
                                            onSubmit();
                                        }}
                                    >
                                        <CheckmarkIcon />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => {
                                            textareaRef.current?.focus();
                                            toggleRecording();
                                        }}
                                    >
                                        <DictateIcon />
                                    </button>
                                    {isGenerating ? (
                                        <button type="button" onClick={onStop} className={styles.iconButton}>
                                            <StopIcon />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={onSubmit}
                                            className={styles.iconButton}
                                            disabled={!input || isGenerating}
                                        >
                                            <ArrowUpIcon />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    }
                />
            </div>
        </form>
    );
};

export default ChatInput;

import { MouseEvent, useEffect, useRef } from "react";

interface UseSpeechRecognitionParams {
    isDictating: boolean;
    setIsDictating: (isDictating: boolean) => void;
    input: string;
    setInput: (input: string) => void;
    onSubmit: (event?: MouseEvent<HTMLButtonElement>, isVoice?: boolean) => void;
}

export const useSpeechRecognition = ({ setInput }: UseSpeechRecognitionParams) => {
    const recognitionRef = useRef<SpeechRecognition>(null);
    const finalTranscriptRef = useRef("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.trim();
                if (event.results[i].isFinal) {
                    if (transcript) {
                        finalTranscriptRef.current += transcript + " ";
                    }
                } else {
                    interimTranscript += transcript + " ";
                }
            }

            setInput(finalTranscriptRef.current + interimTranscript);
        };

        recognition.onend = () => {
            finalTranscriptRef.current = "";
            setInput("");
        };

        recognitionRef.current = recognition;
    }, []);

    return recognitionRef;
};

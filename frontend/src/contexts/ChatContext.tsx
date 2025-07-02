"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { toast } from "react-toastify";
import { UIMessage } from "ai";

import { ChatMode } from "../constants/chat";
import { LanguageModels } from "../constants/models";
import { RAG_API } from "../constants/api";

interface ChatContextType {
    messages: UIMessage[];
    input: string;
    setInput: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
    status: "submitted" | "streaming" | "ready" | "error";
    chatMode: ChatMode;
    selectedModel: LanguageModels;
    onChatModeChange: (mode: ChatMode) => void;
    onModelChange: (model: LanguageModels) => void;
    onDeleteChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const chatMode = searchParams.get("mode") as ChatMode;
    const selectedModel = searchParams.get("model") as LanguageModels;

    const { messages, input, setInput, handleSubmit, status, stop, setMessages } = useChat({
        api: `${RAG_API}/ask?mode=${chatMode}&model=${selectedModel}`,
        onError: error => {
            toast.error(error.message);
        },
    });

    const onSubmit = () => {
        handleSubmit();
        setInput("");
    };

    const onStop = () => {
        stop();
    };

    const onChatModeChange = (mode: ChatMode) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", mode);
        router.push(`?${params.toString()}`);
    };

    const onModelChange = (model: LanguageModels) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("model", model);
        router.push(`?${params.toString()}`);
    };

    const onDeleteChats = () => {
        setMessages([]);
    };

    const value: ChatContextType = {
        messages,
        input,
        setInput,
        onSubmit,
        onStop,
        status,
        chatMode,
        selectedModel,
        onChatModeChange,
        onModelChange,
        onDeleteChats,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
    const context = useContext(ChatContext);

    if (!context) {
        throw new Error("useChatContext must be used within ChatProvider");
    }

    return context;
};

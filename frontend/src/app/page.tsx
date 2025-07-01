"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import joinClassNames from "classnames";
import { useChat } from "@ai-sdk/react";
import { toast } from "react-toastify";

import Sidebar from "./_chat/components/sidebar";
import Header from "./_chat/components/header";
import MessageList from "./_chat/components/message-list";
import ChatInput from "./_chat/components/chat-input";

import { ChatMode } from "constants/chat";
import { LanguageModels } from "constants/models";
import { RAG_API } from "constants/api";

import styles from "./_chat/styles/styles.module.scss";

const Chat = () => {
    const [isSidebarOpened, setIsSidebarOpened] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();

    const chatMode = (searchParams.get("mode") as ChatMode) || "mia-collection";
    const selectedModel = (searchParams.get("model") as LanguageModels) || LanguageModels["deepseek-chat-v3-0324"];

    const mode = searchParams.get("mode") as ChatMode;
    const model = searchParams.get("model") as LanguageModels;

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let shouldUpdate = false;

        if (!ChatMode[mode]) {
            params.set("mode", "mia-collection");
            shouldUpdate = true;
        }

        if (!LanguageModels[model]) {
            params.set("model", LanguageModels["deepseek-chat-v3-0324"]);
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            router.replace(`?${params.toString()}`);
        }
    }, [mode, model, router]);

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

    const toggleSidebar = () => {
        setIsSidebarOpened(prev => !prev);
    };

    const handleChatModeChange = (mode: ChatMode) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", mode);
        router.push(`?${params.toString()}`);
    };

    const handleModelChange = (model: LanguageModels) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("model", model);
        router.push(`?${params.toString()}`);
    };

    const handleSendRagData = (files: File[]) => {
        if (files.length > 0) {
            const fileNames = files.map(file => file.name).join(", ");
            setInput(`RAG Files: ${fileNames}`);
        }
    };

    const handleDeleteChats = () => {
        setMessages([]);
    };

    const shouldShowTypingIndicator =
        status === "submitted" && messages.length > 0 && messages[messages.length - 1]?.role === "user";

    return (
        <div className={styles.wrapper}>
            <Sidebar
                isOpened={isSidebarOpened}
                onToggle={toggleSidebar}
                onSendRagData={handleSendRagData}
                chatMode={chatMode}
                onChatModeChange={handleChatModeChange}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                onDeleteChats={handleDeleteChats}
            />

            <main className={joinClassNames(styles.mainArea, { [styles.mainAreaExpended]: !isSidebarOpened })}>
                <Header isSidebarOpened={isSidebarOpened} onToggleSidebar={toggleSidebar} />

                {messages.length > 0 ? (
                    <MessageList messages={messages} isLoading={shouldShowTypingIndicator} />
                ) : (
                    <div className={styles.emptyStateContainer}>
                        <div className={styles.rateLimitInfo}>
                            <div className={styles.rateLimitContent}>
                                <h3 className={styles.rateLimitTitle}>Usage Limits</h3>
                                <p className={styles.rateLimitDescription}>
                                    To ensure quality service for all users, there are{" "}
                                    <strong>daily usage limits</strong>. These limits help maintain reliable service
                                    while managing operational costs.
                                </p>
                                <div className={styles.rateLimitTips}>
                                    <span>Make your questions as specific as possible for the best results</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!messages.length && <p className={styles.chatTitle}>What can I help with?</p>}

                <ChatInput input={input} setInput={setInput} onSubmit={onSubmit} onStop={onStop} status={status} />
            </main>
        </div>
    );
};

const ChatPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <Chat />
    </Suspense>
);

export default ChatPage;

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import joinClassNames from "classnames";
import { useChat } from "@ai-sdk/react";

import Sidebar from "./_chat/components/sidebar";
import Header from "./_chat/components/header";
import MessageList from "./_chat/components/message-list";
import ChatInput from "./_chat/components/chat-input";

import { ChatMode } from "constants/chat";

import styles from "./_chat/styles/styles.module.scss";

const Chat = () => {
    const [isSidebarOpened, setIsSidebarOpened] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();

    const chatMode = (searchParams.get("mode") as ChatMode) || "mia-collection";

    useEffect(() => {
        const mode = searchParams.get("mode") as ChatMode;

        if (!ChatMode[mode]) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("mode", "mia-collection");
            router.replace(`?${params.toString()}`);
        }
    }, [searchParams, router]);

    const { messages, input, setInput, handleSubmit, error, status } = useChat({
        api: `http://localhost:3001/ask?mode=${chatMode}`,
    });

    const onSubmit = () => {
        handleSubmit();
        setInput("");
    };

    const toggleSidebar = () => {
        setIsSidebarOpened(prev => !prev);
    };

    const handleChatModeChange = (mode: ChatMode) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", mode);
        router.push(`?${params.toString()}`);
    };

    const handleSendRagData = (files: File[]) => {
        if (files.length > 0) {
            const fileNames = files.map(file => file.name).join(", ");
            setInput(`RAG Files: ${fileNames}`);
        }
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
            />

            <main className={joinClassNames(styles.mainArea, { [styles.mainAreaExpended]: !isSidebarOpened })}>
                <Header isSidebarOpened={isSidebarOpened} onToggleSidebar={toggleSidebar} />

                <MessageList messages={messages} isLoading={shouldShowTypingIndicator} />

                {!messages.length && <p className={styles.chatTitle}>What can I help with?</p>}

                {error && <div className={styles.error}>Error: {error.message}</div>}

                <ChatInput input={input} setInput={setInput} onSubmit={onSubmit} />
            </main>
        </div>
    );
};

const ChatPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Chat />
        </Suspense>
    );
};

export default ChatPage;

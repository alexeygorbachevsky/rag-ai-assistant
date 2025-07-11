"use client";

import { useMemo } from "react";

import { useChatContext } from "contexts/ChatContext";

import Message from "./components/message";
import TypingIndicator from "./components/stream-indicator";

import { useMessagesScroll } from "./duck/hooks";

import styles from "./styles/styles.module.scss";

const MessageList = () => {
    const { messages, status } = useChatContext();
    const { messagesRef } = useMessagesScroll({ messages });

    const lastMessage = messages[messages.length - 1];
    const isLoading =
        ((status === "submitted" || status === "streaming") && lastMessage?.role === "user") ||
        (lastMessage?.role === "assistant" && !lastMessage?.content.trim());

    const renderedMessages = useMemo(
        () => messages.filter(msg => msg.content.trim()).map(msg => <Message key={msg.id} {...msg} />),
        [messages],
    );

    return (
        <section className={styles.messagesScrollWrapper} ref={messagesRef}>
            <div className={styles.messagesArea}>
                <div className={styles.spacer} />
                {renderedMessages}
                {isLoading && <TypingIndicator />}
                <div className={styles.spacer} />
            </div>
        </section>
    );
};

export default MessageList;

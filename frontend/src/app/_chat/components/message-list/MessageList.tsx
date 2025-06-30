"use client";

import { useRef, useEffect } from "react";
import { UIMessage } from "ai";

import Message from "./components/message";
import TypingIndicator from "./components/generation-indicator";

import styles from "./styles/styles.module.scss";

interface MessagesListProps {
    messages: UIMessage[];
    isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessagesListProps) => {
    const messagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <section className={styles.messagesScrollWrapper} ref={messagesRef}>
            <div className={styles.messagesArea}>
                <div className={styles.spacer} />
                {messages.map(msg => (
                    <Message key={msg.id} {...msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div className={styles.spacer} />
            </div>
        </section>
    );
};

export default MessageList;


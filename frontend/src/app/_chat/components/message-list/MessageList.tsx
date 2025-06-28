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

    const isAtBottom = () => {
        if (!messagesRef.current) {
            return true;
        }

        const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;

        return scrollHeight - scrollTop - clientHeight < 100;
    };

    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTo({
                top: messagesRef.current.scrollHeight - messagesRef.current.clientHeight,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, isLoading]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            if (lastMessage?.role === "assistant" && isAtBottom()) {
                scrollToBottom();
            }
        }
    }, [messages[messages.length - 1]?.content]);

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

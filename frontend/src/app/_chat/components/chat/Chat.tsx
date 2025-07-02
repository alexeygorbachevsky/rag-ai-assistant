"use client";

import { useChatContext } from "contexts/ChatContext";

import MessageList from "./components/message-list";
import ChatInput from "./components/chat-input";

import styles from "./styles/styles.module.scss";

const Chat = () => {
    const { messages } = useChatContext();

    return (
        <>
            {messages.length ? (
                <MessageList />
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

            <ChatInput />
        </>
    );
};

export default Chat;

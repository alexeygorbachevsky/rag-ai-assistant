import { FC } from "react";
import { UIMessage } from "ai";
import ReactMarkdown from 'react-markdown';

import joinClassNames from "classnames";

import { parseRAGResponse } from "./duck/selectors";

import styles from "./styles/styles.module.scss";

const Message: FC<UIMessage> = ({ role, content }) => {
    const isRAG = role === "assistant" && content.includes("**Sources:**");

    if (isRAG) {
        const { answer, sources } = parseRAGResponse(content);

        return (
            <div className={joinClassNames(styles.message, styles.assistant)}>
                <div className={joinClassNames(styles.bubble, styles.assistantBubble)}>
                    <div className={styles.ragAnswer}>{answer}</div>

                    {sources && (
                        <div className={styles.ragSources}>
                            <strong>Sources:</strong>
                            <div className={styles.sourcesList}>
                                {sources
                                    .split("\n")
                                    .filter(line => line.trim())
                                    .map((source, index) => (
                                        <div key={index} className={styles.sourceItem}>
                                            {source}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={joinClassNames(styles.message, {
                [styles.user]: role === "user",
                [styles.assistant]: role === "assistant",
            })}
        >
            <span className={joinClassNames(styles.bubble, { [styles.assistantBubble]: role === "assistant" })}>
                <ReactMarkdown>{content}</ReactMarkdown>
            </span>
        </div>
    );
};

export default Message;

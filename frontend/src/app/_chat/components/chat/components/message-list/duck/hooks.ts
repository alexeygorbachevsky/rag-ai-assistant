import { useRef, useEffect } from "react";
import { UIMessage } from "ai";

interface UseMessagesScroll {
    messages: UIMessage[];
}

export const useMessagesScroll = ({ messages }: UseMessagesScroll) => {
    const messagesRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

    useEffect(() => {
        const handleScroll = () => {
            if (messagesRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
                shouldAutoScrollRef.current = scrollTop + clientHeight >= scrollHeight - 10;
            }
        };

        const element = messagesRef.current;
        element?.addEventListener("scroll", handleScroll);

        return () => element?.removeEventListener("scroll", handleScroll);
    }, []);

    const lastMessage = messages[messages.length - 1];

    useEffect(() => {
        if (lastMessage?.role === "user") {
            shouldAutoScrollRef.current = true;
        }
    }, [lastMessage?.role]);

    useEffect(() => {
        if (shouldAutoScrollRef.current && messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    return {
        messagesRef,
    };
};

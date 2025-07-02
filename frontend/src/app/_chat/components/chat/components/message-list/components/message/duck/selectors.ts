export const parseRAGResponse = (content: string) => {
    const parts = content.split("**Sources:**");
    if (parts.length === 2) {
        return {
            answer: parts[0].trim(),
            sources: parts[1].trim(),
        };
    }

    return { answer: content, sources: null };
};

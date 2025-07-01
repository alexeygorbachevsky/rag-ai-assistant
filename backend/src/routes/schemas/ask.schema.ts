import { z } from "zod";

export const askSchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
            }),
        )
        .optional(),
});

export const askQuerySchema = z.object({
    mode: z.string().optional(),
    model: z.string().optional(),
});

export const askRouteSchema = {
    description: "Ask a question to the RAG AI system",
    tags: ["AI"],
    querystring: {
        type: "object",
        properties: {
            mode: {
                type: "string",
                description: "Mode for the AI system (e.g., 'mia-collection')",
            },
            model: {
                type: "string",
                description: "Language model to use for the response",
            },
        },
    },
    body: {
        type: "object",
        properties: {
            messages: {
                type: "array",
                description: "Conversation history with messages",
                items: {
                    type: "object",
                    properties: {
                        role: {
                            type: "string",
                            enum: ["user", "assistant"],
                            description: "Role of the message sender",
                        },
                        content: {
                            type: "string",
                            description: "Content of the message",
                        },
                    },
                    required: ["role", "content"],
                },
            },
        },
        anyOf: [{ required: ["question"] }, { required: ["messages"] }],
    },
    response: {
        200: {
            description: "Streaming AI response",
            content: {
                "text/plain": {
                    schema: {
                        type: "string",
                        description: "Streaming text response from AI",
                    },
                },
            },
        },
        400: {
            type: "object",
            properties: {
                error: { type: "string", description: "Validation error message" },
            },
        },
        500: {
            type: "object",
            properties: {
                error: { type: "string", description: "Internal server error" },
            },
        },
    },
};

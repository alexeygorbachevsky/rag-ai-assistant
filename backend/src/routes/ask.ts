import type { FastifyInstance } from "fastify";
import { z } from "zod";

const askSchema = z.object({
    question: z.string().min(1, "Question is required").optional(),
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
            }),
        )
        .optional(),
});

const askQuerySchema = z.object({
    mode: z.string().optional(),
});

export const registerRoutes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_request, _reply) => {
        return { message: "Hi, what can I help with?" };
    });

    fastify.options("/ask", async (request, reply) => {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
        reply.header("Access-Control-Allow-Headers", "Content-Type, Accept");
        reply.code(204).send();
    });

    let isInitialized = false;

    fastify.post(
        "/ask",
        {
            schema: {
                description: "Ask a question to the RAG AI system",
                tags: ["AI"],
                querystring: {
                    type: "object",
                    properties: {
                        mode: {
                            type: "string",
                            description: "Mode for the AI system (e.g., 'mia-collection')",
                        },
                    },
                },
                body: {
                    type: "object",
                    properties: {
                        question: {
                            type: "string",
                            minLength: 1,
                            description: "Direct question to ask the AI",
                        },
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
            },
        },
        async (request, reply) => {
            const startTime = Date.now();

            try {
                const validatedBody = askSchema.parse(request.body);
                const validatedQuery = askQuerySchema.parse(request.query);

                let question: string;
                let conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

                if (validatedBody.messages?.length) {
                    const lastUserMessage = validatedBody.messages
                        .filter((msg: { role: string; content: string }) => msg.role === "user")
                        .pop();
                    if (!lastUserMessage) {
                        throw new Error("No user message found");
                    }
                    question = lastUserMessage.content;

                    const messages = validatedBody.messages as Array<{ role: "user" | "assistant"; content: string }>;
                    conversationHistory = messages.slice(0, -1).map(msg => ({
                        role: msg.role as "user" | "assistant" | "system",
                        content: msg.content,
                    }));
                } else if (validatedBody.question) {
                    question = validatedBody.question;
                } else {
                    throw new Error("No question or messages provided");
                }

                const mode = validatedQuery.mode;

                fastify.log.info(`Question received: "${question}", Mode: "${mode}"`);

                if (!isInitialized) {
                    isInitialized = true;
                }

                reply.header("Access-Control-Allow-Origin", "*");
                reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                reply.header("Access-Control-Allow-Headers", "Content-Type, Accept");

                if (mode === "general-chat") {
                    return fastify.ragService.ask(validatedBody.messages);
                }

                return fastify.ragService.askRAG(question, conversationHistory, startTime);
            } catch (err: unknown) {
                const error = err as Error;
                console.log("error", error);
                const processingTime = Date.now() - startTime;
                fastify.log.error(`Error in /ask endpoint after ${processingTime}ms:`, error);

                if (err instanceof z.ZodError) {
                    reply.code(400);
                    return { error: "Invalid request: " + err.errors.map((e: z.ZodIssue) => e.message).join(", ") };
                }

                if (error.message.includes("Vector store not initialized") || error.message.includes("collection")) {
                    reply.code(503);
                    return { error: "Service unavailable. Please ensure data is indexed first." };
                }

                reply.code(500);
                return { error: "Internal server error" };
            }
        },
    );
};

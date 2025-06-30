import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createDataStreamResponse } from "ai";

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
    model: z.string().optional(),
});

export const registerRoutes = async (fastify: FastifyInstance) => {
    const SKIPPED_IP = process.env.NODE_ENV === "development" ? "::1" : process.env.SKIPPED_IP;

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
            config: {
                rateLimit: {
                    max: 1,
                    timeWindow: "1 day",
                    allowList: (request: any) => {
                        const allowedIPs = [SKIPPED_IP];
                        const clientIP = request.ip;

                        console.log("ALLOWLIST FUNCTION CALLED!");
                        console.log("allowedIPs:", allowedIPs);
                        console.log("request.ip:", clientIP);

                        const shouldAllow = allowedIPs.includes(clientIP);
                        console.log("Should allow (skip rate limit):", shouldAllow);

                        return shouldAllow;
                    },
                    errorResponseBuilder: () => {
                        const errorMessage = `Too many requests from your IP. Please try again later.`;

                        const response = createDataStreamResponse({
                            execute: async () => {
                                throw new Error(errorMessage);
                            },
                            onError: () => errorMessage,
                        });

                        response.headers.set("Access-Control-Allow-Origin", "*");
                        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
                        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");

                        return response;
                    },
                },
            },
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
            },
        },
        async (request, reply) => {
            const startTime = Date.now();

            try {
                if (request.ip !== SKIPPED_IP) {
                    const globalLimit = await fastify.globalLimitService.checkAndIncrementGlobalLimit();
                    if (!globalLimit.allowed) {
                        reply.header("Access-Control-Allow-Origin", "*");
                        reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                        reply.header("Access-Control-Allow-Headers", "Content-Type, Accept");

                        const errorMessage = `Global daily limit has been reached. Please try again tomorrow.`;

                        return createDataStreamResponse({
                            execute: async () => {
                                throw new Error(errorMessage);
                            },
                            onError: () => errorMessage,
                        });
                    }
                }

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
                } else {
                    throw new Error("No question or messages provided");
                }

                const mode = validatedQuery.mode;
                const model = validatedQuery.model;

                fastify.log.info(`Question received: "${question}", Mode: "${mode}", Model: "${model}"`);

                if (!isInitialized) {
                    isInitialized = true;
                }

                reply.header("Access-Control-Allow-Origin", "*");
                reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
                reply.header("Access-Control-Allow-Headers", "Content-Type, Accept");

                if (mode === "general-chat") {
                    return fastify.ragService.ask(validatedBody.messages, model);
                }

                return fastify.ragService.askRAG(question, conversationHistory, startTime, model);
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

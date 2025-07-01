import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import type { CoreMessage } from "ai";

import { askSchema, askQuerySchema } from "../routes/schemas/ask.schema.js";
import { BaseController } from "./baseController.js";

interface AskRequestBody {
    messages?: CoreMessage[];
}

interface AskRequestQuery {
    mode?: string;
    model?: string;
}

const SKIPPED_IP = process.env.NODE_ENV === "development" ? "::1" : process.env.SKIPPED_IP;

type Extracted = { question: string; conversationHistory: CoreMessage[] };

export class AskController extends BaseController {
    constructor(private fastify: FastifyInstance) {
        super();
    }

    async handleAsk(
        request: FastifyRequest<{ Body: AskRequestBody; Querystring: AskRequestQuery }>,
        reply: FastifyReply,
    ): Promise<Response | { error: string }> {
        const startTime = Date.now();

        try {
            if (request.ip !== SKIPPED_IP) {
                const globalLimit = await this.fastify.globalLimitService.checkAndIncrementGlobalLimit();
                if (!globalLimit.allowed) {
                    this.setCorsHeaders(reply);
                    reply.code(429);

                    return {
                        error: "Global daily limit has been reached. Please try again tomorrow.",
                    };
                }
            }

            const validatedBody = this.validateRequest(askSchema, request.body);
            const validatedQuery = this.validateRequest(askQuerySchema, request.query);

            if (!validatedBody.messages?.length) {
                throw new Error("No messages provided");
            }

            const { question, conversationHistory } = this.extractQuestionAndHistory(validatedBody.messages);

            const { mode, model } = validatedQuery;

            this.fastify.log.info(`Question received: "${question}", Mode: "${mode}", Model: "${model}"`);

            this.setCorsHeaders(reply);

            if (mode === "general-chat") {
                return this.fastify.llmService.generateResponse(validatedBody.messages, model);
            }

            return this.fastify.ragOrchestrationService.processRAGQuery(
                question,
                conversationHistory,
                startTime,
                model,
            );
        } catch (error) {
            this.fastify.log.error(`Error in /ask endpoint after ${Date.now() - startTime}ms:`, error);
            this.setCorsHeaders(reply);
            this.handleError(reply, error);

            return { error: "Request processing failed" };
        }
    }

    private extractQuestionAndHistory(messages: CoreMessage[]): Extracted {
        const lastUserMessage = messages.filter(msg => msg.role === "user").pop();

        if (!lastUserMessage) {
            throw new Error("No user message found");
        }

        const question = lastUserMessage.content as string;
        const conversationHistory = messages.slice(0, -1);

        return { question, conversationHistory };
    }
}

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import type { FastifyBaseLogger } from "fastify";

import type { CoreMessage } from "ai";

import { LanguageModels } from "../constants/models.js";

export interface LLMConfig {
    apiKey: string;
    defaultModel?: string;
}

export class LLMService {
    private openrouter: ReturnType<typeof createOpenRouter>;
    private config: LLMConfig;
    private logger: FastifyBaseLogger;

    constructor(config: LLMConfig, logger: FastifyBaseLogger) {
        this.config = config;
        this.logger = logger;

        this.openrouter = createOpenRouter({
            apiKey: config.apiKey,
        });
    }

    private convertModelName(modelName?: string): string {
        return LanguageModels[modelName as keyof typeof LanguageModels] || this.config.defaultModel;
    }

    async generateResponse(
        messages: CoreMessage[],
        modelName?: string,
        onFinish?: (result: { text: string; usage?: { totalTokens?: number } }) => void,
        onError?: (event: { error: unknown }) => void,
    ): Promise<Response> {
        try {
            const response = streamText({
                model: this.openrouter(this.convertModelName(modelName)),
                messages,
                onFinish,
                onError,
            });

            return response.toDataStreamResponse({
                getErrorMessage: error => {
                    return (error as Error)?.message;
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            this.logger.error(`LLM generation failed: ${errorMessage}`);

            return new Response(`Error: ${errorMessage}`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }
}

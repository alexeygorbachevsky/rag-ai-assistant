import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

import { LLMService, type LLMConfig } from "../services/llm.service";
import { LanguageModels } from "../constants/models.js";

declare module "fastify" {
    interface FastifyInstance {
        llmService: LLMService;
    }
}

async function llmPlugin(fastify: FastifyInstance) {
    const config: LLMConfig = {
        apiKey: process.env.OPENROUTER_API_KEY as string,
        defaultModel: LanguageModels["deepseek-chat-v3-0324"],
    };

    const llmService = new LLMService(config, fastify.log);
    fastify.decorate("llmService", llmService);
}

export default fp(llmPlugin, {
    name: "llm-service",
    dependencies: [],
});

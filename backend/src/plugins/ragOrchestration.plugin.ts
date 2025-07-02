import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

import { RAGOrchestrationService, type RAGConfig } from "../services/ragOrchestration.service";
import { RedisCacheService } from "../services/redisCache.service";

declare module "fastify" {
    interface FastifyInstance {
        ragOrchestrationService: RAGOrchestrationService;
    }
}

async function ragOrchestrationPlugin(fastify: FastifyInstance) {
    const config: RAGConfig = {
        scoreThreshold: 0.5,
        maxResults: 100,
    };

    let cacheService: RedisCacheService | undefined;

    if (process.env.ENABLE_CACHE === "true") {
        cacheService = new RedisCacheService(fastify.log);
        await cacheService.connect();
    }

    const ragOrchestrationService = new RAGOrchestrationService(
        fastify.vectorStoreService,
        fastify.llmService,
        config,
        fastify.log,
        cacheService,
    );

    fastify.decorate("ragOrchestrationService", ragOrchestrationService);

    fastify.addHook("onClose", async () => {
        if (cacheService) {
            await cacheService.disconnect();
        }
    });
}

export default fp(ragOrchestrationPlugin, {
    name: "rag-orchestration-service",
    dependencies: ["vector-store-service", "llm-service"],
});

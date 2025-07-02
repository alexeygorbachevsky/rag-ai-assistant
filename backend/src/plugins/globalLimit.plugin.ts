import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

import { GlobalLimitService } from "../services/globalLimit.service";
import { LimitRepository, type LimitRepositoryConfig } from "../repositories/limit.repository";

declare module "fastify" {
    interface FastifyInstance {
        globalLimitService: GlobalLimitService;
    }
}

async function globalLimitPlugin(fastify: FastifyInstance) {
    const config: LimitRepositoryConfig = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        keyPrefix: "rag-ai:global-limit:",
    };

    const limitRepository = new LimitRepository(config, fastify.log);
    const globalLimitService = new GlobalLimitService(limitRepository, fastify.log);

    fastify.decorate("globalLimitService", globalLimitService);

    fastify.addHook("onClose", async () => {
        await globalLimitService.close();
    });
}

export default fp(globalLimitPlugin, {
    name: "global-limit-service",
    dependencies: [],
});

import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { RAGService } from "../services/ragService.js";

declare module "fastify" {
    interface FastifyInstance {
        ragService: RAGService;
    }
}

async function ragPlugin(fastify: FastifyInstance) {
    const ragService = new RAGService(fastify.log);

    fastify.decorate("ragService", ragService);

    fastify.addHook("onClose", async () => {
        await ragService.disconnect();
    });
}

export default fp(ragPlugin);

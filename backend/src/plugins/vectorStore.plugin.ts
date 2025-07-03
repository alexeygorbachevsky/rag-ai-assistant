import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

import { VectorStoreService } from "../services/vectorStore.service";
import { VectorRepository, type VectorRepositoryConfig } from "../repositories/vector.repository";
import { EMBEDDING_MODEL } from "../../scripts/constants/embeddings";

declare module "fastify" {
    interface FastifyInstance {
        vectorStoreService: VectorStoreService;
    }
}

async function vectorStorePlugin(fastify: FastifyInstance) {
    const config: VectorRepositoryConfig = {
        url: process.env.QDRANT_URL as string,
        apiKey: process.env.QDRANT_API_KEY as string,
        collectionName: "mia_collection",
        embeddingModel: EMBEDDING_MODEL,
        // embeddingApiKey: process.env.HF_API_TOKEN as string,
    };

    const vectorRepository = new VectorRepository(config, fastify.log);
    const vectorStoreService = new VectorStoreService(vectorRepository, fastify.log);

    await vectorStoreService.initialize();
    fastify.decorate("vectorStoreService", vectorStoreService);

    fastify.addHook("onClose", async () => {
        await vectorStoreService.disconnect();
    });
}

export default fp(vectorStorePlugin, {
    name: "vector-store-service",
    dependencies: [],
});

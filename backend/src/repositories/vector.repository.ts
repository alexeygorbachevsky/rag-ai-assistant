import { QdrantVectorStore } from "@langchain/qdrant";
import type { FastifyBaseLogger } from "fastify";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

import { LocalEmbeddingsService } from "../services/localEmbeddings.service.js";

export interface VectorRepositoryConfig {
    url: string;
    apiKey: string;
    collectionName: string;
    embeddingModel: string;
    embeddingApiKey?: string;
}

export class VectorRepository {
    private vectorStore: QdrantVectorStore | null = null;
    private embeddings: LocalEmbeddingsService;
    private config: VectorRepositoryConfig;
    private logger: FastifyBaseLogger;

    constructor(config: VectorRepositoryConfig, logger: FastifyBaseLogger) {
        this.config = config;
        this.logger = logger;

        this.embeddings = new LocalEmbeddingsService(config.embeddingModel!);

        // this.embeddings = new HuggingFaceInferenceEmbeddings({
        //     model: config.embeddingModel,
        //     apiKey: config.embeddingApiKey
        // });
    }

    async initialize(): Promise<void> {
        try {
            await this.embeddings.initialize();

            this.vectorStore = await QdrantVectorStore.fromExistingCollection(this.embeddings, {
                url: this.config.url,
                apiKey: this.config.apiKey,
                collectionName: this.config.collectionName,
            });

            this.logger.info(`Vector store initialized for collection: ${this.config.collectionName}`);
        } catch (error) {
            this.logger.error(
                `Failed to initialize vector store: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            throw error;
        }
    }

    async searchSimilar(
        query: string,
        limit: number = 100,
    ): Promise<Array<[{ metadata: Record<string, unknown>; pageContent: string }, number]>> {
        if (!this.vectorStore) {
            throw new Error("Vector store not initialized");
        }

        return this.vectorStore.similaritySearchWithScore(query, limit);
    }

    async disconnect(): Promise<void> {
        this.vectorStore = null;
        this.logger.info("Vector store disconnected");
    }
}

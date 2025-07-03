import crypto from "crypto";
import { LocalEmbeddingsService } from "../localEmbeddings.service";
import type { CacheKeyStrategy, CacheEntry, SemanticCacheEntry } from "../../types/cache.js";
import type Redis from "ioredis";
import { EMBEDDING_MODEL } from "../../../scripts/constants/embeddings";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export class SemanticCacheStrategy implements CacheKeyStrategy {
    private embeddings: LocalEmbeddingsService;
    private redis: Redis;
    private similarityThreshold: number;
    private keyPrefix: string;

    constructor(redis: Redis, keyPrefix = "rag:cache:", similarityThreshold = 0.8) {
        this.redis = redis;
        this.keyPrefix = keyPrefix;
        this.similarityThreshold = similarityThreshold;

        this.embeddings = new LocalEmbeddingsService(EMBEDDING_MODEL);

        // this.embeddings = new HuggingFaceInferenceEmbeddings({
        //     model: EMBEDDING_MODEL,
        //     apiKey: process.env.HF_API_TOKEN as string,
        // });
    }

    async initialize() {
        await this.embeddings.initialize();
    }

    async generateKey(question: string): Promise<string> {
        const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
        return crypto.createHash("sha256").update(normalized).digest("hex");
    }

    async findSimilar(question: string): Promise<CacheEntry | null> {
        if (question.length < 10) {
            this.similarityThreshold = 0.6;
        }

        try {
            await this.initialize();
            const questionEmbedding = await this.embeddings.embedQuery(question);
            const keys = await this.redis.keys("*");

            let bestMatch: SemanticCacheEntry | null = null;
            let bestSimilarity = 0;

            for (const fullKey of keys) {
                const key = fullKey.startsWith(this.keyPrefix) ? fullKey.substring(this.keyPrefix.length) : fullKey;

                const cachedData = await this.redis.get(key);

                if (!cachedData) {
                    continue;
                }

                const cached: SemanticCacheEntry = JSON.parse(cachedData);
                const similarity = this.cosineSimilarity(questionEmbedding, cached.embedding);

                if (similarity > this.similarityThreshold && similarity > bestSimilarity) {
                    bestMatch = cached;
                    bestSimilarity = similarity;
                }
            }

            return bestMatch
                ? {
                      answer: bestMatch.answer,
                      sources: bestMatch.sources,
                      timestamp: bestMatch.timestamp,
                  }
                : null;
        } catch {
            return null;
        }
    }

    async storeWithEmbedding(question: string, entry: CacheEntry, ttl: number): Promise<void> {
        try {
            await this.initialize();
            const embedding = await this.embeddings.embedQuery(question);
            const key = await this.generateKey(question);

            const semanticEntry: SemanticCacheEntry = {
                ...entry,
                originalQuestion: question,
                embedding,
            };

            await this.redis.setex(key, ttl, JSON.stringify(semanticEntry));
        } catch {
            //
        }
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

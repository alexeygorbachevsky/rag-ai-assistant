import crypto from "crypto";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import type { CacheKeyStrategy, CacheEntry, SemanticCacheEntry } from "../../types/cache.js";
import type Redis from "ioredis";

export class SemanticCacheStrategy implements CacheKeyStrategy {
    private embeddings: HuggingFaceInferenceEmbeddings;
    private redis: Redis;
    private similarityThreshold: number;
    private keyPrefix: string;

    constructor(redis: Redis, keyPrefix = "rag:cache:", similarityThreshold = 0.8) {
        this.redis = redis;
        this.keyPrefix = keyPrefix;
        this.similarityThreshold = similarityThreshold;

        // TODO
        this.embeddings = new HuggingFaceInferenceEmbeddings({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            apiKey: process.env.HF_API_TOKEN as string,
        });
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

                console.log("similarity", similarity);

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

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

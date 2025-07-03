import type { CacheService, CacheEntry } from "../types/cache.js";
import { CacheRepository, type CacheRepositoryConfig } from "../repositories/cache.repository.js";
import { HashCacheStrategy } from "./cache/hashCacheStrategy.js";
import { SemanticCacheStrategy } from "./cache/semanticCacheStrategy.js";
import type { FastifyBaseLogger } from "fastify";

export class RedisCacheService implements CacheService {
    private readonly cacheTTL = 86400; // 24 hours
    private cacheRepository: CacheRepository;
    private strategy: HashCacheStrategy | SemanticCacheStrategy;
    private logger?: FastifyBaseLogger;

    constructor(logger?: FastifyBaseLogger, cacheStrategy: "hash" | "semantic" = "semantic") {
        this.logger = logger;

        const cacheConfig: CacheRepositoryConfig = {
            host: process.env.REDIS_HOST!,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            keyPrefix: "rag:cache:",
        };

        this.cacheRepository = new CacheRepository(cacheConfig, logger!);

        if (cacheStrategy === "hash") {
            this.strategy = new HashCacheStrategy();
        } else {
            this.strategy = new SemanticCacheStrategy(this.cacheRepository.getRedisClient(), cacheConfig.keyPrefix);
        }
    }

    async connect(): Promise<void> {
        await this.cacheRepository.connect();
    }

    async get(question: string): Promise<CacheEntry | null> {
        try {
            if (this.strategy instanceof SemanticCacheStrategy) {
                const cached = await this.strategy.findSimilar(question);
                if (cached) {
                    this.logger?.info(`Semantic cache hit for question: "${question}"`);
                }

                return cached;
            }

            const key = await this.strategy.generateKey(question);
            const cached = await this.cacheRepository.get(key);
            if (cached) {
                this.logger?.info(`Hash cache hit for question: "${question}"`);
            }
            return cached;
        } catch (error) {
            this.logger?.error(`Cache get error:`, error);
            return null;
        }
    }

    async set(question: string, entry: CacheEntry): Promise<void> {
        try {
            if (this.strategy instanceof SemanticCacheStrategy) {
                await this.strategy.storeWithEmbedding(question, entry, this.cacheTTL);
                this.logger?.info(`Semantic cache set for question: "${question}"`);
            } else {
                const key = await this.strategy.generateKey(question);
                await this.cacheRepository.set(key, entry, this.cacheTTL);
                this.logger?.info(`Hash cache set for question: "${question}"`);
            }
        } catch (error) {
            this.logger?.error(`Cache set error:`, error);
        }
    }

    async disconnect(): Promise<void> {
        await this.cacheRepository.disconnect();
    }
}

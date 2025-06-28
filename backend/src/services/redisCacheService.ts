import Redis from "ioredis";
import type { CacheService, CacheEntry, CacheConfig, CacheKeyStrategy } from "../types/cache.js";
import { HashCacheStrategy } from "./cache/hashCacheStrategy.js";
import { SemanticCacheStrategy } from "./cache/semanticCacheStrategy.js";
import type { FastifyBaseLogger } from "fastify";

export class RedisCacheService implements CacheService {
    private client: Redis;
    private config: CacheConfig;
    private isConnected = false;
    private strategy!: CacheKeyStrategy;
    private logger?: FastifyBaseLogger;

    constructor(config: Partial<CacheConfig> = {}, logger?: FastifyBaseLogger) {
        this.logger = logger;
        this.config = {
            ttl: 3600,
            keyPrefix: config.keyPrefix || "rag:cache:",
            enabled: config.enabled !== false,
        };

        const redisConfig = {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            // retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keyPrefix: this.config.keyPrefix,
        };

        this.client = new Redis(redisConfig);
        this.setupEventHandlers();
        this.initializeStrategy();
    }

    private initializeStrategy(cacheStrategy = "semantic") {
        switch (cacheStrategy) {
            case "hash":
                this.strategy = new HashCacheStrategy();
                break;
            case "semantic":
            default:
                this.strategy = new SemanticCacheStrategy(this.client, this.config.keyPrefix);
                break;
        }
    }

    private setupEventHandlers() {
        this.client.on("connect", () => {
            this.isConnected = true;
            this.logger?.info("Redis cache connected");
        });

        this.client.on("error", error => {
            this.isConnected = false;
            this.logger?.error("Redis cache error:", error);
        });

        this.client.on("close", () => {
            this.isConnected = false;
            this.logger?.warn("Redis cache connection closed");
        });
    }

    async get(question: string): Promise<CacheEntry | null> {
        if (!this.config.enabled || !this.isConnected) {
            return null;
        }

        const cacheStartTime = Date.now();

        try {
            if (this.strategy.findSimilar) {
                const similar = await this.strategy.findSimilar(question);

                if (similar) {
                    const cacheTime = Date.now() - cacheStartTime;
                    this.logger?.info(`Semantic cache hit in ${cacheTime}ms`);
                }

                return similar;
            }

            const key = await this.strategy.generateKey(question);
            const cached = await this.client.get(key);

            const cacheTime = Date.now() - cacheStartTime;

            if (!cached) {
                this.logger?.info(`Cache miss in ${cacheTime}ms`);
                return null;
            }

            this.logger?.info(`Cache hit in ${cacheTime}ms`);

            return JSON.parse(cached) as CacheEntry;
        } catch (error) {
            const cacheTime = Date.now() - cacheStartTime;
            this.logger?.error(`Cache get error in ${cacheTime}ms:`, error);

            return null;
        }
    }

    async set(question: string, entry: CacheEntry): Promise<void> {
        if (!this.config.enabled || !this.isConnected) {
            return;
        }

        const cacheStartTime = Date.now();

        try {
            if (this.strategy instanceof SemanticCacheStrategy) {
                await this.strategy.storeWithEmbedding(question, entry, this.config.ttl);
            } else {
                const key = await this.strategy.generateKey(question);
                const serialized = JSON.stringify(entry);
                await this.client.setex(key, this.config.ttl, serialized);
            }

            const cacheTime = Date.now() - cacheStartTime;
            this.logger?.info(`Cache set completed in ${cacheTime}ms`);
        } catch (error) {
            const cacheTime = Date.now() - cacheStartTime;
            this.logger?.error(`Cache set error in ${cacheTime}ms:`, error);
        }
    }

    async del(question: string): Promise<void> {
        if (!this.config.enabled || !this.isConnected) {
            return;
        }

        try {
            const key = await this.strategy.generateKey(question);
            await this.client.del(key);
        } catch {
            //
        }
    }

    async exists(question: string): Promise<boolean> {
        if (!this.config.enabled || !this.isConnected) {
            return false;
        }

        try {
            const key = await this.strategy.generateKey(question);
            const result = await this.client.exists(key);
            return result === 1;
        } catch {
            return false;
        }
    }

    async flushAll(): Promise<void> {
        if (!this.config.enabled || !this.isConnected) {
            return;
        }

        try {
            const keys = await this.client.keys("*");
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch {
            //
        }
    }

    async connect(): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        try {
            await this.client.connect();
            this.isConnected = true;
        } catch {
            this.isConnected = false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }

    isEnabled(): boolean {
        return this.config.enabled && this.isConnected;
    }
}

import Redis from "ioredis";
import type { FastifyBaseLogger } from "fastify";

export interface CacheRepositoryConfig {
    host: string;
    port: number;
    password?: string;
    keyPrefix: string;
}

export interface CacheEntry {
    answer: string;
    sources: string[];
    timestamp: number;
}

export class CacheRepository {
    private client: Redis;
    private config: CacheRepositoryConfig;
    private isConnected = false;
    private logger: FastifyBaseLogger;

    constructor(config: CacheRepositoryConfig, logger: FastifyBaseLogger) {
        this.config = config;
        this.logger = logger;

        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            // maxRetriesPerRequest: 1,
            lazyConnect: true,
            keyPrefix: config.keyPrefix,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.client.on("connect", () => {
            this.isConnected = true;
            this.logger.info("Redis cache connected");
        });

        this.client.on("error", error => {
            this.isConnected = false;
            this.logger.error("Redis cache error:", error);
        });

        this.client.on("close", () => {
            this.isConnected = false;
            this.logger.warn("Redis cache connection closed");
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.isConnected = true;
        } catch {
            this.isConnected = false;
        }
    }

    async get(key: string): Promise<CacheEntry | null> {
        if (!this.isConnected){
            return null
        }

        try {
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }

    async set(key: string, value: CacheEntry, ttl: number): Promise<void> {
        if (!this.isConnected){
            return
        }

        try {
            await this.client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            this.logger.error("Cache set error:", error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }

    getRedisClient(): Redis {
        return this.client;
    }
}

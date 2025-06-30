import Redis from "ioredis";
import type { FastifyBaseLogger } from "fastify";

interface InMemoryStorage {
    [key: string]: {
        count: number;
        timestamp: number;
    };
}

export class GlobalLimitService {
    private client: Redis;
    private logger?: FastifyBaseLogger;
    private readonly keyPrefix = "rag-ai:global-limit:";
    private inMemoryStorage: InMemoryStorage = {};
    private isRedisConnected = true;

    private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    private static readonly DAILY_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours
    private static readonly ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    constructor(logger?: FastifyBaseLogger) {
        this.logger = logger;

        this.client = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 0,
            enableReadyCheck: true,
            connectTimeout: 5000,
            lazyConnect: true,
        });

        this.client.on("error", error => {
            this.logger?.error("Redis connection error:", error);
            this.isRedisConnected = false;
        });

        this.client.on("connect", () => {
            this.logger?.info("Redis connected successfully");
            this.isRedisConnected = true;
        });

        this.client.on("ready", () => {
            this.logger?.info("Redis is ready");
            this.isRedisConnected = true;
        });

        this.client.on("close", () => {
            this.logger?.warn("Redis connection closed");
            this.isRedisConnected = false;
        });

        setInterval(() => {
            this.cleanupInMemoryStorage();
        }, GlobalLimitService.CLEANUP_INTERVAL_MS);
    }

    private cleanupInMemoryStorage(): void {
        const now = Date.now();
        const oneDayAgo = now - GlobalLimitService.ONE_DAY_MS;

        Object.keys(this.inMemoryStorage).forEach(key => {
            if (this.inMemoryStorage[key].timestamp < oneDayAgo) {
                delete this.inMemoryStorage[key];
            }
        });
    }

    private getTodayKey(): string {
        const today = new Date().toISOString().split("T")[0];
        return `${this.keyPrefix}${today}`;
    }

    private async useRedisStorage(): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
        const limit = parseInt(process.env.GLOBAL_DAILY_LIMIT || "10");
        const key = this.getTodayKey();

        const multi = this.client.multi();
        multi.incr(key);
        multi.expire(key, GlobalLimitService.DAILY_EXPIRY_SECONDS);

        const results = await multi.exec();
        const currentCount = (results?.[0]?.[1] as number) || 0;

        const allowed = currentCount <= limit;

        if (!allowed) {
            await this.client.decr(key);
        }

        return {
            allowed,
            currentCount: allowed ? currentCount : currentCount - 1,
            limit,
        };
    }

    private useInMemoryStorage(): { allowed: boolean; currentCount: number; limit: number } {
        const limit = parseInt(process.env.GLOBAL_DAILY_LIMIT || "10");
        const key = this.getTodayKey();
        const now = Date.now();

        if (!this.inMemoryStorage[key]) {
            this.inMemoryStorage[key] = {
                count: 0,
                timestamp: now,
            };
        }

        const entryDate = new Date(this.inMemoryStorage[key].timestamp).toISOString().split("T")[0];
        const todayDate = new Date().toISOString().split("T")[0];

        if (entryDate !== todayDate) {
            this.inMemoryStorage[key] = {
                count: 0,
                timestamp: now,
            };
        }

        this.inMemoryStorage[key].count++;
        const currentCount = this.inMemoryStorage[key].count;
        const allowed = currentCount <= limit;

        if (!allowed) {
            this.inMemoryStorage[key].count--;
        }

        return {
            allowed,
            currentCount: allowed ? currentCount : currentCount - 1,
            limit,
        };
    }

    async checkAndIncrementGlobalLimit(): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
        try {
            if (this.isRedisConnected) {
                return await this.useRedisStorage();
            } else {
                this.logger?.info("Using in-memory storage for global limits (Redis unavailable)");
                return this.useInMemoryStorage();
            }
        } catch (error) {
            this.logger?.error("Error checking global limit with Redis, falling back to in-memory storage:", error);
            this.isRedisConnected = false;
            return this.useInMemoryStorage();
        }
    }

    async close(): Promise<void> {
        await this.client.quit();
    }
}

import Redis from "ioredis";
import type { FastifyBaseLogger } from "fastify";

export interface LimitRepositoryConfig {
    host: string;
    port: number;
    password?: string;
    keyPrefix: string;
}

export interface LimitResult {
    allowed: boolean;
    currentCount: number;
    limit: number;
}

export class LimitRepository {
    private client: Redis;
    private config: LimitRepositoryConfig;
    private isConnected = true;
    private logger: FastifyBaseLogger;
    private inMemoryStorage: Record<string, { count: number; timestamp: number }> = {};

    private static readonly DAILY_EXPIRY_SECONDS = 24 * 60 * 60;
    private static readonly ONE_DAY_MS = 24 * 60 * 60 * 1000;

    constructor(config: LimitRepositoryConfig, logger: FastifyBaseLogger) {
        this.config = config;
        this.logger = logger;

        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            maxRetriesPerRequest: 0,
            enableReadyCheck: true,
            connectTimeout: 5000,
            lazyConnect: true,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.client.on("error", error => {
            this.logger.error("Redis connection error:", error);
            this.isConnected = false;
        });

        this.client.on("connect", () => {
            this.logger.info("Redis connected successfully");
            this.isConnected = true;
        });

        this.client.on("close", () => {
            this.logger.warn("Redis connection closed");
            this.isConnected = false;
        });
    }

    private getTodayKey(): string {
        const today = new Date().toISOString().split("T")[0];
        return `${this.config.keyPrefix}${today}`;
    }

    async incrementAndCheck(limit: number): Promise<LimitResult> {
        try {
            if (this.isConnected) {
                return await this.useRedisStorage(limit);
            }

            this.logger.info("Using in-memory storage for global limits (Redis unavailable)");

            return this.useInMemoryStorage(limit);
        } catch (error) {
            this.logger.error("Error checking global limit with Redis, falling back to in-memory storage:", error);
            this.isConnected = false;

            return this.useInMemoryStorage(limit);
        }
    }

    private async useRedisStorage(limit: number): Promise<LimitResult> {
        const key = this.getTodayKey();

        const multi = this.client.multi();
        multi.incr(key);
        multi.expire(key, LimitRepository.DAILY_EXPIRY_SECONDS);

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

    private useInMemoryStorage(limit: number): LimitResult {
        const key = this.getTodayKey();
        const now = Date.now();

        if (!this.inMemoryStorage[key]) {
            this.inMemoryStorage[key] = { count: 0, timestamp: now };
        }

        const entryDate = new Date(this.inMemoryStorage[key].timestamp).toISOString().split("T")[0];
        const todayDate = new Date().toISOString().split("T")[0];

        if (entryDate !== todayDate) {
            this.inMemoryStorage[key] = { count: 0, timestamp: now };
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

    cleanupInMemoryStorage(): void {
        const now = Date.now();
        const oneDayAgo = now - LimitRepository.ONE_DAY_MS;

        Object.keys(this.inMemoryStorage).forEach(key => {
            if (this.inMemoryStorage[key].timestamp < oneDayAgo) {
                delete this.inMemoryStorage[key];
            }
        });
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

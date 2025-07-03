import type { FastifyBaseLogger } from "fastify";

import type { LimitRepository } from "../repositories/limit.repository.js";

export class GlobalLimitService {
    private limitRepository: LimitRepository;
    private logger: FastifyBaseLogger;
    private cleanupInterval: NodeJS.Timeout;

    private static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

    constructor(limitRepository: LimitRepository, logger: FastifyBaseLogger) {
        this.limitRepository = limitRepository;
        this.logger = logger;

        this.cleanupInterval = setInterval(() => {
            this.limitRepository.cleanupInMemoryStorage();
        }, GlobalLimitService.CLEANUP_INTERVAL_MS);
    }

    async checkAndIncrementGlobalLimit(): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
        const limit = parseInt(process.env.GLOBAL_DAILY_LIMIT || "10");
        return this.limitRepository.incrementAndCheck(limit);
    }

    async close(): Promise<void> {
        clearInterval(this.cleanupInterval);
        await this.limitRepository.disconnect();
    }
}

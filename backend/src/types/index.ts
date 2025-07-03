import type { GlobalLimitService } from "../services/globalLimit.service.js";

declare module "fastify" {
    interface FastifyInstance {
        globalLimitService: GlobalLimitService;
    }
}

export interface SearchResult {
    content: string;
    metadata: {
        objectId: string;
        title?: string;
        artist?: string;
        source: string;
        filename?: string;
    };
    score: number;
}

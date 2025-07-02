import type { FastifyBaseLogger } from "fastify";
import type { VectorRepository } from "../repositories/vector.repository";

export class VectorStoreService {
    private vectorRepository: VectorRepository;
    private logger: FastifyBaseLogger;

    constructor(vectorRepository: VectorRepository, logger: FastifyBaseLogger) {
        this.vectorRepository = vectorRepository;
        this.logger = logger;
    }

    async initialize(): Promise<void> {
        await this.vectorRepository.initialize();
    }

    async search(
        query: string,
        limit: number = 100,
    ): Promise<Array<[{ metadata: Record<string, unknown>; pageContent: string }, number]>> {
        return this.vectorRepository.searchSimilar(query, limit);
    }

    async disconnect(): Promise<void> {
        await this.vectorRepository.disconnect();
    }
}

export interface CacheEntry {
    answer: string;
    sources: string[];
    timestamp: number;
}

export interface CacheService {
    get(key: string): Promise<CacheEntry | null>;
    set(key: string, entry: CacheEntry, ttl?: number): Promise<void>;
    disconnect(): Promise<void>;
}

export interface CacheKeyStrategy {
    generateKey(question: string): Promise<string>;
    findSimilar?(question: string): Promise<CacheEntry | null>;
}

export interface SemanticCacheEntry extends CacheEntry {
    originalQuestion: string;
    embedding: number[];
    similarity?: number;
}

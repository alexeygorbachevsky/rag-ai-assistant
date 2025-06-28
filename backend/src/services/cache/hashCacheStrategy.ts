import crypto from "crypto";

import type { CacheKeyStrategy } from "../../types/cache.js";

export class HashCacheStrategy implements CacheKeyStrategy {
    async generateKey(question: string) {
        const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");

        return crypto.createHash("sha256").update(normalized).digest("hex");
    }
}

export const fastifyEnvSchema = {
    type: "object",
    properties: {
        HF_API_TOKEN: {
            type: "string",
            description: "HuggingFace API token",
        },
        OPENROUTER_API_KEY: {
            type: "string",
            description: "OpenRouter API key",
        },
        QDRANT_URL: {
            type: "string",
            description: "Qdrant database URL",
        },
        QDRANT_API_KEY: {
            type: "string",
            description: "Qdrant API key (optional)",
        },
        REDIS_HOST: {
            type: "string",
            default: "localhost",
            description: "Redis host",
        },
        REDIS_PORT: {
            type: "integer",
            default: 6379,
            description: "Redis port",
        },
        REDIS_PASSWORD: {
            type: "string",
            description: "Redis password (optional)",
        },
        REDIS_DB: {
            type: "integer",
            default: 0,
            description: "Redis database number",
        },
        PORT: {
            type: "integer",
            default: 3001,
            description: "Server port",
        },
        HOST: {
            type: "string",
            default: "0.0.0.0",
            description: "Server host",
        },
        NODE_ENV: {
            type: "string",
            enum: ["development", "production", "test"],
            default: "development",
            description: "Environment mode",
        },
        SKIPPED_IP: {
            type: "string",
            description: "IP address to skip rate limiting (optional)",
        },
        GLOBAL_DAILY_LIMIT: {
            type: ["integer", "null"],
            description: "Global daily request limit",
        },
        IP_DAILY_LIMIT: {
            type: ["integer", "null"],
            description: "Daily request limit per IP address",
        },
        ENABLE_CACHE: {
            type: "boolean",
            default: false,
            description: "Enable caching for RAG responses",
        },
    },
};

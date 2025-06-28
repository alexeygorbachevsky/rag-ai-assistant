import { z } from "zod";

const envSchema = z.object({
    HF_API_TOKEN: z.string().min(1, "HuggingFace API token is required"),
    OPENROUTER_API_KEY: z.string().min(1, "OpenRouter API key is required"),
    QDRANT_URL: z.string().url("Valid Qdrant URL is required"),
    QDRANT_API_KEY: z.string().optional(),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().default(0),
    PORT: z.coerce.number().default(3001),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type EnvConfig = z.infer<typeof envSchema>;

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
    },
};

export const validateEnv = (processEnv: NodeJS.ProcessEnv): EnvConfig => {
    try {
        return envSchema.parse(processEnv);
    } catch (error) {
        process.exit(1);
    }
};

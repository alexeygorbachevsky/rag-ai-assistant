import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyRateLimit from "@fastify/rate-limit";

import { fastifyEnvSchema } from "./config/env.js";

import swaggerPlugin from "./plugins/swaggerPlugin";
import vectorStorePlugin from "./plugins/vectorStorePlugin.js";
import llmPlugin from "./plugins/llmPlugin.js";
import globalLimitPlugin from "./plugins/globalLimitPlugin.js";
import ragOrchestrationPlugin from "./plugins/ragOrchestrationPlugin.js";
import corsPlugin from "./plugins/corsPlugin";

import { registerRoutes } from "./routes/index.js";

const fastify = Fastify({
    logger: {
        level: process.env.NODE_ENV === "production" ? "warn" : "info",
    },
    trustProxy: true,
});

await fastify.register(fastifyEnv, {
    schema: fastifyEnvSchema,
    dotenv: true,
});

await fastify.register(corsPlugin, { envConfig: process.env });
await fastify.register(fastifyRateLimit, { global: false });
await fastify.register(swaggerPlugin);

try {
    await fastify.register(vectorStorePlugin);
    await fastify.register(llmPlugin);
    await fastify.register(globalLimitPlugin);
    await fastify.register(ragOrchestrationPlugin);
    fastify.log.info("All service plugins registered successfully");
} catch (error) {
    fastify.log.error("Failed to register service plugins:", error);
    process.exit(1);
}

await registerRoutes(fastify);

const setupShutdown = () => {
    const launchShutdown = async () => {
        fastify.log.info("Shutting down server...");

        try {
            await fastify.close();
            process.exit(0);
        } catch (error) {
            fastify.log.error("Error during shutdown:", error);
            process.exit(1);
        }
    };

    process.on("SIGTERM", launchShutdown);
    process.on("SIGINT", launchShutdown);
};

const start = async () => {
    try {
        setupShutdown();

        await fastify.listen({
            port: Number(process.env.PORT),
            host: process.env.HOST,
        });

        fastify.log.info(`Server listening on ${process.env.HOST}:${process.env.PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

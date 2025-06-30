import Fastify from "fastify";
import fastifyEnv from "@fastify/env";

import { validateEnv, fastifyEnvSchema } from "./config/env.js";
import corsPlugin from "./plugins/cors.js";
import ragPlugin from "./plugins/ragPlugin.js";
import swaggerPlugin from "./plugins/swagger.js";
import { GlobalLimitService } from "./services/globalLimitService.js";
import { registerRoutes } from "./routes/ask.js";
import fastifyRateLimit from "@fastify/rate-limit";

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

const envConfig = validateEnv(process.env);

await fastify.register(corsPlugin, { envConfig });

await fastify.register(fastifyRateLimit, {
    global: false,
});

await fastify.register(swaggerPlugin);

const globalLimitService = new GlobalLimitService(fastify.log);
fastify.decorate("globalLimitService", globalLimitService);

try {
    await fastify.register(ragPlugin);
    fastify.log.info("RAG plugin registered successfully");
} catch (error) {
    fastify.log.error("Failed to register RAG plugin:", error);
    process.exit(1);
}

await registerRoutes(fastify);

const setupGracefulShutdown = () => {
    const gracefulShutdown = async () => {
        fastify.log.info("Shutting down server...");

        try {
            await globalLimitService.close();
            await fastify.close();
            process.exit(0);
        } catch (error) {
            fastify.log.error("Error during shutdown:", error);
            process.exit(1);
        }
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
};

const start = async () => {
    try {
        setupGracefulShutdown();

        await fastify.listen({
            port: envConfig.PORT,
            host: envConfig.HOST,
        });

        fastify.log.info(`Server listening on ${envConfig.HOST}:${envConfig.PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

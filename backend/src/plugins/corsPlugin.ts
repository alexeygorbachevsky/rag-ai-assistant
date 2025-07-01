import type { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";

interface CorsPluginOptions {
    envConfig: NodeJS.ProcessEnv;
}

const corsPlugin: FastifyPluginAsync<CorsPluginOptions> = async function (fastify, opts) {
    const { envConfig } = opts;

    await fastify.register(cors, {
        origin: envConfig.NODE_ENV === "production" ? ["https://domain.com"] : true,
        credentials: true,
    });
};

export default corsPlugin;

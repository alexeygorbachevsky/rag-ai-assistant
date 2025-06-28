import type { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";

import type { EnvConfig } from "../config/env.js";

interface CorsPluginOptions {
    envConfig: EnvConfig;
}

const corsPlugin: FastifyPluginAsync<CorsPluginOptions> = async function (fastify, opts) {
    const { envConfig } = opts;

    await fastify.register(cors, {
        origin: envConfig.NODE_ENV === "production" ? ["https://domain.com"] : true,
        credentials: true,
    });
};

export default corsPlugin;

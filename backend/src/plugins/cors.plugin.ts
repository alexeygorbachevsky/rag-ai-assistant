import { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";

interface CorsPluginOptions {
    envConfig: NodeJS.ProcessEnv;
}

const corsPlugin: FastifyPluginAsync<CorsPluginOptions> = async function (fastify) {
    // FIXME: allow all origins temporarily
    await fastify.register(cors, {
        origin: true,
        credentials: true,
    });
};

export default corsPlugin;

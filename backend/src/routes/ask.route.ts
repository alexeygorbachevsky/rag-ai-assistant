import type { FastifyInstance } from "fastify";

import { askRouteSchema } from "./schemas/ask.schema.js";
import { optionsHandler } from "../middlewares/cors.middleware.js";
import { rateLimitConfig } from "../middlewares/rateLimit.middleware.js";
import { AskController } from "../controllers/ask.controller.js";

const askRoute = async (fastify: FastifyInstance) => {
    const askController = new AskController(fastify);

    fastify.options("/ask", optionsHandler);

    fastify.post(
        "/ask",
        {
            config: {
                rateLimit: rateLimitConfig,
            },
            schema: askRouteSchema,
        },
        askController.handleAsk.bind(askController),
    );
};

export default askRoute;

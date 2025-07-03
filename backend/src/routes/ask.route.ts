import type { FastifyInstance } from "fastify";

import { askRouteSchema } from "./schemas/ask.schema.js";
import { optionsHandler } from "../middlewares/cors.middleware.js";
import { getRateLimitConfig } from "../middlewares/rateLimit.middleware.js";
import { AskController } from "../controllers/ask.controller.js";

const askRoute = async (fastify: FastifyInstance) => {
    const askController = new AskController(fastify);

    fastify.options("/ask", optionsHandler);

    fastify.post(
        "/ask",
        {
            config: {
                rateLimit: getRateLimitConfig(),

            },
            schema: askRouteSchema,
        },
        askController.handleAsk.bind(askController),
    );
};

export default askRoute;

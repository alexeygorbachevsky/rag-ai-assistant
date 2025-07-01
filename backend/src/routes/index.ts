import type { FastifyInstance } from "fastify";

import homeRoute from "./home.route.js";
import askRoute from "./ask.route.js";

export const registerRoutes = async (fastify: FastifyInstance) => {
    await fastify.register(homeRoute);
    await fastify.register(askRoute);
};

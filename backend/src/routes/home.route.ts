import type { FastifyInstance } from "fastify";

const homeRoute = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_request, _reply) => {
        return { message: "Hi, what can I help with?" };
    });
};

export default homeRoute;

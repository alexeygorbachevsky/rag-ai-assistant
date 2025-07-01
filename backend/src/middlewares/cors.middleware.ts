import type { FastifyRequest, FastifyReply } from "fastify";

export const corsHeaders = (reply: FastifyReply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Accept");
};

export const optionsHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    corsHeaders(reply);
    reply.code(204).send();
};
